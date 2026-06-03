// Language and table number handling
document.addEventListener('DOMContentLoaded', function() {
    // Get table number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');
    const tableBadge = document.getElementById('tableNumber');
    const tableNum = document.getElementById('tableNum');

    if (tableNumber) {
        tableBadge.style.display = 'flex';
        tableNum.textContent = tableNumber;
    }

    // Language handling
    const langBtn = document.getElementById('langBtn');
    const currentLang = document.getElementById('currentLang');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = langDropdown.querySelectorAll('.lang-option');

    // Load language from localStorage or default to French
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    setLanguage(currentLanguage);

    // Language switcher
    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // QR Code Generator
    const qrBtn = document.getElementById('qrBtn');
    if (qrBtn) {
        qrBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showQRCodeModal();
        });
    }

    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('selectedLanguage', lang);

        // Update button text
        const langMap = {
            'fr': 'FR',
            'ar': 'AR',
            'en': 'EN'
        };
        currentLang.textContent = langMap[lang];

        // Set direction for Arabic
        if (lang === 'ar') {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.body.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl');
        }

        // Update all translatable elements
        updateTranslations();

        // Trigger menu refresh to update menu items in new language
        document.dispatchEvent(new Event('languageChange'));
    }

    function updateTranslations() {
        // Fetch translations from menu.json
        fetch('data/menu.json')
            .then(response => response.json())
            .then(data => {
                const translations = data.translations[currentLanguage];
                if (translations) {
                    // Update all elements with data-i18n attribute
                    document.querySelectorAll('[data-i18n]').forEach(element => {
                        const key = element.getAttribute('data-i18n');
                        if (translations[key]) {
                            element.textContent = translations[key];
                        }
                    });

                    // Update placeholders
                    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                        const key = element.getAttribute('data-i18n-placeholder');
                        if (translations[key]) {
                            element.placeholder = translations[key];
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading translations:', error);
            });
    }

    function showQRCodeModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('qrModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'qrModal';
            modal.tabIndex = -1;
            modal.setAttribute('aria-hidden', 'true');

            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="qrModalLabel">QR Code</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div id="qrCodeContainer">
                                <!-- QR code image will be inserted here -->
                            </div>
                            <p class="mt-3" id="qrUrl"></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Set the URL to encode (current page URL)
        const currentUrl = window.location.href;
        const qrUrlElement = document.getElementById('qrUrl');
        if (qrUrlElement) {
            qrUrlElement.textContent = currentUrl;
        }

        // Set the QR code image
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        if (qrCodeContainer) {
            // Clear previous content
            qrCodeContainer.innerHTML = '';

            // Create QR code image using QR Server API
            const qrImg = document.createElement('img');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
            qrImg.alt = 'QR Code';
            qrImg.style.maxWidth = '100%';
            qrCodeContainer.appendChild(qrImg);
        }

        // Show modal
        const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
        qrModal.show();
    }
});