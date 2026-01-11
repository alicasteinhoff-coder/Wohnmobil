# Google Maps API Key Setup

## Google Maps API Aktivieren und Key Abrufen

Um die Google Maps Funktionalität auf der Seite `locations.html` zu nutzen, benötigen Sie einen kostenlosen Google Maps API Key.

### Schritt 1: Google Cloud Project erstellen
1. Gehen Sie auf [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt (z.B. "VanAway")
3. Warten Sie, bis das Projekt initialisiert ist

### Schritt 2: Maps JavaScript API aktivieren
1. Gehen Sie zu **APIs & Services** → **Library**
2. Suchen Sie nach "Maps JavaScript API"
3. Klicken Sie auf "Maps JavaScript API"
4. Klicken Sie auf **Enable**

### Schritt 3: API Key erstellen
1. Gehen Sie zu **APIs & Services** → **Credentials**
2. Klicken Sie auf **Create Credentials** → **API Key**
3. Kopieren Sie Ihren neuen API Key

### Schritt 4: API Key in locations.html eintragen
Öffnen Sie `locations.html` und suchen Sie nach dieser Zeile (ungefähr Zeile 230):
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDemoKey123456789&language=de&region=DE';
```

Ersetzen Sie `AIzaSyDemoKey123456789` durch Ihren echten API Key:
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=HIER_IHR_ECHTER_KEY&language=de&region=DE';
```

### Schritt 5: API-Anfragen begrenzen (optional, aber empfohlen)
1. Gehen Sie in der Cloud Console zu **APIs & Services** → **Credentials**
2. Klicken Sie auf Ihren API Key
3. Unter **API restrictions** wählen Sie **Maps JavaScript API**
4. Unter **Application restrictions** wählen Sie **HTTP referrers (web sites)**
5. Fügen Sie Ihre Domain hinzu (z.B. `localhost:3000`, `your-domain.com`)

## Kosten & Limits
- **Google Maps JavaScript API** ist kostenlos für bis zu **25.000 Loads pro Tag**
- Nach Überschreitung werden Anfragen automatisch blockiert (es sei denn, Sie haben Billing aktiviert)
- Für Produktionsumgebungen sollten Sie ein Billing-Konto hinzufügen und ggf. Budget-Limits setzen

## DSGVO & Cookies
⚠️ **Wichtig:** Google Maps wird nur geladen, wenn der Nutzer der Verwendung von **Analytics-Cookies** zugestimmt hat (Cookie-Banner). Dies ist DSGVO-konform.

- Die `locations.html` Seite prüft `cookie_preferences.analytics`
- Ohne Zustimmung wird ein Placeholder angezeigt statt der Karte
- Der Nutzer kann jederzeit auf den Cookie-Banner klicken, um Analytics zu aktivieren
- Dann wird die Seite neu geladen und die Karte erscheint

## Testing
1. Laden Sie die Seite in einem privaten/Inkognito-Fenster (um Cookie-Status zu testen)
2. Sie sollten einen **Placeholder** statt der Karte sehen
3. Akzeptieren Sie Cookies via Banner → Seite wird neu geladen
4. Google Maps sollte nun sichtbar sein
