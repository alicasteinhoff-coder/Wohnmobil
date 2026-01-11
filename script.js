// DOM Elements
const vehicleList = document.getElementById('vehicle-list');
const bookingModal = document.getElementById('booking-modal');
const closeModal = document.querySelector('#booking-modal .close-modal');
const bookingForm = document.getElementById('booking-form');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

// Filter Elements
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const licenseSelect = document.getElementById('license-select');
const brandSelect = document.getElementById('brand-select');
const emissionSelect = document.getElementById('emission-select');
const colorSelect = document.getElementById('color-select');
const priceRange = document.getElementById('price-range');
const priceValue = document.getElementById('price-value');
const bedsRange = document.getElementById('beds-range');
const bedsValue = document.getElementById('beds-value');
const powerRange = document.getElementById('power-range');
const powerValue = document.getElementById('power-value');
const filterAutomatic = document.getElementById('filter-automatic');
const filterManual = document.getElementById('filter-manual');
const filterHitch = document.getElementById('filter-hitch');

// Auth Elements (may not exist if page served differently)
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authModal = document.getElementById('auth-modal');
const authClose = document.querySelector('.auth-close');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const verify2faForm = document.getElementById('verify-2fa-form');
const authMessage = document.getElementById('auth-message');

// Cookie Elements
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');

// State
// Wishlist State
// Globale Toggle-Funktion für Bookmark-Button
window.toggleWishlist = function(vehicleId, btn) {
    let wishlist = getWishlist();
    const idx = wishlist.indexOf(vehicleId);
    if (idx === -1) {
        wishlist.push(vehicleId);
        setWishlist(wishlist);
        if (btn && btn.querySelector('img')) btn.querySelector('img').src = 'bookmark_orange_border.svg';
    } else {
        wishlist.splice(idx, 1);
        setWishlist(wishlist);
        if (btn && btn.querySelector('img')) btn.querySelector('img').src = 'bookmark_outline.svg';
    }
    updateBookmarkCount();
    // Fahrzeugliste neu rendern, damit alle Icons synchron sind
    filterVehicles();
};
function getWishlist() {
    const user = localStorage.getItem('loggedInUser') || 'guest';
    const list = localStorage.getItem('wishlist_' + user);
    try {
        return list ? JSON.parse(list) : [];
    } catch { return []; }
}

function setWishlist(list) {
    const user = localStorage.getItem('loggedInUser') || 'guest';
    localStorage.setItem('wishlist_' + user, JSON.stringify(list));
}

function addToWishlist(vehicleId) {
    let wishlist = getWishlist();
    if (!wishlist.includes(vehicleId)) {
        wishlist.push(vehicleId);
        setWishlist(wishlist);
        animateBookmark(vehicleId);
        updateBookmarkCount();
    }
}

function removeFromWishlist(vehicleId) {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(id => id !== vehicleId);
    setWishlist(wishlist);
    updateBookmarkCount();
    // Aktualisiere das Icon auf der Hauptseite
    const btn = document.querySelector(`.bookmark-btn[data-id='${vehicleId}']`);
    if (btn && btn.querySelector('img')) {
        btn.querySelector('img').src = 'bookmark_outline.svg';
    }
    // Rendere die Fahrzeugliste neu, um alle Icons zu synchronisieren
    filterVehicles();
}

function updateBookmarkCount() {
    const count = getWishlist().length;
    const badge = document.getElementById('bookmark-badge');
    if (badge) badge.textContent = count > 0 ? count : '';
}

