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
    setupBookingModal(vehicle);
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

        ${vehicle.interiorImages && vehicle.interiorImages.length > 0 ? `
        <div style="margin: 4rem 0;">
            <h2 style="margin-bottom: 2rem;">📸 Innenausstattung</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                ${vehicle.interiorImages.map(img => `<img src="${img}" alt="Innenansicht" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`).join('')}
            </div>
        </div>
        ` : ''}`

        <div class="details-grid">
            <div class="detail-card">
                <h3>📋 Basisdaten</h3>
                <div class="detail-grid" style="grid-template-columns: 1fr;">
                    <div class="detail-item">🛏️ ${vehicle.beds} Betten</div>
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
        </div>
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
        document.getElementById('modal-vehicle-name').textContent = `Buchen: ${vehicle.name}`;
        document.getElementById('modal-vehicle-image').src = vehicle.image;
        document.getElementById('daily-rate').textContent = vehicle.pricePerDay;
        bookingModal.style.display = 'block';
    };

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
