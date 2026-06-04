// Global Configuration Object
window.RestaurantSettings = {
    restaurantName: "Club des Pins",
    whatsappNumber: "",
    phoneNumber: "",
    openingHours: "11:00 - 23:00"
};

document.addEventListener('DOMContentLoaded', function() {
    window.orderModalInstance = null;
    
    // 1. Initialize configuration values from settings.json
    fetch('data/settings.json')
        .then(res => res.json())
        .then(settings => {
            window.RestaurantSettings = settings;
            applyGlobalSettings(settings);
        })
        .catch(err => console.error("Error fetching application settings:", err));

    // Get table context metadata
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');
    const tableBadge = document.getElementById('tableNumber');
    const tableNum = document.getElementById('tableNum');

    if (tableNumber) {
        tableBadge.style.display = 'flex';
        tableNum.textContent = tableNumber;
    }

    // Language processing engine
    const langOptions = document.querySelectorAll('.lang-option');
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    setLanguage(currentLanguage);

    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            setLanguage(this.getAttribute('data-lang'));
        });
    });

    if (urlParams.get('showqr') === '1') {
        showQRButtonInHeader();
    }

    // Initialize Floating Quick Actions UI
    initFloatingQuickActions();
    updateCartBadgeCount();

    function applyGlobalSettings(cfg) {
        document.getElementById('navRestaurantName').textContent = cfg.restaurantName;
        document.getElementById('footerRestaurantName').textContent = cfg.restaurantName;
        document.getElementById('settingHours').textContent = cfg.openingHours;
    }

    function setLanguage(lang) {
        localStorage.setItem('selectedLanguage', lang);
        const langMap = { 'fr': 'FR', 'ar': 'AR', 'en': 'EN' };
        document.getElementById('currentLang').textContent = langMap[lang];

        if (lang === 'ar') {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.body.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl');
        }

        // Broadcast locale updates safely
        updateTranslations(lang);
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function updateTranslations(lang) {
        fetch('data/menu.json')
            .then(res => res.json())
            .then(data => {
                const translations = data.translations[lang];
                if (!translations) return;
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (translations[key]) el.textContent = translations[key];
                });
                document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                    const key = el.getAttribute('data-i18n-placeholder');
                    if (translations[key]) el.placeholder = translations[key];
                });
            });
    }

    // Floating UI Management Hook
    function initFloatingQuickActions() {
        const mainBtn = document.getElementById('fabMainBtn');
        const optionsMenu = document.querySelector('.fab-options');
        const closeIcon = mainBtn.querySelector('.close-icon');
        const mainIcon = mainBtn.querySelector('.main-icon');

        mainBtn.addEventListener('click', () => {
            optionsMenu.classList.toggle('d-none');
            closeIcon.classList.toggle('d-none');
            mainIcon.classList.toggle('d-none');
        });

        document.getElementById('fabCartBtn').addEventListener('click', () => {
            showOrdersModal();
        });

        // "Call Waiter" logic
        document.getElementById('fabWaiterBtn').addEventListener('click', () => {
            const tableStr = tableNumber ? `N°${tableNumber}` : 'Non spécifiée';
            const textMsg = `Bonjour,\n\nLa table N°${tableStr} demande l'assistance d'un serveur.\n\nMerci.`;
            const waUrl = `https://wa.me/${window.RestaurantSettings.whatsappNumber}?text=${encodeURIComponent(textMsg)}`;
            window.open(waUrl, '_blank');
        });

        document.getElementById('fabContactBtn').addEventListener('click', () => {
            window.location.href = `tel:${window.RestaurantSettings.phoneNumber}`;
        });

        document.getElementById('fabWhatsappBtn').addEventListener('click', () => {
            window.open(`https://wa.me/${window.RestaurantSettings.whatsappNumber}`, '_blank');
        });
    }

    function showQRButtonInHeader() {
        const container = document.getElementById('qRButtonContainer');
        if (!container || document.getElementById('qrBtn')) return;
        const qrBtn = document.createElement('button');
        qrBtn.className = 'btn btn-sm btn-light border ms-2';
        qrBtn.id = 'qrBtn';
        qrBtn.innerHTML = '<i class="fas fa-qrcode"></i>';
        qrBtn.addEventListener('click', () => alert("Générateur QR activé (Simulé)"));
        container.appendChild(qrBtn);
    }
});

// Accessible Helper Context Updates
function updateCartBadgeCount() {
    const orders = JSON.parse(localStorage.getItem('menuOrders') || '[]');
    const totalCount = orders.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.textContent = totalCount;
}

function showOrdersModal() {
    const modal = document.getElementById('orderModal');
    const orderListDiv = document.getElementById('orderList');
    const orderEmpty = document.getElementById('orderEmpty');
    const totalContainer = document.getElementById('cartTotalContainer');
    const totalPriceSpan = document.getElementById('cartTotalPrice');
    const orders = JSON.parse(localStorage.getItem('menuOrders') || '[]');

    if (orders.length === 0) {
        orderListDiv.innerHTML = '';
        orderEmpty.style.display = 'block';
        totalContainer.classList.add('d-none');
    } else {
        orderEmpty.style.display = 'none';
        totalContainer.classList.remove('d-none');
        
        let cumulativeTotal = 0;
        orderListDiv.innerHTML = orders.map((o, idx) => {
            const lineTotal = o.price * o.quantity;
            cumulativeTotal += lineTotal;
            return `
                <div class="d-flex justify-content-between align-items-center bg-light p-2.5 rounded-3 border-0">
                    <div>
                        <span class="fw-bold text-dark">${o.name}</span>
                        <span class="text-muted ms-1 small">× ${o.quantity}</span>
                    </div>
                    <div class="fw-semibold text-primary">${lineTotal} DA</div>
                </div>
            `;
        }).join('');
        totalPriceSpan.textContent = `${cumulativeTotal} DA`;
    }
    
    if (!window.orderModalInstance) {
        window.orderModalInstance = new bootstrap.Modal(modal);
    }
    window.orderModalInstance.show();
}

// Global Order Reset
document.getElementById('clearOrdersBtn').addEventListener('click', () => {
    localStorage.removeItem('menuOrders');
    updateCartBadgeCount();
    showOrdersModal();
});