function showWishlistModal() {
    const wishlist = getWishlist();
    const modal = document.getElementById('wishlist-modal');
    const content = document.getElementById('wishlist-content');
    if (!modal || !content) return;
    
    if (wishlist.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <img src="bookmark_outline.svg" alt="Merkliste leer" style="width:64px; height:64px; margin-bottom:1rem; opacity:0.5;" />
                <h3 style="color: var(--text-color); margin-bottom:0.5rem;">Merkliste ist leer</h3>
                <p style="color: var(--text-light);">Fügen Sie Fahrzeuge zur Merkliste hinzu, um diese hier zu sehen.</p>
            </div>
        `;
    } else {
        content.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${wishlist.map(id => {
                const v = vehicles.find(v => v.id === id);
                if (!v) return '';
                return `
                    <div class="vehicle-card">
                        <img src="${v.image}" alt="${v.name}" class="vehicle-image">
                        <div class="vehicle-content">
                            <div class="vehicle-header">
                                <div class="vehicle-title">
                                    <h3>${v.name}</h3>
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                                        <span class="tag">${v.category}</span>
                                        <span class="emission-badge emission-${v.fuel.emissionSticker.toLowerCase()}">${v.fuel.emissionSticker}</span>
                                    </div>
                                </div>
                                <div class="vehicle-price">
                                    ab ${Math.round(v.pricePerDay * 0.9)}€ <span>/ Tag</span>
                                </div>
                            </div>
                            <div class="vehicle-specs">
                                <div class="spec-item" title="Schlafplätze">
                                    🛏️ ${v.beds} Betten
                                </div>
                                <div class="spec-item" title="Führerschein">
                                    🪪 ${v.license}
                                </div>
                                <div class="spec-item" title="Getriebe">
                                    ⚙️ ${v.transmission}
                                </div>
                                <div class="spec-item" title="Leistung">
                                    🐎 ${v.power} PS
                                </div>
                                <div class="spec-item" title="Marke">
                                    🏭 ${v.brand}
                                </div>
                                <div class="spec-item" title="Farbe">
                                    🎨 ${v.color}
                                </div>
                            </div>
                            <div class="vehicle-features">
                                <div class="vehicle-locations" style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">
                                    📍 Verfügbar in: ${v.availableLocations ? v.availableLocations.join(', ') : 'Auf Anfrage'}
                                </div>
                            </div>
                            <button class="btn btn-primary full-width" style="margin-top: 1rem;" onclick="event.stopPropagation(); window.location.href='vehicle-details.html?id=${v.id}';">
                                Verfügbarkeit prüfen
                            </button>
                            <button class="btn" style="margin-top: 0.5rem; width: 100%; background-color: #ff6b35; border: none; border-radius: 8px; padding: 0.75rem; color: white; font-weight: 600; cursor: pointer; transition: background-color 0.2s;" onclick="event.stopPropagation(); window.openBookingModal(${v.id}); closeWishlistModal();">
                                Jetzt buchen
                            </button>
                            <button class="btn" style="margin-top: 0.5rem; width: 100%; background-color: #e5e5e5; border: none; border-radius: 8px; padding: 0.75rem; color: #333; cursor: pointer; transition: background-color 0.2s;" onclick="event.stopPropagation(); removeFromWishlist(${v.id}); showWishlistModal();">
                                Aus Merkliste entfernen
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>`;
    }
    modal.style.display = 'block';
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (modal) modal.style.display = 'none';
}

function animateBookmark(vehicleId) {
    const btn = document.querySelector(`.bookmark-btn[data-id='${vehicleId}']`);
    if (btn) {
        btn.classList.add('bookmarked');
        setTimeout(() => btn.classList.remove('bookmarked'), 800);
    }
}
// Vehicle Data (Embedded to fix CORS/file:// issues)
// Vehicle Data
// --- Data Loading ---
// Vehicle data is loaded from data.js which sets window.vehicles
// If data.js is not available, use a fallback
let vehicles = window.vehicles || [];
let currentVehicle = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Ensure vehicles is available (fallback to window.vehicles if needed)
    if (!vehicles || vehicles.length === 0) {
        vehicles = window.vehicles || [];
    }
    checkCookieConsent();
    // Initialize filters and render vehicles directly
    loadFilterPreferences();
    filterVehicles();
    setupEventListeners();

    // If user is stored locally (after login), show profile UI
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
        showProfile(savedUser);
    }
    
    // Initialize profile handlers
    setupProfileHandlers();
});

// --- AJAX Data Loading ---
// --- Data Loading (Removed AJAX) ---
// Data is now embedded in the 'vehicles' constant above.

// --- Cookie Helper Functions ---

function canSetCookies(category = 'necessary') {
    const preferences = getCookiePreferences();
    if (category === 'necessary') return true; // Technically necessary always allowed
    if (category === 'analytics') return preferences.analytics === true;
    if (category === 'marketing') return preferences.marketing === true;
    return false;
}

function getCookiePreferences() {
    const prefs = getCookie("cookie_preferences");
    if (prefs) {
        try {
            return JSON.parse(prefs);
        } catch (e) {
            return { necessary: true, analytics: false, marketing: false };
        }
    }
    return { necessary: true, analytics: false, marketing: false };
}

function setCookie(name, value, days) {
    // Alle notwendigen Cookies erlauben
    const isNecessaryCookie = ['filter_prefs', 'last_viewed_vehicle', 'session_id', 'cookie_preferences', 'cookie_consent'].includes(name);
    
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    console.log(`✅ Cookie gespeichert: ${name}`);
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// --- Cookie Logic ---

function checkCookieConsent() {
    // Prefer cookie, fallback to localStorage (in case cookies are blocked)
    const consentCookie = getCookie("cookie_consent");
    const consentLS = (typeof localStorage !== 'undefined') ? localStorage.getItem('cookie_consent') : null;
    const consent = consentCookie || consentLS;
    console.log("🍪 Cookie consent check:", { consentCookie, consentLS });

    if (consent === 'true' || consent === true) {
        // Benutzer hat bereits zugestimmt - Banner verstecken
        console.log("✅ Benutzer hat bereits zugestimmt - Banner wird versteckt");
        if (cookieBanner) {
            cookieBanner.style.display = "none";
        }
    } else {
        // Keine Zustimmung - Banner anzeigen
        console.log("❌ Keine Zustimmung - Banner wird angezeigt");
        if (cookieBanner) {
            cookieBanner.style.display = "block";
        }
    }
}

// Small toast helper for user feedback (cookie actions)
function showToast(message, ms = 3000) {
    try {
        const el = document.getElementById('cookie-toast');
        if (!el) return;
        el.textContent = message;
        el.style.display = 'block';
        // trigger animation
        requestAnimationFrame(() => el.classList.add('show'));
        // hide after delay
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => { el.style.display = 'none'; }, 220);
        }, ms);
    } catch (e) {
        console.warn('Toast error', e);
    }
}

function saveFilterPreferences() {
    const prefs = {
        search: searchInput.value,
        category: categorySelect.value,
        license: licenseSelect.value,
        brand: brandSelect.value,
        emission: emissionSelect.value,
        color: colorSelect.value,
        price: priceRange.value,
        beds: bedsRange.value,
        power: powerRange.value,
        automatic: filterAutomatic.checked,
        manual: filterManual ? filterManual.checked : false,
        hitch: filterHitch.checked
    };
    setCookie("filter_prefs", JSON.stringify(prefs), 30); // 30 days
}

function loadFilterPreferences() {
    const prefsJSON = getCookie("filter_prefs");
    if (prefsJSON) {
        try {
            const prefs = JSON.parse(prefsJSON);
            searchInput.value = prefs.search || "";
            categorySelect.value = prefs.category || "";
            licenseSelect.value = prefs.license || "";
            brandSelect.value = prefs.brand || "";
            emissionSelect.value = prefs.emission || "";
            colorSelect.value = prefs.color || "";
            priceRange.value = prefs.price || 150;
            priceValue.textContent = prefs.price || 150;
            bedsRange.value = prefs.beds || 2;
            bedsValue.textContent = prefs.beds || 2;
            powerRange.value = prefs.power || 100;
            powerValue.textContent = prefs.power || 100;
            filterAutomatic.checked = prefs.automatic || false;
            if (filterManual) filterManual.checked = prefs.manual || false;
            filterHitch.checked = prefs.hitch || false;
        } catch (e) {
            console.error("Error parsing filter preferences", e);
        }
    }
}

// --- Existing Logic ---

function renderVehicles(vehiclesToRender) {
    if (vehiclesToRender.length === 0) {
        // Zeige Outline-Lesezeichen, wenn keine Fahrzeuge ausgewählt sind
        vehicleList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <img src="bookmark_outline.svg" alt="Merkliste leer" style="width:48px; height:48px; margin-bottom:1rem;" />
                <h3>Keine Fahrzeuge gefunden</h3>
                <p>Bitte passen Sie Ihre Filter an.</p>
            </div>
        `;
        return;
    }

    vehicleList.innerHTML = vehiclesToRender.map(vehicle => `
        <div class="vehicle-card" onclick="window.location.href='vehicle-details.html?id=${vehicle.id}'" style="cursor: pointer;">
            <img src="${vehicle.image}" alt="${vehicle.name}" class="vehicle-image">
            <div class="vehicle-content">
                <div class="vehicle-header">
                    <div class="vehicle-title">
                        <h3>${vehicle.name}</h3>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                            <span class="tag">${vehicle.category}</span>
                            <span class="emission-badge emission-${vehicle.fuel.emissionSticker.toLowerCase()}">${vehicle.fuel.emissionSticker}</span>
                        </div>
                    </div>
                    <div class="vehicle-price">
                        ab ${Math.round(vehicle.pricePerDay * 0.9)}€ <span>/ Tag</span>
                    </div>
                </div>
                <!-- Essential Specs Only -->
                <div class="vehicle-specs">
                    <div class="spec-item" title="Schlafplätze">
                        🛏️ ${vehicle.beds} Betten
                    </div>
                    <div class="spec-item" title="Führerschein">
                        🪪 ${vehicle.license}
                    </div>
                    <div class="spec-item" title="Getriebe">
                        ⚙️ ${vehicle.transmission}
                    </div>
                    <div class="spec-item" title="Leistung">
                        🐎 ${vehicle.power} PS
                    </div>
                    <div class="spec-item" title="Marke">
                        🏭 ${vehicle.brand}
                    </div>
                    <div class="spec-item" title="Farbe">
                        🎨 ${vehicle.color}
                    </div>
                </div>
                <div class="vehicle-features">
                    <div class="vehicle-locations" style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">
                        📍 Verfügbar in: ${vehicle.availableLocations ? vehicle.availableLocations.join(', ') : 'Auf Anfrage'}
                    </div>
                </div>
                <button class="btn btn-primary full-width" style="margin-top: 1rem;" onclick="event.stopPropagation(); window.location.href='vehicle-details.html?id=' + ${vehicle.id};">
                    Details ansehen
                </button>
                <button class="bookmark-btn" data-id="${vehicle.id}" style="margin-top: 0.5rem; border:none; background:transparent; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0;" onclick="event.stopPropagation(); toggleWishlist(${vehicle.id}, this);">
                    <img src="${getWishlist().includes(vehicle.id) ? 'bookmark_orange_border.svg' : 'bookmark_outline.svg'}" alt="Merken" style="width:24px; height:24px; display:inline-block;" />
                </button>
            </div>
        </div>
    `).join('');
}

