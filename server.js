const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// SQLite Datenbank initialisieren
const db = new sqlite3.Database('./wohnmobil.db', (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err);
    } else {
        console.log('✅ SQLite Datenbank verbunden');
        initializeDatabase();
    }
});

// Hilfsfunktion für Database Queries mit Promise
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Datenbank-Tabellen erstellen
function initializeDatabase() {
    db.serialize(() => {
        // Benutzer-Tabelle
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                consentGiven INTEGER DEFAULT 0,
                consentDate TEXT,
                emailVerified INTEGER DEFAULT 0,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Verifikations-Token Tabelle
        db.run(`
            CREATE TABLE IF NOT EXISTS verificationTokens (
                token TEXT PRIMARY KEY,
                userId INTEGER NOT NULL,
                expiresAt INTEGER NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        // 2FA-Codes Tabelle
        db.run(`
            CREATE TABLE IF NOT EXISTS twoFactorCodes (
                userId INTEGER PRIMARY KEY,
                code TEXT NOT NULL,
                expiresAt INTEGER NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        // Cookie-Zustimmungs-Log (GDPR-Audit)
        db.run(`
            CREATE TABLE IF NOT EXISTS cookieConsents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                sessionId TEXT,
                ipAddress TEXT,
                userAgent TEXT,
                necessary INTEGER DEFAULT 1,
                analytics INTEGER DEFAULT 0,
                marketing INTEGER DEFAULT 0,
                consentGiven INTEGER DEFAULT 0,
                consentDate TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });
}

// In-Memory Speicher für Tokens (kurzzeitig, werden nicht in DB gespeichert)
let verificationTokens = {};
let twoFactorCodes = {};

// Nodemailer Setup: flexible via Umgebungsvariablen (einfachste Option: Gmail SMTP mit App-Passwort)
let transporter;
if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: (process.env.MAIL_SECURE === 'true'), // true for 465
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
} else {
    // Fallback: Ethereal (Test-Account) - keine echte Zustellung
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'erika.denesik64@ethereal.email',
            pass: 'NxdWmqJvVjBCwfNa7P'
        }
    });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (index.html, script.js, style.css, images...)
app.use(express.static(path.join(__dirname)));

app.use(session({
    secret: 'geheimesitzungsschluessel',
    resave: false,
    saveUninitialized: false
}));

// Startseite - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Registrierung - HTML-Formular
app.get('/register', (req, res) => {
    res.send(`
        <h2>Registrieren</h2>
        <form action="/register" method="POST">
            Benutzername: <input name="username" required /><br/>
            Passwort: <input name="password" type="password" required /><br/>
            <button type="submit">Registrieren</button>
        </form>
    `);
});

// Registrierung - POST
app.post('/register', async (req, res) => {
    const { username, email, password, consent } = req.body;

    try {
        // Validierung: Consent muss true sein
        if (!consent || consent !== true) {
            return res.status(400).json({ success: false, message: '❌ Sie müssen der Datenschutzerklärung zustimmen.' });
        }

        // Validierung: E-Mail Format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: '❌ Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
        }

        // Prüfen, ob Benutzer existiert
        const existingUser = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) {
            const msg = existingUser.username === username ? '❌ Benutzername existiert bereits.' : '❌ Diese E-Mail-Adresse ist bereits registriert.';
            return res.status(409).json({ success: false, message: msg });
        }

        // Passwortanforderungen prüfen (sicherheit)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({ success: false, message: '❌ Das Passwort erfüllt nicht die Mindestanforderungen.' });
        }

        // Passwort hashen
        const passwordHash = await bcrypt.hash(password, 10);

        // Benutzer in DB speichern
        const result = await dbRun(
            'INSERT INTO users (username, email, passwordHash, consentGiven, consentDate, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, 1, new Date().toISOString(), 0]
        );
        const userId = result.id;

        // Verifikations-Token generieren (24h gültig)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        verificationTokens[verificationToken] = {
            userId: userId,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        };

        // E-Mail vorbereiten
        const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: 'noreply@camperlife.de',
            to: email,
            subject: '🚐 CamperLife: Bestätigen Sie Ihre E-Mail-Adresse',
            html: `
                <h2>Willkommen bei CamperLife! 🚐</h2>
                <p>Hallo <strong>${username}</strong>,</p>
                <p>vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:</p>
                <p><a href="${verificationLink}" style="display:inline-block; padding:10px 20px; background-color:#0066cc; color:white; text-decoration:none; border-radius:5px; font-weight:bold;">E-Mail bestätigen</a></p>
                <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
                <p><code>${verificationLink}</code></p>
                <p>Dieser Link ist 24 Stunden gültig.</p>
                <p>Mit freundlichen Grüßen,<br/>Ihr CamperLife Team</p>
            `
        };

        // Logge Benutzer direkt ein (Session setzen)
        req.session.userId = userId;

        try {
            await transporter.sendMail(mailOptions);
            return res.json({ success: true, message: '✅ Registrierung erfolgreich! Ein Bestätigungslink wurde an Ihre E-Mail gesendet.', emailSent: true, username, email });
        } catch (error) {
            console.error('E-Mail-Fehler:', error);
            // Trotz E-Mail-Fehler ist der Benutzer registriert und eingeloggt
            return res.json({ success: true, message: '⚠️ Registrierung erfolgreich, aber E-Mail konnte nicht versendet werden.', emailSent: false, username, email });
        }
    } catch (error) {
        console.error('Registrierungs-Fehler:', error);
        return res.status(500).json({ success: false, message: '❌ Fehler bei der Registrierung.' });
    }
});

// E-Mail-Verifikation
app.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.send('<h2>❌ Ungültiger oder fehlender Token</h2>');
    }

    const tokenData = verificationTokens[token];
    if (!tokenData) {
        return res.send('<h2>❌ Token nicht gefunden</h2>');
    }

    // Prüfen, ob Token abgelaufen ist
    if (Date.now() > tokenData.expiresAt) {
        delete verificationTokens[token];
        return res.send('<h2>❌ Token ist abgelaufen. Bitte registrieren Sie sich erneut.</h2>');
    }

    // Benutzer finden und E-Mail als verifiziert markieren
    try {
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [tokenData.userId]);
        if (user) {
            await dbRun('UPDATE users SET emailVerified = 1 WHERE id = ?', [tokenData.userId]);
            delete verificationTokens[token];
            return res.send(`
                <h2>✅ E-Mail-Adresse bestätigt!</h2>
                <p>Vielen Dank für die Bestätigung. Sie können sich nun <a href="/">einloggen</a>.</p>
            `);
        }
        res.send('<h2>❌ Fehler: Benutzer nicht gefunden</h2>');
    } catch (error) {
        console.error('Verifikations-Fehler:', error);
        res.send('<h2>❌ Fehler bei der Verifikation</h2>');
    }
});

// Login - HTML-Formular
app.get('/login', (req, res) => {
    res.send(`
        <h2>Login</h2>
        <form action="/login" method="POST">
            Benutzername: <input name="username" required /><br/>
            Passwort: <input name="password" type="password" required /><br/>
            <button type="submit">Login</button>
        </form>
    `);
});

// Login - POST (Schritt 1: Credentials prüfen + 2FA-Code senden)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.json({ success: false, message: '❌ Benutzer nicht gefunden.' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.json({ success: false, message: '❌ Falsches Passwort.' });
        }

        // Prüfen, ob E-Mail verifiziert ist
        if (!user.emailVerified) {
            return res.json({ success: false, message: '❌ Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse.' });
        }

        // Credentials OK: 2FA-Code generieren (6-stellig)
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        twoFactorCodes[user.id] = {
            code: twoFactorCode,
            expiresAt: Date.now() + (10 * 60 * 1000) // 10 Minuten gültig
        };

        // 2FA-Code per E-Mail senden
        const mailOptions = {
            from: 'noreply@camperlife.de',
            to: user.email,
            subject: '🔐 CamperLife: Ihr Login-Code',
            html: `
                <h2>Ihr Login-Code 🔐</h2>
                <p>Hallo <strong>${user.username}</strong>,</p>
                <p>Sie versuchen sich in Ihr CamperLife-Konto einzuloggen. Verwenden Sie diesen Code:</p>
                <h1 style="letter-spacing: 5px; font-size: 2rem; color: #0066cc;">${twoFactorCode}</h1>
                <p>Dieser Code ist 10 Minuten gültig.</p>
                <p>Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
                <p>Mit freundlichen Grüßen,<br/>Ihr CamperLife Team</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            // Speichere userId in Session (ohne ihn einzuloggen)
            req.session.loginInProgress = user.id;
            res.json({ success: true, message: '✅ Ein Login-Code wurde an Ihre E-Mail gesendet. Bitte geben Sie ihn ein.', requiresCode: true });
        } catch (error) {
            console.error('2FA E-Mail-Fehler:', error);
            res.json({ success: false, message: '⚠️ E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.' });
        }
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.json({ success: false, message: '❌ Fehler beim Login.' });
    }
});

// 2FA Code Verifikation - POST (Schritt 2: Code prüfen und einloggen)
app.post('/verify-2fa', (req, res) => {
    const { code } = req.body;
    const userId = req.session.loginInProgress;

    if (!userId) {
        return res.json({ success: false, message: '❌ Keine aktive Login-Anfrage. Bitte versuchen Sie erneut.' });
    }

    const twoFaData = twoFactorCodes[userId];
    if (!twoFaData) {
        return res.json({ success: false, message: '❌ Kein 2FA-Code gefunden. Bitte versuchen Sie erneut zu loggen.' });
    }

    // Prüfen, ob Code abgelaufen ist
    if (Date.now() > twoFaData.expiresAt) {
        delete twoFactorCodes[userId];
        req.session.loginInProgress = null;
        return res.json({ success: false, message: '❌ Code ist abgelaufen. Bitte versuchen Sie erneut zu loggen.' });
    }

    // Code prüfen
    if (code !== twoFaData.code) {
        return res.json({ success: false, message: '❌ Falscher Code. Versuchen Sie es erneut.' });
    }

    // Code korrekt: Benutzer einloggen
    delete twoFactorCodes[userId];
    req.session.userId = userId;
    req.session.loginInProgress = null;

    res.json({ success: true, message: '✅ Login erfolgreich!' });
});

// Geschützte Seite
app.get('/dashboard', async (req, res) => {
    try {
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [req.session.userId]);
        if (!user) {
            return res.redirect('/');
        }
        return res.redirect('/');
    } catch (error) {
        console.error('Dashboard-Fehler:', error);
        return res.redirect('/');
    }
});

// API: aktueller eingeloggter User
app.get('/api/me', async (req, res) => {
    try {
        const user = await dbGet('SELECT username, email, emailVerified FROM users WHERE id = ?', [req.session.userId]);
        if (!user) return res.json({ loggedIn: false });
        return res.json({ loggedIn: true, username: user.username, email: user.email, emailVerified: user.emailVerified });
    } catch (error) {
        console.error('API /me Fehler:', error);
        return res.json({ loggedIn: false });
    }
});

// API: Profil aktualisieren (Benutzername + E-Mail)
app.post('/api/update-profile', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Nicht eingeloggt.' });

    const { username, email } = req.body;
    
    try {
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden.' });

        // Validierung
        if (!username || !email) return res.status(400).json({ success: false, message: 'Benutzername und E-Mail sind erforderlich.' });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Ungültige E-Mail-Adresse.' });

        // Prüfen auf Konflikte (andere Benutzer mit dem gleichen Namen / E-Mail)
        const otherWithName = await dbGet('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (otherWithName) return res.status(409).json({ success: false, message: 'Benutzername ist bereits vergeben.' });

        const otherWithEmail = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (otherWithEmail) return res.status(409).json({ success: false, message: 'E-Mail ist bereits vergeben.' });

        const emailChanged = (user.email !== email);
        
        await dbRun('UPDATE users SET username = ?, email = ?, emailVerified = ? WHERE id = ?', 
            [username, email, emailChanged ? 0 : user.emailVerified, userId]);
        
        if (emailChanged) {
            // Neue Verifikations-Mail senden
            const verificationToken = crypto.randomBytes(32).toString('hex');
            verificationTokens[verificationToken] = {
                userId: userId,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000)
            };
            const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
            const mailOptions = {
                from: 'noreply@camperlife.de',
                to: email,
                subject: '🚐 CamperLife: Bitte bestätigen Sie Ihre neue E-Mail-Adresse',
                html: `
                    <h2>E-Mail-Adresse geändert</h2>
                    <p>Hallo <strong>${username}</strong>,</p>
                    <p>Bitte bestätigen Sie Ihre neue E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
                    <p><a href="${verificationLink}">E-Mail bestätigen</a></p>
                `
            };

            transporter.sendMail(mailOptions).catch(err => console.error('Fehler beim Senden der Verifikationsmail:', err));
        }

        return res.json({ success: true, message: 'Profil aktualisiert.', emailChanged });
    } catch (error) {
        console.error('Update-Profile-Fehler:', error);
        return res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Profils.' });
    }
});

