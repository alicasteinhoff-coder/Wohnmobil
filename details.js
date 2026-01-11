function initDetailsWithVehicles() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = parseInt(urlParams.get('id'));

    const vehicleList = window.vehicles || [];
    const vehicle = vehicleList.find(v => v.id === vehicleId);

    if (!vehicle) {
        document.getElementById('vehicle-details-content').innerHTML = '<div style="text-align: center; padding: 4rem;"><h2>Fahrzeug nicht gefunden</h2><a href="index.html" class="btn btn-primary">Zurück zur Übersicht</a></div>';
        return;
    }

    window.currentVehicleId = vehicleId;
    renderVehicleDetails(vehicle);
    renderAvailability(vehicleId);
    setupBookingModal(vehicle);
    renderReviews(vehicleId);
}

// ===== Bewertungssystem =====
function getReviews(vehicleId) {
    const reviews = localStorage.getItem('reviews_' + vehicleId);
    try {
        return reviews ? JSON.parse(reviews) : [];
    } catch { return []; }
}

function saveReviews(vehicleId, reviews) {
    localStorage.setItem('reviews_' + vehicleId, JSON.stringify(reviews));
}

function addReview(vehicleId, username, rating, comment) {
    let reviews = getReviews(vehicleId);
    const review = {
        id: Date.now(),
        username: username,
        rating: parseInt(rating),
        comment: comment,
        date: new Date().toLocaleDateString('de-DE')
    };
    reviews.push(review);
    saveReviews(vehicleId, reviews);
    return review;
}

function deleteReview(vehicleId, reviewId) {
    let reviews = getReviews(vehicleId);
    reviews = reviews.filter(r => r.id !== reviewId);
    saveReviews(vehicleId, reviews);
}