function filterVehicles() {
    const searchInputEl = document.getElementById('search-input');
    if (!searchInputEl) return;

    const searchTerm = searchInputEl.value.toLowerCase();
    const selectedCategory = document.getElementById('category-select').value;
    const selectedLicense = document.getElementById('license-select').value;
    const selectedBrand = document.getElementById('brand-select').value;
    const selectedLocation = document.getElementById('location-select').value;
    const selectedEmission = document.getElementById('emission-select').value;
    const selectedColor = document.getElementById('color-select').value;
    const selectedFuel = document.getElementById('fuel-select').value;
    const maxPrice = parseInt(document.getElementById('price-range').value);
    const minBeds = parseInt(document.getElementById('beds-range').value);
    const minPower = parseInt(document.getElementById('power-range').value);
    const filterAutomatic = document.getElementById('filter-automatic').checked;
    const filterManual = document.getElementById('filter-manual') ? document.getElementById('filter-manual').checked : false;
    const filterHitch = document.getElementById('filter-hitch').checked;

    const filteredVehicles = vehicles.filter(vehicle => {
        // Search Term
        const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm) ||
            vehicle.features.some(feature => feature.toLowerCase().includes(searchTerm));

        // Category
        const matchesCategory = selectedCategory === "" || vehicle.category === selectedCategory;

        // License
        const matchesLicense = selectedLicense === "" || vehicle.license === selectedLicense;

        // Brand
        const matchesBrand = selectedBrand === "" || vehicle.brand === selectedBrand;

        // Location
        const matchesLocation = selectedLocation === "" || (vehicle.availableLocations && vehicle.availableLocations.includes(selectedLocation));

        // Emission
        const matchesEmission = selectedEmission === "" || vehicle.fuel.emissionSticker === selectedEmission;

        // Color
        const matchesColor = selectedColor === "" || vehicle.color === selectedColor;

        // Fuel
        const matchesFuel = selectedFuel === "" || vehicle.fuel.type === selectedFuel;

        // Price
        const matchesPrice = vehicle.pricePerDay <= maxPrice;

        // Beds
        const matchesBeds = vehicle.beds >= minBeds;

        // Power
        const matchesPower = vehicle.power >= minPower;

        // Transmission: when neither checkbox is checked -> don't filter by transmission
        let matchesTransmission = true;
        if (filterAutomatic || filterManual) {
            matchesTransmission = (filterAutomatic && vehicle.transmission === "Automatik") || (filterManual && vehicle.transmission === "Manuell");
        }

        // Hitch
        const matchesHitch = !filterHitch || vehicle.towing.hasHitch;

        return matchesSearch && matchesCategory && matchesLicense && matchesBrand && matchesLocation &&
                matchesEmission && matchesColor && matchesFuel && matchesPrice && matchesBeds && matchesPower &&
                matchesTransmission && matchesHitch;
    });

    renderVehicles(filteredVehicles);
}