// API: Passwort ändern
app.post('/api/change-password', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Nicht eingeloggt.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Alle Passwortfelder sind erforderlich.' });

    try {
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden.' });

        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) return res.status(400).json({ success: false, message: 'Aktuelles Passwort ist falsch.' });

        // Passwortanforderungen: mindestens 8 Zeichen, Großbuchstabe, Kleinbuchstabe, Zahl, Sonderzeichen
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        if (!passwordRegex.test(newPassword)) return res.status(400).json({ success: false, message: 'Neues Passwort erfüllt nicht die Mindestanforderungen.' });

        const newHash = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, userId]);
        return res.json({ success: true, message: 'Passwort erfolgreich geändert.' });
    } catch (error) {
        console.error('Change-Password-Fehler:', error);
        return res.status(500).json({ success: false, message: 'Fehler beim Ändern des Passworts.' });
    }
});

// Cookie Consent Logging (GDPR-Audit)
app.post('/api/log-cookie-consent', async (req, res) => {
    try {
        const { necessary, analytics, marketing } = req.body;
        const userId = req.session.userId || null;
        const sessionId = req.sessionID || null;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        await dbRun(`
            INSERT INTO cookieConsents (userId, sessionId, ipAddress, userAgent, necessary, analytics, marketing, consentGiven)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [userId, sessionId, ipAddress, userAgent, necessary ? 1 : 0, analytics ? 1 : 0, marketing ? 1 : 0]);

        console.log(`✅ Cookie-Zustimmung protokolliert: necessary=${necessary}, analytics=${analytics}, marketing=${marketing}`);
        return res.json({ success: true, message: 'Cookie-Zustimmung protokolliert.' });
    } catch (error) {
        console.error('Cookie-Consent-Fehler:', error);
        return res.status(500).json({ success: false, message: 'Fehler beim Protokollieren der Cookie-Zustimmung.' });
    }
});

// Admin-Log: Cookie Consents abrufen (nur für Debugging/Admin)
app.get('/api/admin/cookie-consents', async (req, res) => {
    // Optional: hier könnte man eine Admin-Auth-Prüfung hinzufügen
    try {
        const consents = await dbAll(`
            SELECT id, userId, sessionId, necessary, analytics, marketing, consentGiven, consentDate
            FROM cookieConsents
            ORDER BY consentDate DESC
            LIMIT 100
        `);
        return res.json({ success: true, consents });
    } catch (error) {
        console.error('Admin-Log-Fehler:', error);
        return res.status(500).json({ success: false, message: 'Fehler beim Abrufen des Cookie-Logs.' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
