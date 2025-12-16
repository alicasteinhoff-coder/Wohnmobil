const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require('crypto');
const app = express();

app.use(cookieParser());

// Simple demo login route that sets a session cookie.
// In a real app you should verify credentials and store session server-side.
app.get('/login', (req, res) => {
	// generate a secure random session id
	const sessionId = crypto.randomBytes(16).toString('hex');

	// set cookie for 1 day
	res.cookie('session_id', sessionId, {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000, // 1 day
		sameSite: 'Strict'
	});

	res.send('Cookie gesetzt!');
});

// Dashboard route: prüft ob ein session_id Cookie vorhanden ist
app.get('/dashboard', (req, res) => {
	const sessionId = req.cookies && req.cookies.session_id;
	if (sessionId) {
		res.send('Willkommen zurück!');
	} else {
		res.send('Bitte einloggen!');
	}
});

module.exports = app;