function setupEventListeners() {
    // Prevent double-binding if this function is accidentally called more than once
    if (window.__wohnmobil_events_bound) {
        console.debug('Event listeners already bound, skipping.');
        return;
    }
    window.__wohnmobil_events_bound = true;
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (bookingModal) bookingModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (bookingModal && e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });

    // Cookie Consent Listeners - GDPR Compliant
    const acceptAllBtn = document.getElementById('accept-all-cookies');
    const rejectAllBtn = document.getElementById('reject-all-cookies');
    const savePrefBtn = document.getElementById('save-cookie-preferences');

    if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', () => {
            // disable button to avoid double-clicks
            acceptAllBtn.disabled = true;
            console.log("✅ Alle Cookies akzeptiert");
            // Set cookie_consent for banner visibility
            setCookie("cookie_consent", "true", 365);
            // Also persist in localStorage as fallback
            try { localStorage.setItem('cookie_consent', 'true'); } catch(e) {}
            // Save all preferences as accepted
            const preferences = { necessary: true, analytics: true, marketing: true };
            setCookie("cookie_preferences", JSON.stringify(preferences), 365);
            try { localStorage.setItem('cookie_preferences', JSON.stringify(preferences)); } catch(e) {}
            console.log("🍪 Einstellungen gespeichert:", preferences);
            // Visual fade out then hide
            if (cookieBanner) {
                cookieBanner.style.transition = 'opacity 220ms ease';
                cookieBanner.style.opacity = '0';
                setTimeout(() => {
                    try { cookieBanner.style.display = 'none'; } catch(e) {}
                    // remove from DOM to avoid future reflows
                    try { cookieBanner.remove(); } catch(e) {}
                }, 230);
            }
            // Make sure check function sees the consent next time
            try { checkCookieConsent(); } catch(e) {}
            // Notify other pages (e.g., locations.html) of consent change
            const preferencesAccept = { necessary: true, analytics: true, marketing: true };
            // Log to server for GDPR audit
            fetch('/api/log-cookie-consent', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferencesAccept)
            }).catch(e => console.warn('Cookie-Log-Fehler:', e));
            window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: preferencesAccept }));
            showToast('Cookies akzeptiert');
        });
    }

    if (rejectAllBtn) {
        rejectAllBtn.addEventListener('click', () => {
            rejectAllBtn.disabled = true;
            console.log("❌ Alle Cookies abgelehnt");
            // Set cookie_consent for banner visibility
            setCookie("cookie_consent", "false", 365);
            try { localStorage.setItem('cookie_consent', 'false'); } catch(e) {}
            // Save all preferences as rejected (only necessary allowed)
            const preferences = { necessary: true, analytics: false, marketing: false };
            setCookie("cookie_preferences", JSON.stringify(preferences), 365);
            try { localStorage.setItem('cookie_preferences', JSON.stringify(preferences)); } catch(e) {}
            console.log("🍪 Einstellungen gespeichert:", preferences);
            if (cookieBanner) {
                cookieBanner.style.transition = 'opacity 220ms ease';
                cookieBanner.style.opacity = '0';
                setTimeout(() => {
                    try { cookieBanner.style.display = 'none'; } catch(e) {}
                    try { cookieBanner.remove(); } catch(e) {}
                }, 230);
            }
            try { checkCookieConsent(); } catch(e) {}
            // Notify other pages of consent change
            const preferencesReject = { necessary: true, analytics: false, marketing: false };
            // Log to server
            fetch('/api/log-cookie-consent', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferencesReject)
            }).catch(e => console.warn('Cookie-Log-Fehler:', e));
            window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: preferencesReject }));
            showToast('Cookies abgelehnt');
        });
    }

    if (savePrefBtn) {
        savePrefBtn.addEventListener('click', () => {
            savePrefBtn.disabled = true;
            console.log("⚙️ Benutzerdefinierte Cookie-Einstellungen gespeichert");
            // Get selected categories from checkboxes
            const analyticsChecked = document.getElementById('cookie-analytics')?.checked || false;
            const marketingChecked = document.getElementById('cookie-marketing')?.checked || false;
            
            // Save preferences
            const preferences = { necessary: true, analytics: analyticsChecked, marketing: marketingChecked };
            setCookie("cookie_preferences", JSON.stringify(preferences), 365);
            setCookie("cookie_consent", "true", 365);
            try { localStorage.setItem('cookie_preferences', JSON.stringify(preferences)); } catch(e) {}
            try { localStorage.setItem('cookie_consent', 'true'); } catch(e) {}
            
            console.log("🍪 Einstellungen gespeichert:", preferences);
            // Close banner with fade
            if (cookieBanner) {
                cookieBanner.style.transition = 'opacity 220ms ease';
                cookieBanner.style.opacity = '0';
                setTimeout(() => {
                    try { cookieBanner.style.display = 'none'; } catch(e) {}
                    try { cookieBanner.remove(); } catch(e) {}
                }, 230);
            }
            try { checkCookieConsent(); } catch(e) {}
            // Notify other pages of consent change
            const preferencesSave = { necessary: true, analytics: analyticsChecked, marketing: marketingChecked };
            // Log to server
            fetch('/api/log-cookie-consent', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferencesSave)
            }).catch(e => console.warn('Cookie-Log-Fehler:', e));
            window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: preferencesSave }));
            showToast('Einstellungen gespeichert');
        });
    }

    // Filter Listeners
    const handleFilterChange = () => {
        filterVehicles();
        saveFilterPreferences();
    };

    searchInput.addEventListener('input', handleFilterChange);
    categorySelect.addEventListener('change', handleFilterChange);
    licenseSelect.addEventListener('change', handleFilterChange);
    brandSelect.addEventListener('change', handleFilterChange);
    emissionSelect.addEventListener('change', handleFilterChange);
    colorSelect.addEventListener('change', handleFilterChange);
    const fuelSelect = document.getElementById('fuel-select');
    if (fuelSelect) {
        fuelSelect.addEventListener('change', handleFilterChange);
    }
    priceRange.addEventListener('input', (e) => {
        priceValue.textContent = e.target.value;
        handleFilterChange();
    });
    bedsRange.addEventListener('input', (e) => {
        bedsValue.textContent = e.target.value;
        handleFilterChange();
    });
    powerRange.addEventListener('input', (e) => {
        powerValue.textContent = e.target.value;
        handleFilterChange();
    });
    filterAutomatic.addEventListener('change', handleFilterChange);
    if (filterManual) filterManual.addEventListener('change', handleFilterChange);
    filterHitch.addEventListener('change', handleFilterChange);

    startDateInput.addEventListener('change', calculateCost);
    endDateInput.addEventListener('change', calculateCost);

    // Versicherungs- und Fahrer-Listener
    const insuranceSelect = document.getElementById('insurance-type');
    if (insuranceSelect) {
        insuranceSelect.addEventListener('change', updateInsurancePrice);
    }

    const driver2BirthDate = document.getElementById('driver2-birth-date');
    if (driver2BirthDate) {
        driver2BirthDate.addEventListener('change', () => {
            const birthDate = driver2BirthDate.value;
            if (!birthDate) return;
            
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            const driver2AgeError = document.getElementById('driver2-age-error');
            if (age < 21 || age > 75) {
                if (driver2AgeError) driver2AgeError.style.display = 'block';
            } else {
                if (driver2AgeError) driver2AgeError.style.display = 'none';
            }
        });
    }

    // Schritt-Navigation im Booking-Formular
    const nextToRenterBtn = document.getElementById('next-to-renter-data');
    const backToDatesBtn = document.getElementById('back-to-dates');
    
    if (nextToRenterBtn) {
        nextToRenterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!startDateInput.value || !endDateInput.value) {
                alert('Bitte geben Sie Start- und Enddatum ein.');
                return;
            }
            // Zu Schritt 2 wechseln
            document.getElementById('step-1-dates').style.display = 'none';
            document.getElementById('step-2-renter').style.display = 'block';
        });
    }
    
    if (backToDatesBtn) {
        backToDatesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Zurück zu Schritt 1
            document.getElementById('step-1-dates').style.display = 'block';
            document.getElementById('step-2-renter').style.display = 'none';
        });
    }

    // Alter-Validierung beim Geburtsdatum
    const birthDateInput = document.getElementById('birth-date');
    if (birthDateInput) {
        birthDateInput.addEventListener('change', () => {
            const birthDate = birthDateInput.value;
            if (!birthDate) return;
            
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            const ageError = document.getElementById('age-error');
            if (age < 21) {
                if (ageError) {
                    ageError.textContent = '⚠️ Du musst mindestens 21 Jahre alt sein.';
                    ageError.style.display = 'block';
                }
            } else if (age > 75) {
                if (ageError) {
                    ageError.textContent = '⚠️ Ab 75 Jahren können Sie kein Fahrzeug mieten.';
                    ageError.style.display = 'block';
                }
            } else {
                if (ageError) ageError.style.display = 'none';
            }
        });
    }

    bookingForm.addEventListener('submit', handleBookingSubmit);

    if (loginForm) loginForm.addEventListener('submit', submitLoginForm);
    if (registerForm) registerForm.addEventListener('submit', submitRegisterForm);
    if (verify2faForm) verify2faForm.addEventListener('submit', submitVerify2faForm);

    // Zurück-Button im 2FA-Formular
    const backToLoginBtn = document.getElementById('back-to-login');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (verify2faForm) verify2faForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (authMessage) authMessage.innerHTML = '';
            document.getElementById('verify-code').value = '';
        });
    }

    // Clear consent error when user ticks the checkbox
    const consentCheckbox = document.getElementById('register-consent');
    if (consentCheckbox) {
        consentCheckbox.addEventListener('change', (e) => {
            const consentError = document.getElementById('register-consent-error');
            if (consentError && e.target.checked) {
                consentError.style.display = 'none';
            }
        });
    }

    // Live-Feedback für Passwortstärke: verstecke Fehler sobald Passwort gültig ist
    const pwInput = document.getElementById('register-password');
    if (pwInput) {
        pwInput.addEventListener('input', (e) => {
            const pw = e.target.value;
            const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
            const passwordErrorEl = document.getElementById('register-password-error');
            if (passwordErrorEl && pwRegex.test(pw)) {
                passwordErrorEl.style.display = 'none';
            }
        });
    }

    // Auth event listeners (open modal, switch forms, submit)
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (authModal) {
                authModal.style.display = 'block';
                showLoginForm();
            }
        });
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (authModal) {
                authModal.style.display = 'block';
                showRegisterForm();
            }
        });
    }

    if (authClose) {
        authClose.addEventListener('click', () => {
            if (authModal) authModal.style.display = 'none';
        });
    }

    // Buttons inside auth modal to switch forms
    const authShowLoginBtn = document.getElementById('auth-show-login');
    const authShowRegisterBtn = document.getElementById('auth-show-register');
    if (authShowLoginBtn) authShowLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
    if (authShowRegisterBtn) authShowRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });

    if (loginForm) loginForm.addEventListener('submit', submitLoginForm);
    if (registerForm) registerForm.addEventListener('submit', submitRegisterForm);
}

