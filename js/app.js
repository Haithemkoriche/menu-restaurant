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

    // Show QR button in header only if ?showqr=1 is present
    const urlParamsHeader = new URLSearchParams(window.location.search);
    if (urlParamsHeader.get('showqr') === '1') {
        showQRButtonInHeader();
    }

    // QR Code Generator (always available via modal, but button only shows with ?showqr=1)

    function showQRButtonInHeader() {
        const container = document.getElementById('qRButtonContainer');
        if (!container) return;

        const qrBtn = document.createElement('button');
        qrBtn.className = 'qr-btn';
        qrBtn.id = 'qrBtn';
        qrBtn.innerHTML = '<i class="fas fa-qrcode"></i> Generate QR Code';
        qrBtn.title = 'Generate QR Code';
        qrBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showQRCodeModal();
        });

        container.appendChild(qrBtn);
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
                            <h5 class="modal-title" id="qrModalLabel">QR Code Generator</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <button class="btn btn-outline-primary me-2" id="singleQrBtn">Single Table QR Code</button>
                                <button class="btn btn-outline-primary" id="multipleQrBtn">All Tables QR Codes</button>
                            </div>
                            <div id="qrContent">
                                <!-- QR code content will be inserted here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="printQrBtn">Print QR Codes</button>
                        </div>
                    </>
                </div>
            `;
            document.body.appendChild(modal);

            // Add event listeners for the buttons
            modal.querySelector('#singleQrBtn').addEventListener('click', function() {
                showSingleQrCode();
            });

            modal.querySelector('#multipleQrBtn').addEventListener('click', function() {
                showMultipleQrCodes();
            });

            modal.querySelector('#printQrBtn').addEventListener('click', function() {
                window.print();
            });
        }

        // Default to single QR code view
        showSingleQrCode();

        // Show modal
        const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
        qrModal.show();
    }

    function showSingleQrCode() {
        const qrContent = document.getElementById('qrContent');
        if (!qrContent) return;

        // Clear previous content
        qrContent.innerHTML = '';

        // Set the URL to encode (current page URL)
        const currentUrl = window.location.href;

        // Create QR code image using QR Server API
        const qrImg = document.createElement('img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;
        qrImg.alt = 'QR Code for current page';
        qrImg.style.display = 'block';
        qrImg.style.margin = '0 auto';

        const qrInfo = document.createElement('p');
        qrInfo.className = 'text-center mt-3';
        qrInfo.textContent = currentUrl;

        qrContent.appendChild(qrImg);
        qrContent.appendChild(qrInfo);
    }

    function showMultipleQrCodes() {
        const qrContent = document.getElementById('qrContent');
        if (!qrContent) return;

        // Clear previous content
        qrContent.innerHTML = '';

        // Base URL (without table parameter)
        const baseUrl = window.location.href.split('?')[0];
        const currentTable = new URLSearchParams(window.location.search).get('table') || '1';

        // Generate QR codes for tables 1-20
        const tableCount = 20;
        const qrGrid = document.createElement('div');
        qrGrid.className = 'qr-grid';
        qrGrid.style.display = 'grid';
        qrGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        qrGrid.style.gap = '15px';
        qrGrid.style.marginBottom = '20px';

        for (let i = 1; i <= tableCount; i++) {
            const tableUrl = `${baseUrl}?table=${i}`;

            const qrItem = document.createElement('div');
            qrItem.style.textAlign = 'center';

            const qrImg = document.createElement('img');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(tableUrl)}`;
            qrImg.alt = `QR Code for table ${i}`;
            qrImg.style.width = '100px';
            qrImg.style.height = '100px';
            qrImg.style.border = '1px solid #ddd';
            qrImg.style.borderRadius = '4px';

            const tableLabel = document.createElement('div');
            tableLabel.className = 'mt-2';
            tableLabel.style.fontSize = '14px';
            tableLabel.style.fontWeight = 'bold';
            tableLabel.textContent = `Table ${i}`;

            qrItem.appendChild(qrImg);
            qrItem.appendChild(tableLabel);
            qrGrid.appendChild(qrItem);
        }

        const instructions = document.createElement('p');
        instructions.className = 'text-center mb-3';
        instructions.innerHTML = `<strong>Tip:</strong> Select landscape orientation for better fit when printing.`;

        qrContent.appendChild(instructions);
        qrContent.appendChild(qrGrid);
    }
});