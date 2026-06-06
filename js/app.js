window.RestaurantSettings = {
    restaurantName: "Club des Pins",
    whatsappNumber: "",
    phoneNumber: "",
    openingHours: "11:00 - 23:00"
};

window.GoogleSheetsData = null;
window.PromoData = [];
window.PacksData = [];
window.InventoryData = {};
window.lastSyncSource = 'local';
window.syncInProgress = false;

const GS_CACHE_KEY = 'gsheets_cache';
const GS_CACHE_TIME = 5 * 60 * 1000;

function extractSheetId(input) {
    if (!input) return '';
    const trimmed = input.trim();
    const m = trimmed.match(/\/d\/(e\/[^/]+|[^/]+?)(?:\/|$)/);
    if (m) return m[1];
    return trimmed;
}

function parseCSVLine(line) {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const vals = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h.trim()] = (vals[i] || '').trim(); });
        return obj;
    }).filter(o => Object.values(o).some(v => v));
}

async function fetchPublishedSheetCSV(publishedId, sheetGid) {
    const url = `https://docs.google.com/spreadsheets/d/e/${publishedId}/pubhtml?output=csv&gid=${sheetGid}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
}

async function getPublishedSheetGids(publishedId) {
    const url = `https://docs.google.com/spreadsheets/d/e/${publishedId}/pubhtml`;
    const res = await fetch(url);
    const html = await res.text();
    const gids = {};
    const regex = /<li[^>]+data-id=['"](\d+)['"][^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
        const name = m[2].replace(/<[^>]*>/g, '').trim();
        if (name) gids[name] = m[1];
    }
    if (Object.keys(gids).length === 0) {
        const fallback = html.match(/['"]sheet_name['"]\s*:\s*['"]([^'"]+)['"]/i);
        if (fallback) gids[fallback[1]] = '0';
    }
    return gids;
}

async function fetchPublishedSheet(publishedId, sheetName, gids) {
    const gid = (gids && gids[sheetName]) || '0';
    try {
        const csv = await fetchPublishedSheetCSV(publishedId, gid);
        return parseCSV(csv);
    } catch (e) {
        console.warn(`Sheet "${sheetName}" not found, trying gid=0:`, e);
        if (gid !== '0') {
            try {
                const csv = await fetchPublishedSheetCSV(publishedId, '0');
                return parseCSV(csv);
            } catch (e2) { return []; }
        }
        return [];
    }
}

async function fetchSheetGviz(sheetId, sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    const text = await res.text();
    const jsonStr = text.replace(/\/\*O_o\*\//, '').replace(/google\.visualization\.Query\.setResponse\(/, '').replace(/\);$/, '');
    const parsed = JSON.parse(jsonStr);
    const cols = parsed.table.cols.map(c => c.label || c.id);
    return parsed.table.rows.map(row => {
        const obj = {};
        row.c.forEach((cell, i) => {
            if (cell) {
                let val = cell.v;
                if (cell.f) val = cell.f;
                obj[cols[i]] = val;
            } else {
                obj[cols[i]] = '';
            }
        });
        return obj;
    });
}

async function fetchAllSheetsGviz(sheetId, sheets) {
    const results = {};
    const fetches = sheets.map(async name => {
        try {
            results[name] = await fetchSheetGviz(sheetId, name);
        } catch (e) {
            console.warn(`gviz fetch failed for "${name}":`, e);
            results[name] = [];
        }
    });
    await Promise.all(fetches);
    return results;
}

async function fetchAllSheetsCSV(publishedId, sheets) {
    const results = {};
    sheets.forEach(name => results[name] = []);
    try {
        const gids = await getPublishedSheetGids(publishedId);
        const fetches = sheets.map(async name => {
            try {
                const gid = (gids && gids[name]) || '0';
                const csv = await fetchPublishedSheetCSV(publishedId, gid);
                results[name] = parseCSV(csv);
            } catch (e) {
                console.warn(`csv fetch failed for "${name}":`, e);
            }
        });
        await Promise.all(fetches);
    } catch (e) {
        console.warn('Failed to get sheet GIDs:', e);
    }
    return results;
}

async function loadAllFromGoogleSheets(sheetId) {
    if (!sheetId) return null;
    const rawId = extractSheetId(sheetId);
    const cleanId = rawId.replace(/^e\//, '');
    const isPublished = /^(e\/|2PACX-)/.test(rawId);
    const sheetNames = ['settings', 'categories', 'menu', 'packs', 'promos', 'translations'];

    let allData;
    if (isPublished) {
        console.warn('⚠️ ID publié détecté (2PACX-...). Le plus fiable est d\'utiliser l\'ID réel du spreadsheet.');
        console.warn('   Prends l\'ID depuis la barre d\'URL quand tu édites le fichier dans Google Sheets.');
        console.warn('   Ex: https://docs.google.com/spreadsheets/d/{REAL_ID}/edit');
        console.warn('   Tentative avec l\'API gviz...');
        allData = await fetchAllSheetsGviz(cleanId, sheetNames);
    } else {
        allData = await fetchAllSheetsGviz(cleanId, sheetNames);
    }
    const [settingsRows, categoriesRows, menuRows, packsRows, promosRows, translationsRows] = sheetNames.map(n => allData[n] || []);

    const settings = {};
    settingsRows.forEach(row => { if (row.key && row.value) settings[row.key] = row.value; });

    const categories = categoriesRows.map(row => ({
        id: parseInt(row.id) || 0,
        name: { fr: row.name_fr || '', ar: row.name_ar || '', en: row.name_en || '' }
    })).filter(c => c.id > 0);

    const catNameToId = {};
    categories.forEach(cat => {
        Object.values(cat.name).forEach(n => { if (n) catNameToId[n] = cat.id; });
    });

    const products = menuRows.map(row => ({
        id: parseInt(row.id) || 0,
        name: { fr: row.name_fr || '', ar: row.name_ar || '', en: row.name_en || '' },
        description: { fr: row.description_fr || '', ar: row.description_ar || '', en: row.description_en || '' },
        price: parseInt(row.price) || 0,
        promo_price: row.promo_price ? parseInt(row.promo_price) : null,
        is_promo: row.is_promo === 'TRUE' || row.is_promo === 'true' || row.is_promo === true,
        category: row.category || '',
        categoryId: catNameToId[row.category] || null,
        image: row.image || '',
        available: row.available === 'TRUE' || row.available === 'true' || row.available === true || row.available === '',
        stock: row.stock ? parseInt(row.stock) : null,
        ingredients: { fr: row.ingredients_fr || '', ar: row.ingredients_ar || '', en: row.ingredients_en || '' }
    })).filter(p => p.id > 0);

    const packs = packsRows.map(row => ({
        id: parseInt(row.id) || 0,
        name: { fr: row.name_fr || '', ar: row.name_ar || '', en: row.name_en || '' },
        description: { fr: row.description_fr || '', ar: row.description_ar || '', en: row.description_en || '' },
        price: parseInt(row.price) || 0,
        image: row.image || '',
        items: row.items || '',
        available: row.available === 'TRUE' || row.available === 'true' || row.available === true || row.available === ''
    })).filter(p => p.id > 0);

    const promos = promosRows.map(row => ({
        id: parseInt(row.id) || 0,
        title: { fr: row.title_fr || '', ar: row.title_ar || '', en: row.title_en || '' },
        description: { fr: row.description_fr || '', ar: row.description_ar || '', en: row.description_en || '' },
        image: row.image || '',
        type: row.type || 'percentage',
        value: row.value || '0',
        active: row.active === 'TRUE' || row.active === 'true' || row.active === true
    })).filter(p => p.id > 0 && p.active);

    const translations = {};
    translationsRows.forEach(row => {
        if (row.key) {
            translations[row.key] = { fr: row.fr || '', ar: row.ar || '', en: row.en || '' };
        }
    });

    const inventory = {};
    products.forEach(p => {
        if (p.stock !== null) inventory[p.id] = p.stock;
    });

    return {
        settings,
        categories,
        products,
        packs,
        promos,
        translations,
        inventory
    };
}

function cacheSheetData(data) {
    const cache = { data, timestamp: Date.now() };
    try { localStorage.setItem(GS_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}

function getCachedSheetData() {
    try {
        const raw = localStorage.getItem(GS_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (Date.now() - cache.timestamp > GS_CACHE_TIME) return null;
        return cache.data;
    } catch (e) { return null; }
}

function buildMenuJSONFromSheets(sheetData) {
    const translations = {};
    if (sheetData.translations) {
        ['fr', 'ar', 'en'].forEach(lang => {
            translations[lang] = {};
            Object.keys(sheetData.translations).forEach(key => {
                translations[lang][key] = sheetData.translations[key][lang] || '';
            });
        });
    }
    return {
        restaurant: {
            fr: (sheetData.settings && sheetData.settings.restaurantName) || 'Club des Pins',
            ar: (sheetData.settings && sheetData.settings.restaurantName) || 'نادي الصنوبر',
            en: (sheetData.settings && sheetData.settings.restaurantName) || 'Pine Club'
        },
        currency: 'DA',
        categories: sheetData.categories || [],
        products: sheetData.products || [],
        packs: sheetData.packs || [],
        translations: translations
    };
}

document.addEventListener('DOMContentLoaded', function () {
    window.orderModalInstance = null;
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');
    const tableBadge = document.getElementById('tableNumber');
    const tableNum = document.getElementById('tableNum');
    if (tableNumber) {
        tableBadge.style.display = 'flex';
        tableNum.textContent = tableNumber;
    }

    const langOptions = document.querySelectorAll('.lang-option');
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    setLanguage(currentLanguage);
    langOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            setLanguage(this.getAttribute('data-lang'));
        });
    });

    if (urlParams.get('showqr') === '1') showQRButtonInHeader();

    initCallWaiterFAB();
    initFloatingQuickActions();
    updateCartBadgeCount();
    renderPromoBanners();

    fetch('data/settings.json')
        .then(res => res.json())
        .then(settings => {
            window.RestaurantSettings = settings;
            applyGlobalSettings(settings);
            if (settings.googleSheetsEnabled && settings.googleSheetsId) {
                loadGoogleSheetsData(settings.googleSheetsId);
            }
            initSyncButton();
            updateSyncStatus(false);
        })
        .catch(err => {
            console.warn('settings.json fetch failed, using defaults:', err);
            initSyncButton();
            updateSyncStatus(false);
        });

    function loadGoogleSheetsData(sheetId) {
        if (!sheetId) return;
        const cached = getCachedSheetData();
        if (cached) {
            applySheetData(cached);
        }
        loadAllFromGoogleSheets(sheetId).then(data => {
            if (data) {
                cacheSheetData(data);
                applySheetData(data);
                window.lastSyncSource = 'google';
                updateSyncStatus(true);
                renderPromoBanners();
            }
        }).catch(() => {});
    }

    function applySheetData(data) {
        window.GoogleSheetsData = data;
        if (data.settings) {
            Object.assign(window.RestaurantSettings, data.settings);
            applyGlobalSettings(data.settings);
        }
        window.PromoData = data.promos || [];
        window.PacksData = data.packs || [];
        window.InventoryData = data.inventory || {};
        const menuData = buildMenuJSONFromSheets(data);
        const event = new CustomEvent('menuDataLoaded', { detail: { menuData, fromSheets: true } });
        document.dispatchEvent(event);
    }

    function applyGlobalSettings(cfg) {
        const nameEl = document.getElementById('navRestaurantName');
        const footerEl = document.getElementById('footerRestaurantName');
        const hoursEl = document.getElementById('settingHours');
        if (nameEl) nameEl.textContent = cfg.restaurantName || cfg.restaurant_name || 'Restaurant';
        if (footerEl) footerEl.textContent = cfg.restaurantName || cfg.restaurant_name || 'Restaurant';
        if (hoursEl) hoursEl.textContent = cfg.openingHours || cfg.opening_hours || '';
    }

    function setLanguage(lang) {
        localStorage.setItem('selectedLanguage', lang);
        const langMap = { fr: 'FR', ar: 'AR', en: 'EN' };
        const currentEl = document.getElementById('currentLang');
        if (currentEl) currentEl.textContent = langMap[lang] || 'FR';
        if (lang === 'ar') {
            document.body.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.body.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl');
        }
        updateTranslations(lang);
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function updateTranslations(lang) {
        const data = window.GoogleSheetsData;
        if (data && data.translations && data.translations[lang]) {
            const t = data.translations[lang];
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
            return;
        }
        fetch('data/menu.json').then(r => r.json()).then(data => {
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
        }).catch(() => {});
    }
});

function initCallWaiterFAB() {
    const existing = document.getElementById('callWaiterFab');
    if (existing) existing.remove();

    const fab = document.createElement('button');
    fab.id = 'callWaiterFab';
    fab.className = 'call-waiter-fab';
    fab.setAttribute('aria-label', 'Call Waiter');
    fab.innerHTML = '<i class="fas fa-bell"></i><span class="cw-label">Serveur</span><span class="cw-pulse"></span>';

    fab.addEventListener('click', function () {
        const tableStr = getTableNumber() ? `N°${getTableNumber()}` : 'Non spécifiée';
        const num = window.RestaurantSettings.whatsappNumber || '213555725285';
        const msg = `Bonjour,\n\nLa table ${tableStr} demande l'assistance d'un serveur.\n\nMerci.`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    });

    document.body.appendChild(fab);
}

function getTableNumber() {
    const p = new URLSearchParams(window.location.search);
    return p.get('table') || null;
}

function updateSyncStatus(success) {
    const indicator = document.getElementById('syncStatus');
    if (!indicator) return;
    if (success) {
        indicator.innerHTML = '<i class="fas fa-check-circle text-success"></i> Google Sheets';
        indicator.className = 'sync-status sync-ok';
    } else {
        indicator.innerHTML = '<i class="fas fa-exclamation-triangle text-warning"></i> Local';
        indicator.className = 'sync-status sync-warn';
    }
}

function initSyncButton() {
    const btn = document.getElementById('syncDataBtn');
    const indicator = document.getElementById('syncStatus');
    if (!btn) return;

    if (window.RestaurantSettings.googleSheetsEnabled && window.RestaurantSettings.googleSheetsId) {
        btn.style.display = 'inline-flex';
    } else {
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-database text-muted"></i> Local';
            indicator.className = 'sync-status';
        }
        return;
    }

    btn.addEventListener('click', async function () {
        if (window.syncInProgress) return;
        window.syncInProgress = true;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const sheetId = window.RestaurantSettings.googleSheetsId;
        const data = await loadAllFromGoogleSheets(sheetId);
        if (data) {
            cacheSheetData(data);
            window.GoogleSheetsData = data;
            if (data.settings) Object.assign(window.RestaurantSettings, data.settings);
            window.PromoData = data.promos || [];
            window.PacksData = data.packs || [];
            window.InventoryData = data.inventory || {};
            window.lastSyncSource = 'google';
            const menuData = buildMenuJSONFromSheets(data);
            document.dispatchEvent(new CustomEvent('menuDataLoaded', { detail: { menuData, fromSheets: true } }));
            updateSyncStatus(true);
            renderPromoBanners();
            showSyncToast(true);
        } else {
            showSyncToast(false);
        }

        window.syncInProgress = false;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync"></i>';
    });
}

function showSyncToast(success) {
    let container = document.getElementById('toastWrapper');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastWrapper';
        container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
        container.style.zIndex = '1090';
        document.body.appendChild(container);
    }
    const msg = success ? 'Données synchronisées avec Google Sheets ✓' : 'Échec de synchronisation';
    const icon = success ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
    container.innerHTML = `
        <div class="toast align-items-center text-bg-dark border-0 shadow" role="alert" data-bs-delay="2500">
            <div class="d-flex">
                <div class="toast-body fw-medium"><i class="fas ${icon} me-2"></i> ${msg}</div>
            </div>
        </div>`;
    const bToast = new bootstrap.Toast(container.querySelector('.toast'));
    bToast.show();
}

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

    document.getElementById('fabCartBtn').addEventListener('click', showOrdersModal);
    document.getElementById('fabWaiterBtn').addEventListener('click', () => {
        const tableStr = getTableNumber() ? `N°${getTableNumber()}` : 'Non spécifiée';
        const num = window.RestaurantSettings.whatsappNumber || '213555725285';
        const msg = `Bonjour,\n\nLa table ${tableStr} demande l'assistance d'un serveur.\n\nMerci.`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    });
    document.getElementById('fabContactBtn').addEventListener('click', () => {
        window.location.href = `tel:${window.RestaurantSettings.phoneNumber}`;
    });
    document.getElementById('fabWhatsappBtn').addEventListener('click', () => {
        window.open(`https://wa.me/${window.RestaurantSettings.whatsappNumber}`, '_blank');
    });
}

function renderPromoBanners() {
    const container = document.getElementById('promoBannerContainer');
    if (!container) return;
    const promos = window.PromoData || [];
    const lang = localStorage.getItem('selectedLanguage') || 'fr';
    const active = promos.filter(p => p.active !== false);

    if (active.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    let html = '<div class="promo-carousel">';
    active.forEach((p, i) => {
        const title = p.title[lang] || p.title.fr || '';
        const desc = p.description[lang] || p.description.fr || '';
        const img = p.image || '';
        const badge = p.type === 'percentage' ? `-${p.value}%` : (p.type === 'fixed' ? `-${p.value} DA` : '');
        html += `
            <div class="promo-slide ${i === 0 ? 'active' : ''}">
                ${img ? `<div class="promo-bg" style="background-image:url('${img}')"></div>` : ''}
                <div class="promo-content">
                    <span class="promo-badge">${badge}</span>
                    <h4 class="promo-title">${title}</h4>
                    <p class="promo-desc">${desc}</p>
                </div>
            </div>`;
    });
    html += '</div>';
    html += '<div class="promo-dots"></div>';
    container.innerHTML = html;

    const slides = container.querySelectorAll('.promo-slide');
    const dotsContainer = container.querySelector('.promo-dots');
    if (slides.length > 1) {
        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `promo-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => showPromoSlide(i, slides, dotsContainer));
            dotsContainer.appendChild(dot);
        });
        let current = 0;
        setInterval(() => {
            current = (current + 1) % slides.length;
            showPromoSlide(current, slides, dotsContainer);
        }, 4000);
    }
}

function showPromoSlide(idx, slides, dotsContainer) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.promo-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
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
                <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded-3 border-0 order-item">
                    <div>
                        <span class="fw-bold text-dark">${o.name}</span>
                        <span class="text-muted ms-1 small">× ${o.quantity}</span>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="fw-semibold text-primary">${lineTotal} DA</span>
                        <button class="btn btn-sm btn-outline-danger remove-item-btn" data-idx="${idx}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        totalPriceSpan.textContent = `${cumulativeTotal} DA`;

        orderListDiv.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const idx = parseInt(this.dataset.idx);
                const currentOrders = JSON.parse(localStorage.getItem('menuOrders') || '[]');
                currentOrders.splice(idx, 1);
                localStorage.setItem('menuOrders', JSON.stringify(currentOrders));
                updateCartBadgeCount();
                showOrdersModal();
            });
        });
    }

    if (!window.orderModalInstance) {
        window.orderModalInstance = new bootstrap.Modal(modal);
    }
    window.orderModalInstance.show();
}

document.addEventListener('DOMContentLoaded', function () {
    const clearBtn = document.getElementById('clearOrdersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            localStorage.removeItem('menuOrders');
            updateCartBadgeCount();
            showOrdersModal();
        });
    }
});