// --- Auth (Login / Register) ---
async function submitRegisterForm(e) {
    e.preventDefault();
    if (!registerForm) return;
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const consent = document.getElementById('register-consent').checked;
    // Passwortanforderungen: mindestens 8 Zeichen, Großbuchstabe, Kleinbuchstabe, Zahl, Sonderzeichen
    function isPasswordStrong(pw) {
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        return pwRegex.test(pw);
    }

    const passwordErrorEl = document.getElementById('register-password-error');
    if (!isPasswordStrong(password)) {
        if (passwordErrorEl) passwordErrorEl.style.display = 'block';
        const pwEl = document.getElementById('register-password');
        if (pwEl) pwEl.focus();
        return;
    } else {
        if (passwordErrorEl) passwordErrorEl.style.display = 'none';
    }

    if (!username || !email || !password || !consent) {
        // If consent specifically is missing, show the inline consent error next to the checkbox
        const consentError = document.getElementById('register-consent-error');
        if (!consent) {
            if (consentError) consentError.style.display = 'inline-flex';
            // also focus the checkbox for accessibility
            const consentEl = document.getElementById('register-consent');
            if (consentEl) consentEl.focus();
            return;
        }

        if (authMessage) authMessage.textContent = 'Bitte alle Felder ausfüllen.';
        return;
    }

    try {
        const res = await fetch('/register', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, consent })
        });
        let data;
        try {
            data = await res.json();
        } catch (err) {
            // fallback: treat as text
            const text = await res.text();
            if (authMessage) authMessage.innerHTML = text;
            return;
        }

        if (data && data.success) {
            // Auto-login: store locally and update UI
            registerForm.reset();
            localStorage.setItem('loggedInUser', data.username || username);
            showProfile(data.username || username);
            if (authModal) authModal.style.display = 'none';

            // Inform user about successful registration
            if (authMessage) {
                authMessage.innerHTML = '✅ <strong>Registrierung erfolgreich!</strong><br/>Sie sind nun angemeldet.';
                authMessage.style.backgroundColor = '#dcfce7';
                authMessage.style.border = '1px solid #22c55e';
                authMessage.style.padding = '1rem';
                authMessage.style.borderRadius = '8px';
                authMessage.style.marginBottom = '1rem';
            }
        } else {
            if (authMessage) authMessage.textContent = data && data.message ? data.message : 'Fehler bei der Registrierung.';
        }
    } catch (err) {
        if (authMessage) authMessage.textContent = 'Fehler bei der Registrierung.';
        console.error(err);
    }
}

async function submitLoginForm(e) {
    e.preventDefault();
    if (!loginForm) return;
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) return;

    try {
        const res = await fetch('/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            // Login erfolgreich
            localStorage.setItem('loggedInUser', username);
            showProfile(username);
            if (authModal) authModal.style.display = 'none';
            window.location.href = '/';
        } else {
            // Fehler beim Login
            if (authMessage) authMessage.textContent = data.message;
        }
    } catch (err) {
        if (authMessage) authMessage.textContent = 'Fehler beim Login.';
        console.error(err);
    }
}

function showLoginForm() {
    if (registerForm) registerForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
}

function showRegisterForm() {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
}

