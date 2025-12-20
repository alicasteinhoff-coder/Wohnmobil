function initDetailsWithVehicles() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = parseInt(urlParams.get('id'));

    const vehicleList = window.vehicles || [];
    const vehicle = vehicleList.find(v => v.id === vehicleId);

    if (!vehicle) {
        document.getElementById('vehicle-details-content').innerHTML = '<div style="text-align: center; padding: 4rem;"><h2>Fahrzeug nicht gefunden</h2><a href="index.html" class="btn btn-primary">Zurück zur Übersicht</a></div>';
        return;
    }

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
                <h3>⛽ Kraftstoff</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">Typ: ${vehicle.fuel.type}</div>
                    <div class="detail-item">Verbrauch: ${vehicle.fuel.consumption}l/100km</div>
                    <div class="detail-item">Emission: ${vehicle.fuel.emissionClass}</div>
                </div>
            </div>

            ${vehicle.towing.hasHitch ? `
            <div class="detail-card">
                <h3>🔗 Anhängerkupplung</h3>
                <div class="detail-item">Max. Anhängelast: ${vehicle.towing.maxLoad}kg</div>
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
    
        const commonConfig = {
            locale: 'de',
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: disabledDates,
            onChange: function(selectedDates, dateStr, instance) {
                calculatePrice();
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
                calculatePrice();
            }
        });
    
        flatpickr("#end-date", {
            ...commonConfig
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

    startDateInput.addEventListener('change', calculatePrice);
    endDateInput.addEventListener('change', calculatePrice);

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Vielen Dank für Ihre Buchungsanfrage! Wir werden uns in Kürze bei Ihnen melden.');
        bookingModal.style.display = 'none';
    });
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
