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
                    ${vehicle.pricePerDay}€ <span>/ Tag</span>
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
const bookingForm = document.getElementById('booking-form');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

function setupBookingModal(vehicle) {
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
        document.getElementById('daily-rate').textContent = vehicle.pricePerDay;
        
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
            const totalPrice = diffDays * vehicle.pricePerDay;

            document.getElementById('rental-days').textContent = diffDays;
            document.getElementById('total-price').textContent = totalPrice;
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

    startDateInput.addEventListener('change', calculatePrice);
    endDateInput.addEventListener('change', calculatePrice);

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Check if terms are accepted
        const termsAccepted = document.getElementById('terms-accepted').checked;
        if (!termsAccepted) {
            alert('Bitte akzeptieren Sie die AGB.');
            return;
        }

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
        const totalPrice = document.getElementById('total-price').textContent;

        // Create booking object
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
            totalPrice: totalPrice,
            bookingDate: new Date().toLocaleDateString('de-DE')
        };

        // Save to localStorage
        let bookings = [];
        try {
            const saved = localStorage.getItem('bookings');
            bookings = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error reading bookings:', e);
        }
        bookings.push(booking);
        try {
            localStorage.setItem('bookings', JSON.stringify(bookings));
        } catch (e) {
            console.error('Error saving booking:', e);
        }

        // Show success message
        const bookingContent = document.querySelector('.modal-content');
        bookingContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: var(--primary-color); margin-bottom: 1rem;">Buchung erfolgreich!</h2>
                <p style="color: #666; margin-bottom: 1.5rem;">
                    Vielen Dank, <strong>${firstName} ${lastName}</strong>! Ihre Buchung wurde erfolgreich registriert.
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>💰 Zahlungsart:</strong> Bezahlung vor Ort</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>📍 Abholort:</strong> ${pickupLocation}</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>📅 Mietdatum:</strong> ${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}</p>
                    <p style="margin: 0.5rem 0; color: #166534; font-size: 0.9rem;"><strong>💵 Gesamtpreis:</strong> ${totalPrice}€</p>
                </div>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                    Eine Bestätigung wurde an <strong>${phone}</strong> gesendet.
                </p>
                <button onclick="closeBookingModal()" class="btn btn-primary" style="width: 100%;">Modal schließen</button>
            </div>
        `;
    });

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

    // Render next 3 months
    for (let i = 0; i < 3; i++) {
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

    if (hasErrors) {
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
}