// --- Profile UI ---
function showProfile(username) {
    const profileContainer = document.getElementById('profile-container');
    const navRight = document.getElementById('nav-links-right');
    if (navRight) navRight.style.display = 'none';
    if (profileContainer) profileContainer.style.display = 'flex';
    const avatar = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    if (avatar) avatar.textContent = username.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = username;

    // Setup profile button menu toggle (nur einmal!)
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    if (profileBtn && profileMenu && !window.__profileMenuInitialized) {
        window.__profileMenuInitialized = true;
        
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = profileMenu.style.display === 'block';
            profileMenu.style.display = isVisible ? 'none' : 'block';
            profileBtn.setAttribute('aria-expanded', String(!isVisible));
        });

        // close menu on outside click
        document.addEventListener('click', (e) => {
            // Dont close if clicking inside the menu
            if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                profileMenu.style.display = 'none';
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const logoutLink = document.getElementById('profile-logout');
    if (logoutLink) logoutLink.addEventListener('click', logoutUser);
}

function hideProfile() {
    const profileContainer = document.getElementById('profile-container');
    const navRight = document.getElementById('nav-links-right');
    if (navRight) navRight.style.display = 'flex';
    if (profileContainer) profileContainer.style.display = 'none';
}

async function logoutUser(e) {
    if (e) e.preventDefault();
    try {
        await fetch('/logout', { method: 'GET', credentials: 'same-origin' });
    } catch (err) {
        console.error('Logout error', err);
    }
    localStorage.removeItem('loggedInUser');
    hideProfile();
    // optional: refresh page to clear any server-side session state
    window.location.href = '/';
}

// --- 2FA Code Verification ---
async function submitVerify2faForm(e) {
    e.preventDefault();
    if (!verify2faForm) return;
    const code = document.getElementById('verify-code').value.trim();
    if (!code || code.length !== 6) {
        if (authMessage) authMessage.textContent = 'Bitte geben Sie einen gültigen 6-stelligen Code ein.';
        return;
    }

    try {
        const res = await fetch('/verify-2fa', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        
        if (data.success) {
            // Login erfolgreich: hole Username aus Form und speichere
            const username = document.getElementById('login-username').value.trim();
            localStorage.setItem('loggedInUser', username);
            showProfile(username);
            if (authModal) authModal.style.display = 'none';
            if (verify2faForm) verify2faForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'none';
            window.location.href = '/';
        } else {
            if (authMessage) authMessage.textContent = data.message;
        }
    } catch (err) {
        if (authMessage) authMessage.textContent = 'Fehler bei der Code-Verifikation.';
        console.error(err);
    }
}

// --- Profile Modal Handlers ---
// Open profile modal and populate fields from /api/me
function openProfileModal(e) {
    console.log('👤 openProfileModal called with:', e);
    if (e) e.preventDefault();
    
    const profileModal = document.getElementById('profile-modal');
    console.log('Modal element:', profileModal);
    
    if (!profileModal) {
        console.error('❌ Profile modal not found!');
        return;
    }
    
    const profileMessage = document.getElementById('profile-message');
    if (profileMessage) profileMessage.innerHTML = '';
    
    // Fetch user data
    fetch('/api/me', { credentials: 'same-origin' })
        .then(res => {
            console.log('API Response status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('API Data:', data);
            if (!data.loggedIn) {
                if (profileMessage) profileMessage.textContent = 'Bitte einloggen.';
                console.log('⚠️ User not logged in');
                return;
            }
            
            const usernameInput = document.getElementById('profile-username');
            const emailInput = document.getElementById('profile-email');
            console.log('Form inputs found:', { username: !!usernameInput, email: !!emailInput });
            
            if (usernameInput) usernameInput.value = data.username || '';
            if (emailInput) emailInput.value = data.email || '';
            
            profileModal.style.display = 'block';
            console.log('✅ Modal display set to block');
        })
        .catch(err => {
            console.error('❌ Fetch error:', err);
            if (profileMessage) profileMessage.textContent = 'Fehler beim Laden des Profils.';
        });
}

// Submit profile update (username + email)
async function submitProfileForm(e) {
    e.preventDefault();
    const username = document.getElementById('profile-username').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const emailError = document.getElementById('profile-email-error');
    const profileMessage = document.getElementById('profile-message');
    if (emailError) emailError.style.display = 'none';
    if (!username || !email) {
        if (profileMessage) profileMessage.textContent = 'Bitte Benutzername und E-Mail ausfüllen.';
        return;
    }
    try {
        const res = await fetch('/api/update-profile', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        const data = await res.json();
        if (data.success) {
            if (profileMessage) profileMessage.innerHTML = '✅ Profil erfolgreich aktualisiert.' + (data.emailChanged ? ' Bitte bestätigen Sie Ihre neue E-Mail-Adresse.' : '');
            // Update profile UI (nav)
            localStorage.setItem('loggedInUser', username);
            const nameEl = document.getElementById('profile-name');
            const avatar = document.getElementById('profile-avatar');
            if (nameEl) nameEl.textContent = username;
            if (avatar) avatar.textContent = username.charAt(0).toUpperCase();
        } else {
            if (res.status === 409) {
                if (emailError) emailError.style.display = 'block';
            }
            if (profileMessage) profileMessage.textContent = data.message || 'Fehler beim Aktualisieren.';
        }
    } catch (err) {
        console.error('Update error', err);
        if (profileMessage) profileMessage.textContent = 'Fehler beim Aktualisieren.';
    }
}

// Submit password change
async function submitChangePasswordForm(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNew = document.getElementById('confirm-new-password').value;
    const passwordError = document.getElementById('profile-password-error');
    const profileMessage = document.getElementById('profile-message');
    if (passwordError) passwordError.style.display = 'none';
    if (!currentPassword || !newPassword || !confirmNew) {
        if (profileMessage) profileMessage.textContent = 'Bitte alle Felder ausfüllen.';
        return;
    }
    if (newPassword !== confirmNew) {
        if (profileMessage) profileMessage.textContent = 'Neues Passwort und Bestätigung stimmen nicht überein.';
        return;
    }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!pwRegex.test(newPassword)) {
        if (passwordError) passwordError.style.display = 'block';
        return;
    }

    try {
        const res = await fetch('/api/change-password', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            if (profileMessage) profileMessage.textContent = '✅ Passwort erfolgreich geändert.';
            // reset fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } else {
            if (profileMessage) profileMessage.textContent = data.message || 'Fehler beim Ändern des Passworts.';
        }
    } catch (err) {
        console.error('Change password error', err);
        if (profileMessage) profileMessage.textContent = 'Fehler beim Ändern des Passworts.';
    }
}

// Setup profile modal event bindings
function setupProfileHandlers() {
    const profileLink = document.getElementById('profile-dashboard');
    if (profileLink) profileLink.addEventListener('click', openProfileModal);

    const profileClose = document.querySelector('.profile-close');
    const profileModal = document.getElementById('profile-modal');
    if (profileClose) profileClose.addEventListener('click', () => { if (profileModal) profileModal.style.display = 'none'; });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) profileModal.style.display = 'none';
    });

    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.addEventListener('submit', submitProfileForm);

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) changePasswordForm.addEventListener('submit', submitChangePasswordForm);
}

