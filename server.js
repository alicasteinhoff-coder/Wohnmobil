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

        // Benutzer in DB speichern (emailVerified = 1, da keine Verifikation nötig)
        const result = await dbRun(
            'INSERT INTO users (username, email, passwordHash, consentGiven, consentDate, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, 1, new Date().toISOString(), 1]
        );
        const userId = result.id;

        // Benutzer direkt einloggen (Session setzen)
        req.session.userId = userId;

        return res.json({ success: true, message: '✅ Registrierung erfolgreich! Sie sind nun angemeldet.', username, email });
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

        // Benutzer einloggen
        req.session.userId = user.id;
        return res.json({ success: true, message: '✅ Login erfolgreich!' });
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.json({ success: false, message: '❌ Fehler beim Login.' });
    }
});

// Get current user profile
app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }
    try {
        const user = await dbGet('SELECT id, username, email FROM users WHERE id = ?', [req.session.userId]);
        if (user) {
            res.json({ loggedIn: true, username: user.username, email: user.email });
        } else {
            res.json({ loggedIn: false });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.json({ loggedIn: false, error: 'Fehler beim Laden des Profils.' });
    }
});

// Update profile (username and email)
app.post('/api/update-profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Nicht authentifiziert.' });
    }
    const { username, email } = req.body;
    if (!username || !email) {
        return res.json({ success: false, message: 'Benutzername und E-Mail erforderlich.' });
    }
    try {
        const existingUser = await dbGet('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
            [username, email, req.session.userId]);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Benutzername oder E-Mail bereits vergeben.' });
        }
        await dbRun('UPDATE users SET username = ?, email = ? WHERE id = ?', 
            [username, email, req.session.userId]);
        res.json({ success: true, message: 'Profil aktualisiert.' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.json({ success: false, message: 'Fehler beim Aktualisieren des Profils.' });
    }
});

// Change password
app.post('/api/change-password', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Nicht authentifiziert.' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.json({ success: false, message: 'Passwort erforderlich.' });
    }
    try {
        const user = await dbGet('SELECT passwordHash FROM users WHERE id = ?', [req.session.userId]);
        if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
            return res.json({ success: false, message: 'Aktuelles Passwort ist falsch.' });
        }
        const newHash = await bcrypt.hash(newPassword, 10);
        await dbRun('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, req.session.userId]);
        res.json({ success: true, message: 'Passwort erfolgreich geändert.' });
    } catch (error) {
        console.error('Password change error:', error);
        res.json({ success: false, message: 'Fehler beim Ändern des Passworts.' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Database Export Endpoint
app.get('/api/export/csv', async (req, res) => {
    try {
        // Get all bookings and users
        const bookings = await dbAll('SELECT * FROM bookings');
        const users = await dbAll('SELECT * FROM users');
        
        // Create CSV for bookings
        let csv = 'ID,Username,Vehicle,Start Date,End Date,Total Price,Status,Created At\n';
        bookings.forEach(b => {
            csv += `${b.id},"${b.username}","${b.vehicle}","${b.startDate}","${b.endDate}",${b.totalPrice},"${b.status}","${b.createdAt}"\n`;
        });
        
        res.setHeader('Content-Disposition', 'attachment; filename="bookings_export.csv"');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csv);
    } catch (error) {
        console.error('Export-Fehler:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Database Export as JSON
app.get('/api/export/json', async (req, res) => {
    try {
        const bookings = await dbAll('SELECT * FROM bookings');
        const users = await dbAll('SELECT * FROM users');
        
        const data = {
            exportDate: new Date().toISOString(),
            bookings: bookings,
            users: users.map(u => ({ 
                id: u.id, 
                username: u.username, 
                email: u.email, 
                createdAt: u.createdAt 
            }))
        };
        
        res.setHeader('Content-Disposition', 'attachment; filename="database_export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Export-Fehler:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