function renderReviews(vehicleId) {
    const reviews = getReviews(vehicleId);
    const currentUser = localStorage.getItem('loggedInUser');
    const reviewsContainer = document.getElementById('reviews-section');
    
    if (!reviewsContainer) return;
    
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    
    let html = `
        <div class="detail-card" style="grid-column: 1/-1;">
            <h3>⭐ Bewertungen (${reviews.length})</h3>
    `;
    
    if (reviews.length > 0) {
        html += `
            <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">${avgRating}</div>
                    <div>
                        <div style="margin-bottom: 0.25rem;">⭐ Durchschnittliche Bewertung</div>
                        <div style="color: var(--text-light); font-size: 0.9rem;">${reviews.length} ${reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Bewertungsformular (nur für eingeloggte Benutzer)
    if (currentUser) {
        html += `
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1rem;">Ihre Bewertung</h4>
                <form id="review-form" onsubmit="submitReview(event, ${vehicleId})">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.75rem;">Bewertung</label>
                        <div id="star-rating" style="display: flex; gap: 0.5rem; font-size: 2rem;">
                            ${[1,2,3,4,5].map(i => `
                                <span class="star" data-rating="${i}" style="cursor: pointer; transition: color 0.2s; color: #ddd;">★</span>
                            `).join('')}
                        </div>
                        <input type="hidden" id="rating-select" name="rating" required value="">
                    </div>
                    <div class="form-group">
                        <label for="comment-input">Ihre Bewertung</label>
                        <textarea id="comment-input" required placeholder="Teilen Sie Ihre Erfahrung mit diesem Fahrzeug..." style="width: 100%; min-height: 100px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Bewertung absenden</button>
                </form>
            </div>
        `;
    } else {
        html += `
            <div style="background: #fffbeb; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; color: #78350f; border-left: 4px solid #f59e0b;">
                <strong>💡 Hinweis:</strong> Bitte <a href="index.html" style="color: var(--primary-color); font-weight: bold;">melden Sie sich an</a>, um eine Bewertung zu schreiben.
            </div>
        `;
    }
    
    // Bewertungen anzeigen
    if (reviews.length > 0) {
        html += `<div style="margin-top: 2rem;">`;
        reviews.forEach(review => {
            const isOwnReview = currentUser && currentUser === review.username;
            html += `
                <div style="padding: 1.5rem; border: 1px solid #eee; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <div style="font-weight: 600;">${review.username}</div>
                            <div style="font-size: 0.9rem; color: var(--text-light);">${review.date}</div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <div style="font-size: 1.2rem;">${'⭐'.repeat(review.rating)}</div>
                            ${isOwnReview ? `<button onclick="deleteReviewConfirm(${vehicleId}, ${review.id})" style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Löschen</button>` : ''}
                        </div>
                    </div>
                    <p style="color: var(--text-color); line-height: 1.6; margin: 0;">${review.comment}</p>
                </div>
            `;
        });
        html += `</div>`;
    } else if (reviews.length === 0) {
        html += `<p style="color: var(--text-light); text-align: center; padding: 2rem;">Noch keine Bewertungen vorhanden. Seien Sie der Erste!</p>`;
    }
    
    html += `</div>`;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const newElement = tempDiv.firstElementChild;
    newElement.id = 'reviews-section'; // Behalte die ID für zukünftige Updates
    
    // Alte Reviews entfernen, falls vorhanden
    const oldReviews = document.getElementById('reviews-section');
    if (oldReviews && oldReviews.parentNode) {
        oldReviews.parentNode.replaceChild(newElement, oldReviews);
    } else {
        // Falls noch nicht vorhanden, anhängen
        document.getElementById('vehicle-details-content').appendChild(newElement);
    }
    
    // Sterne-Interaktivität hinzufügen
    setupStarRating();
}

function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating-select');
    
    if (!stars.length) return;
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.dataset.rating;
            ratingInput.value = rating;
            
            // Alle Sterne aktualisieren
            stars.forEach(s => {
                if (s.dataset.rating <= rating) {
                    s.style.color = '#fbbf24'; // Gelb
                } else {
                    s.style.color = '#d1d5db'; // Grau
                }
            });
        });
        
        // Hover-Effekt
        star.addEventListener('mouseover', () => {
            const rating = star.dataset.rating;
            stars.forEach(s => {
                if (s.dataset.rating <= rating) {
                    s.style.color = '#fbbf24';
                } else {
                    s.style.color = '#d1d5db';
                }
            });
        });
    });
    
    // Hover-Ende Reset
    const starContainer = document.getElementById('star-rating');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            const currentRating = ratingInput.value;
            stars.forEach(s => {
                if (currentRating && s.dataset.rating <= currentRating) {
                    s.style.color = '#fbbf24';
                } else {
                    s.style.color = '#d1d5db';
                }
            });
        });
    }
}

function submitReview(e, vehicleId) {
    e.preventDefault();
    const currentUser = localStorage.getItem('loggedInUser');
    if (!currentUser) {
        alert('Bitte melden Sie sich an, um eine Bewertung zu schreiben.');
        return;
    }
    
    const rating = document.getElementById('rating-select').value;
    const comment = document.getElementById('comment-input').value.trim();
    
    if (!rating || !comment) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }
    
    addReview(vehicleId, currentUser, rating, comment);
    document.getElementById('review-form').reset();
    // Sterne zurücksetzen auf grau
    document.querySelectorAll('.star').forEach(star => {
        star.style.color = '#d1d5db';
    });
    renderReviews(vehicleId);
}

function deleteReviewConfirm(vehicleId, reviewId) {
    if (confirm('Möchten Sie diese Bewertung wirklich löschen?')) {
        deleteReview(vehicleId, reviewId);
        renderReviews(vehicleId);
    }
}

function waitForVehiclesAndInit(timeout = 2000, interval = 100) {
    const start = Date.now();

    function tryInit() {
        if (window.vehicles && Array.isArray(window.vehicles) && window.vehicles.length > 0) {
            initDetailsWithVehicles();
            return;
        }

        if (Date.now() - start > timeout) {
            // Give up after timeout and try anyway (page may be empty)
            initDetailsWithVehicles();
            return;
        }

        setTimeout(tryInit, interval);
    }

    tryInit();
}

document.addEventListener('DOMContentLoaded', () => waitForVehiclesAndInit());


function renderVehicleDetails(vehicle) {
    const content = document.getElementById('vehicle-details-content');

    content.innerHTML = `
        <div class="vehicle-hero">
            <img src="${vehicle.image}" alt="${vehicle.name}">
            <div class="vehicle-hero-content">
                <h1>${vehicle.name}</h1>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <span class="tag">${vehicle.category}</span>
                    <span class="emission-badge emission-${vehicle.fuel.emissionSticker.toLowerCase()}">${vehicle.fuel.emissionSticker}</span>
                </div>
                <div class="price-tag">
                    ab ${Math.round(vehicle.pricePerDay * 0.9)}€<br><span>/ Tag</span>
                </div>
                <p style="margin-bottom: 2rem; color: var(--text-light);">
                    ${vehicle.features.join(' • ')}
                </p>
                <button onclick="openBookingModal()" class="btn btn-primary full-width" style="max-width: 300px;">
                    Verfügbarkeit prüfen & Buchen
                </button>
            </div>
        </div>

        <div style="margin: 4rem 0;">
            <h2 style="margin-bottom: 2rem;">📸 Innenausstattung</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                ${vehicle.interiorImages ? vehicle.interiorImages.map(img => `<img src="${img}" alt="Innenansicht" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect fill=%22%23ddd%22 width=%22600%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-family=%22Arial%22%3EBild lädt..%3C/text%3E%3C/svg%3E'">`).join('') : '<p>Keine Innenbilder verfügbar</p>'}
            </div>
        </div>

        <div class="details-grid">
            <div class="detail-card">
                <h3>📋 Basisdaten</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">🛏️ ${vehicle.beds} Betten</div>
                    <div class="detail-item">💺 ${vehicle.seats || 4} Sitzplätze</div>
                    <div class="detail-item">🪪 ${vehicle.license}</div>
                    <div class="detail-item">⚙️ ${vehicle.transmission}</div>
                    <div class="detail-item">🐎 ${vehicle.power} PS</div>
                    <div class="detail-item">🏭 ${vehicle.brand}</div>
                    <div class="detail-item">🎨 ${vehicle.color}</div>
                </div>
            </div>

            <div class="detail-card">
                <h3>📏 Abmessungen & Gewichte</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Länge: ${vehicle.dimensions.length}m</div>
                    <div class="detail-item">Breite: ${vehicle.dimensions.width}m</div>
                    <div class="detail-item">Höhe: ${vehicle.dimensions.height}m</div>
                    <div class="detail-item">Leergewicht: ${vehicle.weights.empty}kg</div>
                    <div class="detail-item">Max. Gewicht: ${vehicle.weights.max}kg</div>
                </div>
            </div>

            <div class="detail-card">
                <h3>🍳 Küche</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">🔥 ${vehicle.kitchen.stove}</div>
                    <div class="detail-item">❄️ ${vehicle.kitchen.fridge}</div>
                    <div class="detail-item">🚰 ${vehicle.kitchen.sink}</div>
                    ${vehicle.kitchen.oven ? '<div class="detail-item">🔥 Backofen</div>' : ''}
                    ${vehicle.kitchen.microwave ? '<div class="detail-item">📻 Mikrowelle</div>' : ''}
                    ${vehicle.kitchen.dishwasher ? '<div class="detail-item">🧼 Spülmaschine</div>' : ''}
                </div>
            </div>

            <div class="detail-card">
                <h3>🚿 Sanitär</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">${vehicle.sanitary.toilet ? '✅' : '❌'} WC</div>
                    <div class="detail-item">${vehicle.sanitary.shower ? '✅' : '❌'} Dusche</div>
                </div>
            </div>

            <div class="detail-card">
                <h3>${vehicle.fuel.type === 'Elektro' ? '⚡ Stromverbrauch' : '⛽ Kraftstoff'}</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Typ: ${vehicle.fuel.type}</div>
                    <div class="detail-item">Verbrauch: ${vehicle.fuel.consumption}${vehicle.fuel.consumptionUnit ? vehicle.fuel.consumptionUnit : 'l/100km'}</div>
                    <div class="detail-item">Emission: ${vehicle.fuel.emissionClass}</div>
                </div>
            </div>

            ${vehicle.towing.hasHitch ? `
            <div class="detail-card">
                <h3>🔗 Anhängerkupplung</h3>
                <div class="detail-item">Max. Anhängelast: ${vehicle.towing.maxLoad}kg</div>
            </div>
            ` : ''}

            ${vehicle.battery ? `
            <div class="detail-card">
                <h3>🔋 Batterie/Stromversorgung</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Kapazität: ${vehicle.battery.capacity}</div>
                    <div class="detail-item">Typ: ${vehicle.battery.type}</div>
                    <div class="detail-item">Spannung: ${vehicle.battery.voltage}</div>
                    <div class="detail-item">Ladezeit: ${vehicle.battery.chargeTime}</div>
                </div>
            </div>
            ` : ''}

            ${vehicle.interior ? `
            <div class="detail-card">
                <h3>🏠 Innenausstattung</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Isolierung: ${vehicle.interior.insulation}</div>
                    <div class="detail-item">Bodenbelag: ${vehicle.interior.flooring}</div>
                    <div class="detail-item">Decke: ${vehicle.interior.ceiling}</div>
                    <div class="detail-item">Fenster: ${vehicle.interior.windows}</div>
                    <div class="detail-item">Tür: ${vehicle.interior.doorType}</div>
                </div>
            </div>
            ` : ''}

            ${vehicle.safety ? `
            <div class="detail-card">
                <h3>🛡️ Sicherheitsausstattung</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Airbags: ${vehicle.safety.airbags}</div>
                    <div class="detail-item">${vehicle.safety.abs ? '✅' : '❌'} ABS</div>
                    <div class="detail-item">${vehicle.safety.esc ? '✅' : '❌'} ESP</div>
                    <div class="detail-item">${vehicle.safety.fireExtinguisher ? '✅' : '❌'} Feuerlöscher</div>
                    <div class="detail-item">${vehicle.safety.firstAidKit ? '✅' : '❌'} Erste-Hilfe-Kit</div>
                    <div class="detail-item">${vehicle.safety.warningTriangle ? '✅' : '❌'} Warndreieck</div>
                </div>
            </div>
            ` : ''}

            ${vehicle.connectivity ? `
            <div class="detail-card">
                <h3>📡 Konnektivität & Technik</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Radio: ${vehicle.connectivity.radio}</div>
                    <div class="detail-item">USB-Anschlüsse: ${vehicle.connectivity.usbPorts}</div>
                    <div class="detail-item">WiFi: ${vehicle.connectivity.wifi}</div>
                    <div class="detail-item">GPS/Navigation: ${vehicle.connectivity.gps}</div>
                </div>
            </div>
            ` : ''}

            ${vehicle.ev ? `
            <div class="detail-card" style="grid-column: 1/-1;">
                <h3>⚡ Elektro-Spezifikationen</h3>
                <div class="detail-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                    <div class="detail-item">Batterietyp: ${vehicle.ev.batteryType}</div>
                    <div class="detail-item">Kapazität: ${vehicle.ev.batteryCapacity} ${vehicle.ev.batteryCapacityUnit}</div>
                    <div class="detail-item">Reichweite Sommer: ${vehicle.ev.rangeSummer} km</div>
                    <div class="detail-item">Reichweite Winter: ${vehicle.ev.rangeWinter} km</div>
                    ${vehicle.ev.rangeCity ? `<div class="detail-item">Reichweite Stadt: ${vehicle.ev.rangeCity} km</div>` : ''}
                    ${vehicle.ev.rangeAutobahn ? `<div class="detail-item">Reichweite Autobahn: ${vehicle.ev.rangeAutobahn} km</div>` : ''}
                    <div class="detail-item">AC-Ladung: ${vehicle.ev.acCharging}</div>
                    <div class="detail-item">AC-Ladezeit: ${vehicle.ev.acChargeTime}</div>
                    <div class="detail-item">DC-Schnelllader: ${vehicle.ev.dcCharging}</div>
                    <div class="detail-item">DC-Ladezeit: ${vehicle.ev.dcChargeTime}</div>
                    <div class="detail-item">Effizienz: ${vehicle.ev.efficiency}</div>
                    <div class="detail-item">${vehicle.ev.regeneration ? '✅' : '❌'} Rekuperation</div>
                    ${vehicle.ev.regenerationPower ? `<div class="detail-item">Rekuperationsleistung: ${vehicle.ev.regenerationPower}</div>` : ''}
                    <div class="detail-item">Stecker-Standards: ${Array.isArray(vehicle.ev.chargeConnectors) ? vehicle.ev.chargeConnectors.join(', ') : vehicle.ev.chargeConnectors}</div>
                    <div class="detail-item">Öffentliches Laden: ${vehicle.ev.publicCharging}</div>
                </div>
            </div>
            ` : ''}

            ${vehicle.assistanceSystems && vehicle.assistanceSystems.length > 0 ? `
            <div class="detail-card" style="grid-column: 1/-1;">
                <h3>🛡️ Assistenzsysteme</h3>
                <div class="all-features">
                    ${vehicle.assistanceSystems.map(sys => `<span class="tag tag-assistance">${sys}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="detail-card" style="grid-column: 1/-1;">
                <h3>📍 Verfügbare Standorte</h3>
                <p>${vehicle.availableLocations.join(', ')}</p>
            </div>

            <div class="detail-card" style="grid-column: 1/-1;">
                <h3>📅 Verfügbarkeit</h3>
                <div id="availability-calendar"></div>
            </div>
        </div>
        
        <div style="margin-top: 2rem;" id="reviews-section"></div>
    `;
}

// Booking Modal Logic (Simplified version of script.js logic)
const bookingModal = document.getElementById('booking-modal');
const closeModal = document.querySelector('.close-modal');
let bookingForm = document.getElementById('booking-form');

// Season Calculation (Helper Function) - MUST be defined FIRST before use
function getSeasonMultiplier(date) {
    const month = date.getMonth() + 1; // 1-12
    // Hochsaison: Juni-August (6-8) = +20%
    if (month >= 6 && month <= 8) {
        return 1.20;
    }
    // Nebensaison: Dezember-Februar (12, 1, 2) = -10%
    if (month === 12 || month === 1 || month === 2) {
        return 0.90;
    }
    // Normalsaison: Rest = 0%
    return 1.00;
}

// Calculate deposit based on daily rate
function getDepositAmount(dailyRate) {
    // Staffelung basierend auf Tagespreis
    if (dailyRate <= 100) {
        return 800;   // VW California Ocean (95€)
    } else if (dailyRate <= 120) {
        return 1000;  // VW Crafter (110€), Fiat (105€), Mercedes Sprinter (120€)
    } else if (dailyRate <= 140) {
        return 1200;  // Ford Transit (115€), VW ID.Buzz (135€)
    } else {
        return 1500;  // Mercedes Sprinter 4x4 (145€)
    }
}

function setupBookingModal(vehicle) {
    // Get fresh reference to bookingForm - it might not exist yet on initial page load
    bookingForm = document.getElementById('booking-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (!bookingForm) {
        console.error('Booking form not found!');
        return;
    }
    
    console.log('setupBookingModal called, bookingForm exists:', !!bookingForm);
    // Store vehicle globally for submit handler
    window.currentBookingVehicle = vehicle;
    
    window.openBookingModal = function () {
        // Prüfe, ob Benutzer angemeldet ist
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            alert('⚠️ Bitte melden Sie sich an, um zu buchen');
            // Öffne das Auth-Modal (wenn vorhanden auf dieser Seite)
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.style.display = 'block';
            }
            return;
        }

        document.getElementById('modal-vehicle-name').textContent = `Buchen: ${vehicle.name}`;
        document.getElementById('modal-vehicle-image').src = vehicle.image;
        document.getElementById('daily-rate').textContent = 'ab ' + Math.round(vehicle.pricePerDay * 0.9);
        
        // Initialize Flatpickr
        initFlatpickr(vehicle.id);
        
        bookingModal.style.display = 'block';
    };

    function initFlatpickr(vehicleId) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const vehicleBookings = bookings.filter(b => b.vehicleId === vehicleId);
        
        const disabledDates = vehicleBookings.map(b => {
            return {
                from: b.startDate,
                to: b.endDate
            };
        });

        // Function to validate date range against existing bookings
        function validateDateRange() {
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            const errorContainer = document.getElementById('date-conflict-error');
            
            if (!startDateInput.value || !endDateInput.value) {
                if (errorContainer) errorContainer.style.display = 'none';
                return true;
            }
            
            const selectedStart = new Date(startDateInput.value);
            const selectedEnd = new Date(endDateInput.value);
            
            for (let booking of vehicleBookings) {
                const bookedStart = new Date(booking.startDate);
                const bookedEnd = new Date(booking.endDate);
                
                // Check if there's an overlap
                if (selectedStart < bookedEnd && selectedEnd > bookedStart) {
                    if (errorContainer) {
                        errorContainer.style.display = 'block';
                    }
                    return false;
                }
            }
            
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
            return true;
        }
    
        const commonConfig = {
            locale: 'de',
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledDates
        };
    
        flatpickr("#start-date", {
            ...commonConfig,
            onChange: function(selectedDates, dateStr, instance) {
                // Update minDate of end-date picker
                const endDatePicker = document.querySelector("#end-date")._flatpickr;
                if (endDatePicker && selectedDates[0]) {
                    endDatePicker.set('minDate', selectedDates[0]);
                }
                validateDateRange();
                calculatePrice();
            }
        });
    
        flatpickr("#end-date", {
            ...commonConfig,
            onChange: function(selectedDates, dateStr, instance) {
                validateDateRange();
                calculatePrice();
            }
        });
    }

    closeModal.addEventListener('click', () => {
        bookingModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });

    // Price Calculation
    function calculatePrice() {
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);

        if (start && end && end > start) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Calculate average seasonal multiplier across the rental period
            let seasonalMultiplier = 0;
            let totalDays = 0;
            const currentDate = new Date(start);
            while (currentDate < end) {
                seasonalMultiplier += getSeasonMultiplier(currentDate);
                totalDays++;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            seasonalMultiplier = seasonalMultiplier / totalDays;
            
            // Calculate seasonal adjusted daily rate
            const seasonalDailyRate = Math.round(vehicle.pricePerDay * seasonalMultiplier);
            const basePrice = diffDays * seasonalDailyRate;
            
            // Calculate discount
            let discountPercent = 0;
            if (diffDays >= 15) {
                discountPercent = 20;
            } else if (diffDays >= 8) {
                discountPercent = 15;
            } else if (diffDays >= 4) {
                discountPercent = 10;
            }
            
            let discountAmount = 0;
            if (discountPercent > 0) {
                discountAmount = Math.round(basePrice * discountPercent / 100);
            }
            
            const totalPrice = basePrice - discountAmount;
            
            // Update display
            document.getElementById('rental-days').textContent = diffDays;
            document.getElementById('total-price-display').textContent = totalPrice;
            document.getElementById('daily-rate').textContent = seasonalDailyRate;
            
            // Update price breakdown (simplified - just show final price with discount)
            const priceBreakdownDiv = document.getElementById('price-breakdown');
            if (discountPercent > 0) {
                priceBreakdownDiv.style.display = 'block';
                
                let priceBreakdownHTML = `
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <span style="text-decoration: line-through; color: #999;">Basis: ${basePrice}€</span><br>
                        <span style="color: #10b981;">- ${discountAmount}€ ${discountPercent}% Rabatt</span><br>
                        <strong>Gesamtpreis: ${totalPrice}€</strong>
                    </div>
                `;
                
                const breakdownContainer = document.getElementById('price-breakdown');
                breakdownContainer.innerHTML = priceBreakdownHTML;
            } else {
                priceBreakdownDiv.style.display = 'none';
            }
            
            // Update discount info
            const discountInfoDiv = document.getElementById('discount-info');
            const discountText = document.getElementById('discount-text');
            const discountNext = document.getElementById('discount-next');
            
            discountInfoDiv.style.display = 'block';
            
            if (discountPercent > 0) {
                discountText.textContent = `✅ ${discountPercent}% Rabatt! Sie sparen ${discountAmount}€`;
                
                // Show how many days until next discount
                if (diffDays >= 15) {
                    discountNext.textContent = 'Maximaler Rabatt erreicht!';
                } else if (diffDays >= 8) {
                    const daysUntilMax = 15 - diffDays;
                    discountNext.textContent = `Nur noch ${daysUntilMax} ${daysUntilMax === 1 ? 'Tag' : 'Tage'} bis 20% Rabatt!`;
                } else if (diffDays >= 4) {
                    const daysUntil15 = 8 - diffDays;
                    discountNext.textContent = `Nur noch ${daysUntil15} ${daysUntil15 === 1 ? 'Tag' : 'Tage'} bis 15% Rabatt!`;
                }
            } else {
                discountText.textContent = `💰 Rabatte verfügbar!`;
                const daysUntil10 = 4 - diffDays;
                discountNext.textContent = `Nur noch ${daysUntil10} ${daysUntil10 === 1 ? 'Tag' : 'Tage'} bis 10% Rabatt!`;
            }
        }
    }

    window.validateAge = function() {
        const birthDateInput = document.getElementById('birth-date');
        const ageErrorDiv = document.getElementById('age-error');
        
        if (!birthDateInput.value) {
            ageErrorDiv.style.display = 'none';
            return;
        }
        
        const birthDate = new Date(birthDateInput.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 21) {
            ageErrorDiv.textContent = '⚠️ Du darfst frühestens mit 21 Jahren mieten.';
            ageErrorDiv.style.display = 'block';
        } else if (age > 75) {
            ageErrorDiv.textContent = '⚠️ Vermietung ist nur bis 75 Jahre möglich.';
            ageErrorDiv.style.display = 'block';
        } else {
            ageErrorDiv.style.display = 'none';
        }
    };

    window.validateLicense = function() {
        const licenseValidSinceInput = document.getElementById('license-valid-since');
        const licenseErrorDiv = document.getElementById('license-error');
        
        if (!licenseValidSinceInput.value) {
            licenseErrorDiv.style.display = 'none';
            return;
        }
        
        const licenseDate = new Date(licenseValidSinceInput.value);
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        
        if (licenseDate > oneYearAgo) {
            licenseErrorDiv.textContent = '⚠️ Der Führerschein muss seit mindestens 1 Jahr vorhanden sein.';
            licenseErrorDiv.style.display = 'block';
        } else {
            licenseErrorDiv.style.display = 'none';
        }
    };

    // Remove old event listeners before adding new ones
    if (startDateInput) {
        startDateInput.removeEventListener('change', calculatePrice);
        startDateInput.addEventListener('change', calculatePrice);
    }
    if (endDateInput) {
        endDateInput.removeEventListener('change', calculatePrice);
        endDateInput.addEventListener('change', calculatePrice);
    }

    window.closeBookingModal = function() {
        bookingModal.style.display = 'none';
        // Reset form
        document.getElementById('step-1-dates').style.display = 'block';
        document.getElementById('step-2-renter').style.display = 'none';
        document.getElementById('step-3-location').style.display = 'none';
        document.getElementById('step-4-terms').style.display = 'none';
        bookingForm.reset();
    };
}

function renderAvailability(vehicleId) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const vehicleBookings = bookings.filter(b => b.vehicleId === vehicleId);
    
    const container = document.getElementById('availability-calendar');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to check if a date is booked
    const isBooked = (date) => {
        return vehicleBookings.some(b => {
            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            return date >= start && date <= end;
        });
    };

    let html = `
        <style>
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 1rem; }
            .calendar-day { 
                aspect-ratio: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border-radius: 4px; 
                font-size: 0.8rem;
                position: relative;
            }
            .day-header { font-weight: bold; text-align: center; font-size: 0.8rem; padding-bottom: 0.5rem; }
            .month-container { margin-bottom: 1.5rem; }
            .month-title { font-weight: bold; margin-bottom: 0.5rem; text-align: center; }
            .status-available { background-color: #dcfce7; color: #166534; }
            .status-booked { background-color: #fee2e2; color: #991b1b; }
            .status-past { background-color: #f3f4f6; color: #9ca3af; }
            .legend { display: flex; gap: 1rem; font-size: 0.8rem; margin-bottom: 1rem; justify-content: center; }
            .legend-item { display: flex; align-items: center; gap: 0.25rem; }
            .legend-box { width: 12px; height: 12px; border-radius: 2px; }
        </style>
        <div class="legend">
            <div class="legend-item"><div class="legend-box status-available"></div>Verfügbar</div>
            <div class="legend-item"><div class="legend-box status-booked"></div>Belegt</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
    `;

    // Render next 12 months
    for (let i = 0; i < 12; i++) {
        const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const monthName = currentMonthDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
        // Adjust for Monday start (Monday=0, Sunday=6)
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        html += `
            <div class="month-container">
                <div class="month-title">${monthName}</div>
                <div class="calendar-grid">
                    <div class="day-header">Mo</div><div class="day-header">Di</div><div class="day-header">Mi</div>
                    <div class="day-header">Do</div><div class="day-header">Fr</div><div class="day-header">Sa</div>
                    <div class="day-header">So</div>
        `;

        // Empty cells for days before start of month
        for (let j = 0; j < startOffset; j++) {
            html += `<div></div>`;
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateToCheck = new Date(year, month, day);
            let statusClass = '';
            
            if (dateToCheck < today) {
                statusClass = 'status-past';
            } else if (isBooked(dateToCheck)) {
                statusClass = 'status-booked';
            } else {
                statusClass = 'status-available';
            }

            html += `<div class="calendar-day ${statusClass}">${day}</div>`;
        }

        html += `
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Step Navigation Functions
function goToStep2() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const errorContainer = document.getElementById('date-conflict-error');
    
    if (!startDateInput.value || !endDateInput.value) {
        alert('Bitte wählen Sie Start- und Enddatum aus.');
        return;
    }
    
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    
    if (end <= start) {
        alert('Das Enddatum muss nach dem Startdatum liegen.');
        return;
    }

    // If there's a conflict error shown, don't proceed
    if (errorContainer && errorContainer.style.display !== 'none') {
        alert('Dieser Zeitraum ist leider nicht verfügbar. Bitte wählen Sie einen anderen Termin.');
        return;
    }
    
    document.getElementById('step-1-dates').style.display = 'none';
    document.getElementById('step-2-renter').style.display = 'block';
}

function goToStep1() {
    document.getElementById('step-1-dates').style.display = 'block';
    document.getElementById('step-2-renter').style.display = 'none';
}

function goToStep3() {
    // Check if age error is displayed
    const ageErrorDiv = document.getElementById('age-error');
    if (ageErrorDiv && ageErrorDiv.style.display !== 'none') {
        alert('Bitte geben Sie ein gültiges Geburtsdatum ein (Alter: 21-75 Jahre).');
        return;
    }

    // Check if license error is displayed
    const licenseErrorDiv = document.getElementById('license-error');
    if (licenseErrorDiv && licenseErrorDiv.style.display !== 'none') {
        alert('Der Führerschein muss seit mindestens 1 Jahr vorhanden sein.');
        return;
    }

    // Check if insurance is selected
    const insuranceType = document.getElementById('insurance-type').value;
    if (!insuranceType) {
        alert('Bitte wählen Sie eine Versicherungsoption aus.');
        return;
    }

    // Validate step 2 fields
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const birthDate = document.getElementById('birth-date').value;
    const street = document.getElementById('street').value.trim();
    const postalCode = document.getElementById('postal-code').value.trim();
    const city = document.getElementById('city').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const licenseClass = document.getElementById('license-class').value;
    const licenseValidSince = document.getElementById('license-valid-since').value;

    // Clear previous error indicators
    document.querySelectorAll('.form-error-indicator').forEach(el => el.remove());
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));

    // Check which fields are empty and mark them
    let hasErrors = false;
    const fieldsToCheck = [
        { id: 'first-name', value: firstName },
        { id: 'last-name', value: lastName },
        { id: 'birth-date', value: birthDate },
        { id: 'street', value: street },
        { id: 'postal-code', value: postalCode },
        { id: 'city', value: city },
        { id: 'phone', value: phone },
        { id: 'license-class', value: licenseClass },
        { id: 'license-valid-since', value: licenseValidSince }
    ];

    fieldsToCheck.forEach(field => {
        if (!field.value) {
            hasErrors = true;
            const input = document.getElementById(field.id);
            const formGroup = input.closest('.form-group');
            
            if (formGroup) {
                formGroup.classList.add('has-error');
                const errorIndicator = document.createElement('span');
                errorIndicator.className = 'form-error-indicator';
                errorIndicator.textContent = '❗';
                formGroup.appendChild(errorIndicator);
            }
        }
    });

    // Check additional driver fields only if enabled
    const additionalDriverCheckbox = document.getElementById('additional-driver-checkbox');
    const hasAdditionalDriver = additionalDriverCheckbox && additionalDriverCheckbox.checked;
    
    console.log('goToStep3 - hasAdditionalDriver:', hasAdditionalDriver, 'checkbox:', additionalDriverCheckbox);
    
    if (hasAdditionalDriver === true) {
        const driver2FirstName = document.getElementById('driver2-first-name').value.trim();
        const driver2LastName = document.getElementById('driver2-last-name').value.trim();
        const driver2BirthDate = document.getElementById('driver2-birth-date').value;
        const driver2Street = document.getElementById('driver2-street').value.trim();
        const driver2PostalCode = document.getElementById('driver2-postal-code').value.trim();
        const driver2City = document.getElementById('driver2-city').value.trim();
        const driver2Phone = document.getElementById('driver2-phone').value.trim();
        const driver2LicenseClass = document.getElementById('driver2-license-class').value;
        const driver2LicenseValidSince = document.getElementById('driver2-license-valid-since').value;

        // Check driver 2 age error
        const driver2AgeError = document.getElementById('driver2-age-error');
        if (driver2AgeError && driver2AgeError.style.display !== 'none') {
            alert('Zusätzlicher Fahrer: Bitte geben Sie ein gültiges Geburtsdatum ein (Alter: 21-75 Jahre).');
            return;
        }

        // Check driver 2 license error
        const driver2LicenseError = document.getElementById('driver2-license-error');
        if (driver2LicenseError && driver2LicenseError.style.display !== 'none') {
            alert('Zusätzlicher Fahrer: Der Führerschein muss seit mindestens 1 Jahr vorhanden sein.');
            return;
        }

        const driver2FieldsToCheck = [
            { id: 'driver2-first-name', value: driver2FirstName },
            { id: 'driver2-last-name', value: driver2LastName },
            { id: 'driver2-birth-date', value: driver2BirthDate },
            { id: 'driver2-street', value: driver2Street },
            { id: 'driver2-postal-code', value: driver2PostalCode },
            { id: 'driver2-city', value: driver2City },
            { id: 'driver2-phone', value: driver2Phone },
            { id: 'driver2-license-class', value: driver2LicenseClass },
            { id: 'driver2-license-valid-since', value: driver2LicenseValidSince }
        ];

        driver2FieldsToCheck.forEach(field => {
            if (!field.value) {
                hasErrors = true;
                const input = document.getElementById(field.id);
                if (input) {
                    const formGroup = input.closest('.form-group');
                    if (formGroup) {
                        formGroup.classList.add('has-error');
                        if (!formGroup.querySelector('.form-error-indicator')) {
                            const errorIndicator = document.createElement('span');
                            errorIndicator.className = 'form-error-indicator';
                            errorIndicator.textContent = '❗';
                            formGroup.appendChild(errorIndicator);
                        }
                    }
                }
            }
        });
    }

    if (hasErrors) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus.');
        return;
    }

    document.getElementById('step-2-renter').style.display = 'none';
    document.getElementById('step-3-location').style.display = 'block';
}

function goToStep4() {
    const pickupLocation = document.getElementById('pickup-location').value;
    if (!pickupLocation) {
        alert('Bitte wählen Sie einen Abholstandort aus.');
        return;
    }

    document.getElementById('step-3-location').style.display = 'none';
    document.getElementById('step-4-terms').style.display = 'block';
    
    // Display cost summary in step 4
    displayCostSummaryInStep4();
}

function displayCostSummaryInStep4() {
    // Calculate all costs for preview
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const rentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const vehicle = window.currentBookingVehicle;
    const dailyRate = parseInt(vehicle.pricePerDay) || 0;
    
    // Calculate average seasonal multiplier
    let seasonalMultiplier = 0;
    let totalDays = 0;
    const currentDate = new Date(start);
    while (currentDate < end) {
        seasonalMultiplier += getSeasonMultiplier(currentDate);
        totalDays++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    seasonalMultiplier = seasonalMultiplier / totalDays;
    
    // Apply seasonal multiplier to daily rate
    const seasonalDailyRate = Math.round(dailyRate * seasonalMultiplier);
    let baseRentalCost = seasonalDailyRate * rentDays;
    
    // Calculate discount based on rental duration
    let discountPercent = 0;
    if (rentDays >= 15) {
        discountPercent = 20;
    } else if (rentDays >= 8) {
        discountPercent = 15;
    } else if (rentDays >= 4) {
        discountPercent = 10;
    }
    
    let discountAmount = 0;
    if (discountPercent > 0) {
        discountAmount = Math.round(baseRentalCost * discountPercent / 100);
    }
    
    const rentalCostAfterDiscount = baseRentalCost - discountAmount;
    
    // Check additional driver
    const hasAdditionalDriver = document.getElementById('additional-driver-checkbox')?.checked;
    let additionalDriverCost = 0;
    if (hasAdditionalDriver) {
        additionalDriverCost = 25 * rentDays;
    }
    
    // Insurance costs
    const insuranceType = document.getElementById('insurance-type').value;
    let insuranceCost = 0;
    let insuranceLabel = '';
    
    if (insuranceType === 'vollkasko-500') {
        insuranceCost = 15 * rentDays;
        insuranceLabel = 'Vollkasko - 500€ Selbstbeteiligung';
    } else if (insuranceType === 'vollkasko-1000') {
        insuranceCost = 10 * rentDays;
        insuranceLabel = 'Vollkasko - 1000€ Selbstbeteiligung';
    } else if (insuranceType === 'teilkasko-500') {
        insuranceCost = 8 * rentDays;
        insuranceLabel = 'Teilkasko - 500€ Selbstbeteiligung';
    } else if (insuranceType === 'teilkasko-1000') {
        insuranceCost = 5 * rentDays;
        insuranceLabel = 'Teilkasko - 1000€ Selbstbeteiligung';
    }
    
    // Fixed costs
    const cleaningCost = 70;
    const depositAmount = getDepositAmount(parseInt(vehicle.pricePerDay));
    
    const subtotal = rentalCostAfterDiscount + additionalDriverCost + insuranceCost;
    const totalWithCleaning = subtotal + cleaningCost;
    const grandTotal = totalWithCleaning + depositAmount;
    
    const pickupLocation = document.getElementById('pickup-location').value;
    
    // Insert cost summary at the beginning of step-4-terms
    const step4Container = document.getElementById('step-4-terms');
    const costSummaryElement = document.createElement('div');
    costSummaryElement.id = 'step4-cost-summary';
    costSummaryElement.style.cssText = 'background: #f8f9fa; border-left: 4px solid var(--primary-color); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;';
    
    costSummaryElement.innerHTML = `
        <h4 style="margin-top: 0; color: var(--primary-color);">📋 Kostenübersicht</h4>
        
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>Fahrzeug:</strong> ${vehicle.name}</p>
            <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × ${seasonalDailyRate}€/Tag = <strong>${baseRentalCost}€</strong>
            </p>
            ${discountPercent > 0 ? `
            <p style="margin: 0.5rem 0; color: #10b981; font-size: 0.9rem;">
                <strong>✅ ${discountPercent}% Dauerdiscount:</strong> -${discountAmount}€
            </p>
            <p style="margin: 0.5rem 0; color: #10b981; font-size: 0.95rem;">
                <strong>Nach Rabatten: ${rentalCostAfterDiscount}€</strong>
            </p>
            ` : ''}
        </div>
        
        ${additionalDriverCost > 0 ? `
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>Zusätzlicher Fahrer:</strong></p>
            <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × 25€/Tag = <strong>${additionalDriverCost}€</strong>
            </p>
        </div>
        ` : ''}
        
        ${insuranceCost > 0 ? `
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>Versicherung:</strong> ${insuranceLabel}</p>
            <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × ${insuranceCost / rentDays}€/Tag = <strong>${insuranceCost}€</strong>
            </p>
        </div>
        ` : ''}
        
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>🧹 Endreinigung:</strong> <strong>${cleaningCost}€</strong></p>
        </div>
        
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>🏦 Kaution:</strong> <strong style="color: #d97706;">${depositAmount}€</strong></p>
            <p style="margin: 0.25rem 0; color: #999; font-size: 0.8rem;">Wird nach der Rückgabe des Fahrzeugs in ordnungsgemäßem Zustand vollständig erstattet.</p>
        </div>
        
        <div style="background: #fff3cd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <p style="margin: 0.5rem 0;"><strong>💳 Zahlbar vor Ort:</strong></p>
            <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Bargeld oder Kartenzahlung möglich</p>
        </div>
        
        <div style="background: #e8f3ff; padding: 1rem; border-radius: 6px;">
            <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Mietgebühr (ohne Kaution):</strong> <span style="float: right;"><strong>${totalWithCleaning}€</strong></span></p>
            <p style="margin: 0.5rem 0; border-top: 1px solid #d1e3f5; padding-top: 0.5rem; font-size: 1rem;"><strong>Kaution (wird erstattet):</strong> <span style="float: right;"><strong style="color: #d97706;">${depositAmount}€</strong></span></p>
            <p style="margin: 0.5rem 0; border-top: 2px solid var(--primary-color); padding-top: 0.5rem; font-size: 1.1rem;"><strong>💰 Gesamtbetrag:</strong> <span style="color: var(--primary-color); font-size: 1.2rem; float: right;"><strong>${grandTotal}€</strong></span></p>
        </div>
    `;
    
    // Remove old summary if it exists
    const oldSummary = document.getElementById('step4-cost-summary');
    if (oldSummary) {
        oldSummary.remove();
    }
    
    // Insert at the beginning of step 4, after the "Zurück" button
    const backButton = step4Container.querySelector('.btn');
    if (backButton) {
        backButton.parentNode.insertBefore(costSummaryElement, backButton.nextSibling);
    }
}

// Main booking submission function - called directly from button onclick
window.submitBooking = function() {
    console.log('=== SUBMIT BOOKING CALLED ===');
    
    // Check if terms are accepted
    const termsAccepted = document.getElementById('terms-accepted').checked;
    console.log('Terms accepted:', termsAccepted);
    if (!termsAccepted) {
        alert('Bitte akzeptieren Sie die AGB.');
        return;
    }

    try {
        console.log('Starting booking creation...');
        
        // Get all form data
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const birthDate = document.getElementById('birth-date').value;
        const street = document.getElementById('street').value.trim();
        const postalCode = document.getElementById('postal-code').value.trim();
        const city = document.getElementById('city').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const licenseClass = document.getElementById('license-class').value;
        const licenseValidSince = document.getElementById('license-valid-since').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const pickupLocation = document.getElementById('pickup-location').value;
        
        console.log('Form data retrieved:', { firstName, lastName, pickupLocation, startDate, endDate });

        // Calculate costs
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const rentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const vehicle = window.currentBookingVehicle;
        const dailyRate = parseInt(vehicle.pricePerDay) || 0;
        
        // Calculate average seasonal multiplier
        let seasonalMultiplier = 0;
        let totalDays = 0;
        const currentDate = new Date(start);
        while (currentDate < end) {
            seasonalMultiplier += getSeasonMultiplier(currentDate);
            totalDays++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        seasonalMultiplier = seasonalMultiplier / totalDays;
        
        // Apply seasonal multiplier to daily rate
        const seasonalDailyRate = Math.round(dailyRate * seasonalMultiplier);
        let baseRentalCost = seasonalDailyRate * rentDays;
        
        // Calculate discount based on rental duration
        let discountPercent = 0;
        if (rentDays >= 15) {
            discountPercent = 20;
        } else if (rentDays >= 8) {
            discountPercent = 15;
        } else if (rentDays >= 4) {
            discountPercent = 10;
        }
        
        let discountAmount = 0;
        if (discountPercent > 0) {
            discountAmount = Math.round(baseRentalCost * discountPercent / 100);
        }
        
        const rentalCostAfterDiscount = baseRentalCost - discountAmount;
        
        // Check additional driver if enabled
        const hasAdditionalDriver = document.getElementById('additional-driver-checkbox')?.checked;
        let additionalDriver = null;
        let additionalDriverCost = 0;
        
        if (hasAdditionalDriver) {
            const driver2FirstName = document.getElementById('driver2-first-name').value.trim();
            const driver2LastName = document.getElementById('driver2-last-name').value.trim();
            const driver2BirthDate = document.getElementById('driver2-birth-date').value;
            const driver2Street = document.getElementById('driver2-street').value.trim();
            const driver2PostalCode = document.getElementById('driver2-postal-code').value.trim();
            const driver2City = document.getElementById('driver2-city').value.trim();
            const driver2Phone = document.getElementById('driver2-phone').value.trim();
            const driver2LicenseClass = document.getElementById('driver2-license-class').value;
            const driver2LicenseValidSince = document.getElementById('driver2-license-valid-since').value;
            
            additionalDriver = {
                firstName: driver2FirstName,
                lastName: driver2LastName,
                birthDate: driver2BirthDate,
                address: `${driver2Street}, ${driver2PostalCode} ${driver2City}`,
                phone: driver2Phone,
                licenseClass: driver2LicenseClass,
                licenseValidSince: driver2LicenseValidSince
            };
            
            additionalDriverCost = 25 * rentDays;
        }
        
        // Insurance costs
        const insuranceType = document.getElementById('insurance-type').value;
        let insuranceCost = 0;
        let insuranceDeductible = 0;
        let insuranceLabel = '';
        
        if (insuranceType === 'vollkasko-500') {
            insuranceCost = 15 * rentDays;
            insuranceDeductible = 500;
            insuranceLabel = 'Vollkasko - 500€ Selbstbeteiligung';
        } else if (insuranceType === 'vollkasko-1000') {
            insuranceCost = 10 * rentDays;
            insuranceDeductible = 1000;
            insuranceLabel = 'Vollkasko - 1000€ Selbstbeteiligung';
        } else if (insuranceType === 'teilkasko-500') {
            insuranceCost = 8 * rentDays;
            insuranceDeductible = 500;
            insuranceLabel = 'Teilkasko - 500€ Selbstbeteiligung';
        } else if (insuranceType === 'teilkasko-1000') {
            insuranceCost = 5 * rentDays;
            insuranceDeductible = 1000;
            insuranceLabel = 'Teilkasko - 1000€ Selbstbeteiligung';
        }
        
        // Fixed costs
        const cleaningCost = 70;
        const depositAmount = getDepositAmount(dailyRate);
        
        // Calculate totals
        const subtotal = rentalCostAfterDiscount + additionalDriverCost + insuranceCost;
        const totalWithCleaning = subtotal + cleaningCost;
        const grandTotal = totalWithCleaning + depositAmount;

        // Create booking object
        console.log('Vehicle from window:', vehicle);
        
        if (!vehicle || !vehicle.name || !vehicle.id) {
            throw new Error('Vehicle data missing! ' + JSON.stringify(vehicle));
        }
        
        const booking = {
            id: Date.now(),
            vehicleName: vehicle.name,
            vehicleId: vehicle.id,
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate,
            address: `${street}, ${postalCode} ${city}`,
            phone: phone,
            licenseClass: licenseClass,
            licenseValidSince: licenseValidSince,
            startDate: startDate,
            endDate: endDate,
            pickupLocation: pickupLocation,
            totalPrice: grandTotal,
            additionalDriver: additionalDriver,
            bookingDate: new Date().toLocaleDateString('de-DE'),
            // Cost breakdown
            rentDays: rentDays,
            dailyRate: dailyRate,
            seasonalDailyRate: seasonalDailyRate,
            baseRentalCost: baseRentalCost,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            rentalCostAfterDiscount: rentalCostAfterDiscount,
            additionalDriverCost: additionalDriverCost,
            insuranceType: insuranceType,
            insuranceCost: insuranceCost,
            insuranceDeductible: insuranceDeductible,
            cleaningCost: cleaningCost,
            depositAmount: depositAmount,
            subtotal: subtotal,
            totalWithCleaning: totalWithCleaning,
            grandTotal: grandTotal
        };
        
        console.log('Booking object created:', booking);

        // Save to localStorage
        let bookings = [];
        const saved = localStorage.getItem('bookings') || '[]';
        console.log('Saved bookings string:', saved);
        
        try {
            bookings = JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing bookings:', e);
            bookings = [];
        }
        
        bookings.push(booking);
        
        try {
            localStorage.setItem('bookings', JSON.stringify(bookings));
            console.log('Booking saved to localStorage successfully. Total bookings:', bookings.length);
        } catch (e) {
            console.error('Error saving booking to localStorage:', e);
            throw e;
        }

        // Show success message with detailed invoice
        console.log('Showing success message...');
        const bookingContent = document.querySelector('.modal-content');
        bookingContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Buchung erfolgreich!</h2>
                <p style="color: #666; margin-bottom: 1.5rem;">
                    Vielen Dank, <strong>${firstName} ${lastName}</strong>! Ihre Buchung wurde erfolgreich registriert.
                </p>
                <p style="color: #10b981; background: #f0fdf4; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.95rem;">
                    ✉️ <strong>Alle relevanten Informationen werden Ihnen per E-Mail zugesandt.</strong>
                </p>
                
                <!-- Kostenübersicht -->
                <div style="background: #f8f9fa; border-left: 4px solid var(--primary-color); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                    <h4 style="margin-top: 0; color: var(--primary-color);">📋 Kostenübersicht</h4>
                    
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>Fahrzeug:</strong> ${vehicle.name}</p>
                        <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                            ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × ${seasonalDailyRate}€/Tag = <strong>${baseRentalCost}€</strong>
                        </p>
                        ${discountPercent > 0 ? `
                        <p style="margin: 0.5rem 0; color: #10b981; font-size: 0.9rem;">
                            <strong>✅ ${discountPercent}% Dauerdiscount:</strong> -${discountAmount}€
                        </p>
                        <p style="margin: 0.5rem 0; color: #10b981; font-size: 0.95rem;">
                            <strong>Nach Rabatten: ${rentalCostAfterDiscount}€</strong>
                        </p>
                        ` : ''}
                    </div>
                    
                    ${additionalDriverCost > 0 ? `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>Zusätzlicher Fahrer:</strong></p>
                        <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                            ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × 25€/Tag = <strong>${additionalDriverCost}€</strong>
                        </p>
                    </div>
                    ` : ''}
                    
                    ${insuranceCost > 0 ? `
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>Versicherung:</strong> ${insuranceLabel}</p>
                        <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
                            ${rentDays} ${rentDays === 1 ? 'Tag' : 'Tage'} × ${insuranceCost / rentDays}€/Tag = <strong>${insuranceCost}€</strong>
                        </p>
                    </div>
                    ` : ''}
                    
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>🧹 Endreinigung:</strong> <strong>${cleaningCost}€</strong></p>
                    </div>
                    
                    <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>🏦 Kaution:</strong> <strong style="color: #d97706;">1.000€</strong></p>
                        <p style="margin: 0.25rem 0; color: #999; font-size: 0.8rem;">Wird nach der Rückgabe des Fahrzeugs in ordnungsgemäßem Zustand vollständig erstattet.</p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                        <p style="margin: 0.5rem 0;"><strong>💳 Zahlbar vor Ort:</strong></p>
                        <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Bargeld oder Kartenzahlung möglich</p>
                    </div>
                    
                    <div style="background: #e8f3ff; padding: 1rem; border-radius: 6px;">
                        <p style="margin: 0.25rem 0; font-size: 0.95rem;"><strong>Mietgebühr (ohne Kaution):</strong> <span style="float: right;"><strong>${totalWithCleaning}€</strong></span></p>
                        <p style="margin: 0.5rem 0; border-top: 1px solid #d1e3f5; padding-top: 0.5rem; font-size: 1rem;"><strong>Kaution (wird erstattet):</strong> <span style="float: right;"><strong style="color: #d97706;">1.000€</strong></span></p>
                        <p style="margin: 0.5rem 0; border-top: 2px solid var(--primary-color); padding-top: 0.5rem; font-size: 1.1rem;"><strong>💰 Gesamtbetrag:</strong> <span style="color: var(--primary-color); font-size: 1.2rem; float: right;">${grandTotal}€</span></p>
                    </div>
                </div>
                
                <!-- Zusätzliche Informationen -->
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>📍 Abholort:</strong> ${pickupLocation}</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>📅 Mietdatum:</strong> ${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>📞 Kontakt:</strong> ${phone}</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>💳 Zahlungsart:</strong> Bezahlung vor Ort</p>
                </div>
                
                <button onclick="closeBookingModal()" class="btn btn-primary" style="width: 100%;">Modal schließen</button>
            </div>
        `;
        
        console.log('Success message displayed');
        
    } catch (error) {
        console.error('ERROR in booking submission:', error);
        console.error('Error stack:', error.stack);
        alert('❌ Fehler beim Abschließen der Buchung: ' + error.message);
    }
};
// Toggle additional driver form
function toggleAdditionalDriver() {
    const checkbox = document.getElementById('additional-driver-checkbox');
    const form = document.getElementById('additional-driver-form');
    if (checkbox && form) {
        form.style.display = checkbox.checked ? 'block' : 'none';
        
        if (checkbox.checked) {
            // Setup real-time validation for additional driver
            setupDriver2Validation();
        }
    }
    calculateCost();
}

// Real-time validation for additional driver
function setupDriver2Validation() {
    const driver2BirthDateInput = document.getElementById('driver2-birth-date');
    const driver2LicenseValidSinceInput = document.getElementById('driver2-license-valid-since');
    
    if (driver2BirthDateInput) {
        driver2BirthDateInput.addEventListener('change', () => {
            validateDriver2Age();
        });
    }
    
    if (driver2LicenseValidSinceInput) {
        driver2LicenseValidSinceInput.addEventListener('change', () => {
            validateDriver2LicenseAge();
        });
    }
}

function validateDriver2Age() {
    const driver2BirthDateInput = document.getElementById('driver2-birth-date');
    const driver2AgeError = document.getElementById('driver2-age-error');
    
    if (!driver2BirthDateInput.value) {
        if (driver2AgeError) driver2AgeError.style.display = 'none';
        return;
    }
    
    const driver2Birth = new Date(driver2BirthDateInput.value);
    const today = new Date();
    let driver2Age = today.getFullYear() - driver2Birth.getFullYear();
    const driver2MonthDiff = today.getMonth() - driver2Birth.getMonth();
    if (driver2MonthDiff < 0 || (driver2MonthDiff === 0 && today.getDate() < driver2Birth.getDate())) {
        driver2Age--;
    }
    
    if (driver2Age < 21 || driver2Age > 75) {
        if (driver2AgeError) {
            driver2AgeError.style.display = 'block';
            driver2AgeError.textContent = '⚠️ Fahrer muss zwischen 21 und 75 Jahre alt sein.';
        }
    } else {
        if (driver2AgeError) driver2AgeError.style.display = 'none';
    }
}

function validateDriver2LicenseAge() {
    const driver2LicenseValidSinceInput = document.getElementById('driver2-license-valid-since');
    const driver2LicenseError = document.getElementById('driver2-license-error');
    
    if (!driver2LicenseValidSinceInput.value) {
        if (driver2LicenseError) driver2LicenseError.style.display = 'none';
        return;
    }
    
    const driver2LicenseDate = new Date(driver2LicenseValidSinceInput.value);
    const today = new Date();
    const driver2LicenseAge = today.getFullYear() - driver2LicenseDate.getFullYear();
    const driver2LicenseMonthDiff = today.getMonth() - driver2LicenseDate.getMonth();
    let driver2LicenseDaysValid = driver2LicenseAge;
    if (driver2LicenseMonthDiff < 0 || (driver2LicenseMonthDiff === 0 && today.getDate() < driver2LicenseDate.getDate())) {
        driver2LicenseDaysValid--;
    }
    
    if (driver2LicenseDaysValid < 1) {
        if (!driver2LicenseError) {
            // Create error element if it doesn't exist
            const licenseInput = document.getElementById('driver2-license-valid-since');
            const errorDiv = document.createElement('div');
            errorDiv.id = 'driver2-license-error';
            errorDiv.style.cssText = 'color: #ef4444; font-size: 0.9rem; display: block; margin-top: 0.25rem;';
            errorDiv.textContent = '⚠️ Führerschein muss mindestens 1 Jahr vorhanden sein.';
            licenseInput.parentNode.appendChild(errorDiv);
        } else {
            driver2LicenseError.style.display = 'block';
        }
    } else {
        if (driver2LicenseError) driver2LicenseError.style.display = 'none';
    }
}