// Initialize profile handlers on load
document.addEventListener('DOMContentLoaded', () => {
    setupProfileHandlers();
});



window.openBookingModal = function (vehicleId) {
    // Prüfe, ob Benutzer angemeldet ist
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        showToast('⚠️ Bitte melden Sie sich an, um zu buchen');
        // Öffne das Auth-Modal und zeige Login-Form
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'block';
            showLoginForm();
        }
        return;
    }

    currentVehicle = vehicles.find(v => v.id === vehicleId);
    if (!currentVehicle) return;

    // Save last viewed vehicle (Session Cookie)
    setCookie("last_viewed_vehicle", vehicleId, null);

    // Populate modal
    document.getElementById('modal-vehicle-name').textContent = currentVehicle.name;
    document.getElementById('modal-vehicle-image').src = currentVehicle.image;
    document.getElementById('daily-rate').textContent = currentVehicle.pricePerDay;

    // Add vehicle specs summary to modal
    const specsContainer = document.querySelector('.vehicle-specs-summary');
    if (specsContainer) {
        specsContainer.innerHTML = `
            <div style="font-size: 0.85rem; color: var(--secondary-color);">
                <p><strong>${currentVehicle.category}</strong> • ${currentVehicle.beds} Betten • ${currentVehicle.transmission}</p>
                <p>💨 ${currentVehicle.fuel.emissionClass} • ${currentVehicle.fuel.consumption}l/100km</p>
            </div>
        `;
    }

    // Reset form
    bookingForm.reset();
    document.getElementById('rental-days').textContent = '0';
    document.getElementById('total-price').textContent = '0';
    
    // Reset insurance and additional driver
    const insuranceSelect = document.getElementById('insurance-type');
    if (insuranceSelect) insuranceSelect.value = 'none';
    const insuranceCostInfo = document.getElementById('insurance-cost-info');
    if (insuranceCostInfo) insuranceCostInfo.style.display = 'none';
    
    const additionalDriverCheckbox = document.getElementById('additional-driver-checkbox');
    if (additionalDriverCheckbox) additionalDriverCheckbox.checked = false;
    const additionalDriverForm = document.getElementById('additional-driver-form');
    if (additionalDriverForm) additionalDriverForm.style.display = 'none';
    
    // Zurücksetzen zu Schritt 1
    document.getElementById('step-1-dates').style.display = 'block';
    document.getElementById('step-2-renter').style.display = 'none';
    if (document.getElementById('age-error')) {
        document.getElementById('age-error').style.display = 'none';
    }
    if (document.getElementById('driver2-age-error')) {
        document.getElementById('driver2-age-error').style.display = 'none';
    }

    // Set min dates
    const today = new Date().toISOString().split('T')[0];
    // startDateInput.min = today; // Removed native min date
    // endDateInput.min = today;   // Removed native min date

    // Initialize Flatpickr
    initFlatpickr(vehicleId);

    bookingModal.style.display = 'block';
}

function initFlatpickr(vehicleId) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const vehicleBookings = bookings.filter(b => b.vehicleId === vehicleId);
    
    const disabledDates = vehicleBookings.map(b => {
        return {
            from: b.startDate,
            to: b.endDate
        };
    });

    const commonConfig = {
        locale: 'de',
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: disabledDates,
        onChange: function(selectedDates, dateStr, instance) {
            calculateCost();
        }
    };

    flatpickr("#start-date", {
        ...commonConfig,
        onChange: function(selectedDates, dateStr, instance) {
            // Update minDate of end-date picker
            const endDatePicker = document.querySelector("#end-date")._flatpickr;
            if (endDatePicker && selectedDates[0]) {
                endDatePicker.set('minDate', selectedDates[0]);
            }
            calculateCost();
        }
    });

    flatpickr("#end-date", {
        ...commonConfig
    });
}

function calculateCost() {
    if (!startDateInput.value || !endDateInput.value || !currentVehicle) return;

    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);

    if (end <= start) {
        // Invalid range
        document.getElementById('rental-days').textContent = '0';
        document.getElementById('total-price').textContent = '0';
        document.getElementById('deposit-amount').textContent = '0';
        return;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let totalCost = diffDays * currentVehicle.pricePerDay;

    // Kaution berechnen basierend auf Mietdauer
    let deposit = 0;
    if (diffDays <= 3) {
        deposit = 1000;
    } else if (diffDays <= 7) {
        deposit = 1200;
    } else if (diffDays <= 14) {
        deposit = 1400;
    } else {
        deposit = 1500;
    }
    totalCost += deposit;

    // Versicherung hinzufügen
    const insuranceType = document.getElementById('insurance-type').value;
    let insurancePrice = 0;
    if (insuranceType !== 'none') {
        const insurancePrices = { '500': 15, '1000': 10, '1500': 5 };
        insurancePrice = (insurancePrices[insuranceType] || 0) * diffDays;
        totalCost += insurancePrice;
    }

    // Zusätzlicher Fahrer hinzufügen
    const hasAdditionalDriver = document.getElementById('additional-driver-checkbox').checked;
    if (hasAdditionalDriver) {
        totalCost += 25 * diffDays;
    }

    // Endreinigung (verpflichtend)
    totalCost += 70;

    document.getElementById('rental-days').textContent = diffDays;
    document.getElementById('deposit-amount').textContent = deposit;
    document.getElementById('total-price').textContent = totalCost;
}

window.updateInsurancePrice = function() {
    calculateCost();
    const insuranceType = document.getElementById('insurance-type').value;
    const insuranceCostInfo = document.getElementById('insurance-cost-info');
    
    if (insuranceType !== 'none') {
        const rentalDays = parseInt(document.getElementById('rental-days').textContent) || 0;
        const insurancePrices = { '500': 15, '1000': 10, '1500': 5 };
        const pricePerDay = insurancePrices[insuranceType] || 0;
        const totalInsurancePrice = pricePerDay * rentalDays;
        document.getElementById('insurance-price-display').textContent = totalInsurancePrice;
        insuranceCostInfo.style.display = 'block';
    } else {
        insuranceCostInfo.style.display = 'none';
    }
};

