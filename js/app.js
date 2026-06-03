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
});