window.toggleAdditionalDriver = function() {
    const checkbox = document.getElementById('additional-driver-checkbox');
    const form = document.getElementById('additional-driver-form');
    if (checkbox.checked) {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
    calculateCost();
};


function handleBookingSubmit(e) {
    e.preventDefault();

    // Prüfe, ob wir in Schritt 2 sind
    const step2 = document.getElementById('step-2-renter');
    if (!step2 || step2.style.display === 'none') {
        return; // Nicht in Schritt 2, nicht absenden
    }

    // Mieterdaten sammeln
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const birthDate = document.getElementById('birth-date').value;
    const street = document.getElementById('street').value.trim();
    const postalCode = document.getElementById('postal-code').value.trim();
    const city = document.getElementById('city').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const licenseClass = document.getElementById('license-class').value;
    const licenseValidSince = document.getElementById('license-valid-since').value;

    // Validierung: Alle Felder müssen ausgefüllt sein
    if (!firstName || !lastName || !birthDate || !street || !postalCode || !city || !phone || !licenseClass || !licenseValidSince) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }

    // Validierung: Mindestens 21 Jahre alt und maximal 75 Jahre
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    const ageError = document.getElementById('age-error');
    if (age < 21) {
        if (ageError) ageError.style.display = 'block';
        alert('Du musst mindestens 21 Jahre alt sein, um ein Fahrzeug zu mieten.');
        return;
    }
    if (age > 75) {
        if (ageError) ageError.style.display = 'block';
        ageError.textContent = '⚠️ Ab 75 Jahren können Sie kein Fahrzeug mieten.';
        alert('Ab 75 Jahren können Sie kein Fahrzeug mieten.');
        return;
    }
    if (ageError) {
        ageError.style.display = 'none';
        ageError.textContent = '⚠️ Du musst mindestens 21 Jahre alt sein.';
    }

    // Validierung: Führerschein muss älter als 0 Jahre sein
    const licenseDate = new Date(licenseValidSince);
    if (licenseDate > today) {
        alert('Das Gültig-seit-Datum des Führerscheins kann nicht in der Zukunft liegen.');
        return;
    }

    // Validierung: Zusätzlicher Fahrer (wenn angegeben)
    const hasAdditionalDriver = document.getElementById('additional-driver-checkbox').checked;
    if (hasAdditionalDriver) {
        const driver2FirstName = document.getElementById('driver2-first-name').value.trim();
        const driver2LastName = document.getElementById('driver2-last-name').value.trim();
        const driver2BirthDate = document.getElementById('driver2-birth-date').value;

        if (!driver2FirstName || !driver2LastName || !driver2BirthDate) {
            alert('Bitte füllen Sie alle Felder für den zusätzlichen Fahrer aus.');
            return;
        }

        // Validierung: Alter zwischen 21 und 75
        const driver2Birth = new Date(driver2BirthDate);
        let driver2Age = today.getFullYear() - driver2Birth.getFullYear();
        const driver2MonthDiff = today.getMonth() - driver2Birth.getMonth();
        if (driver2MonthDiff < 0 || (driver2MonthDiff === 0 && today.getDate() < driver2Birth.getDate())) {
            driver2Age--;
        }

        const driver2AgeError = document.getElementById('driver2-age-error');
        if (driver2Age < 21 || driver2Age > 75) {
            if (driver2AgeError) driver2AgeError.style.display = 'block';
            alert('Der zusätzliche Fahrer muss zwischen 21 und 75 Jahre alt sein.');
            return;
        }
        if (driver2AgeError) driver2AgeError.style.display = 'none';
    }

    const start = startDateInput.value;
    const end = endDateInput.value;
    const days = document.getElementById('rental-days').textContent;
    const total = document.getElementById('total-price').textContent;

    // Versicherungs- und Fahrerdaten sammeln
    const insuranceType = document.getElementById('insurance-type').value;
    const additionalDriver = hasAdditionalDriver ? {
        firstName: document.getElementById('driver2-first-name').value.trim(),
        lastName: document.getElementById('driver2-last-name').value.trim(),
        birthDate: document.getElementById('driver2-birth-date').value
    } : null;

    // Kaution berechnen
    const depositAmount = parseInt(document.getElementById('deposit-amount').textContent);

    // Buchung speichern
    const booking = {
        id: Date.now(),
        vehicleName: currentVehicle.name,
        vehicleId: currentVehicle.id,
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate,
        address: `${street}, ${postalCode} ${city}`,
        phone: phone,
        licenseClass: licenseClass,
        licenseValidSince: licenseValidSince,
        startDate: start,
        endDate: end,
        days: days,
        totalPrice: total,
        deposit: depositAmount,
        insurance: insuranceType,
        endCleaning: true,
        additionalDriver: additionalDriver,
        bookingDate: new Date().toLocaleDateString('de-DE')
    };

    let bookings = [];
    try {
        const existing = localStorage.getItem('bookings');
        bookings = existing ? JSON.parse(existing) : [];
    } catch (e) {
        bookings = [];
    }
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // Bestätigung mit Toast statt Alert (unauffällig)
    showToast('✅ Buchung gespeichert');
    
    // Formular zurücksetzen aber Modal bleibt offen
    document.getElementById('booking-form').reset();
    document.getElementById('age-error').style.display = 'none';
    // Zurück zu Schritt 1
    document.getElementById('step-1-dates').style.display = 'block';
    document.getElementById('step-2-renter').style.display = 'none';
}

// Schritt-Navigation
window.goToStep2 = function() {
    // Validate dates first
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showToast('⚠️ Bitte wählen Sie Start- und Enddatum');
        return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        showToast('⚠️ Enddatum muss nach Startdatum liegen');
        return;
    }
    
    // Hide step 1, show step 2
    document.getElementById('step-1-dates').style.display = 'none';
    document.getElementById('step-2-renter').style.display = 'block';
};

window.goToStep1 = function() {
    // Hide step 2, show step 1
    document.getElementById('step-2-renter').style.display = 'none';
    document.getElementById('step-1-dates').style.display = 'block';
};

// FAQ Toggle Function
window.toggleFAQ = function(element) {
    const answer = element.nextElementSibling;
    const arrow = element.querySelector('span:last-child');
    
    if (answer.style.display === 'none') {
        answer.style.display = 'block';
        arrow.textContent = '▲';
    } else {
        answer.style.display = 'none';
        arrow.textContent = '▼';
    }
};
