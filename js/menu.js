let activeLanguage = localStorage.getItem('selectedLanguage') || 'fr';
let cachedMenuData = null;

document.addEventListener('DOMContentLoaded', function () {
    const productsGrid = document.getElementById('productsGrid');
    const categoryTabs = document.getElementById('categoryTabs');
    const packsSection = document.getElementById('packsSection');
    const packsGrid = document.getElementById('packsGrid');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');

    let menuData = null;
    let activeCategory = 'all';
    let searchTerm = '';
    let maxPrice = 5000;

    document.addEventListener('languageChanged', (e) => {
        activeLanguage = e.detail.lang;
        if (menuData) {
            renderCategoryTabs();
            filterAndRenderProducts();
            renderPacks();
        }
    });

    document.addEventListener('menuDataLoaded', (e) => {
        menuData = e.detail.menuData;
        cachedMenuData = menuData;
        const categoryIdByName = {};
        if (menuData.categories) {
            menuData.categories.forEach(cat => {
                Object.values(cat.name).forEach(name => {
                    categoryIdByName[name] = cat.id;
                });
            });
        }
        if (menuData.products) {
            menuData.products.forEach(p => {
                p.categoryId = categoryIdByName[p.category] || null;
            });
        }
        renderCategoryTabs();
        filterAndRenderProducts();
        renderPacks();
    });

    function loadMenuData() {
        if (window.GoogleSheetsData) {
            const data = window.GoogleSheetsData;
            menuData = buildMenuJSONFromSheetData(data);
            cachedMenuData = menuData;
            const categoryIdByName = {};
            if (menuData.categories) {
                menuData.categories.forEach(cat => {
                    Object.values(cat.name).forEach(name => {
                        categoryIdByName[name] = cat.id;
                    });
                });
            }
            if (menuData.products) {
                menuData.products.forEach(p => {
                    p.categoryId = categoryIdByName[p.category] || null;
                });
            }
            renderCategoryTabs();
            filterAndRenderProducts();
            renderPacks();
            return;
        }

        fetch('data/menu.json')
            .then(res => res.json())
            .then(data => {
                menuData = data;
                cachedMenuData = data;
                const categoryIdByName = {};
                data.categories.forEach(cat => {
                    Object.values(cat.name).forEach(name => {
                        categoryIdByName[name] = cat.id;
                    });
                });
                data.products.forEach(p => {
                    p.categoryId = categoryIdByName[p.category] || null;
                });
                renderCategoryTabs();
                filterAndRenderProducts();
                renderPacks();
            })
            .catch(err => {
                console.error(err);
                productsGrid.innerHTML = '<p class="text-danger p-4 text-center">Erreur système.</p>';
            });
    }

    function buildMenuJSONFromSheetData(data) {
        const translations = {};
        ['fr', 'ar', 'en'].forEach(lang => {
            translations[lang] = {};
            if (data.translations) {
                Object.keys(data.translations).forEach(key => {
                    translations[lang][key] = (data.translations[key] && data.translations[key][lang]) || '';
                });
            }
        });
        return {
            restaurant: { fr: 'Restaurant', ar: 'مطعم', en: 'Restaurant' },
            currency: 'DA',
            categories: data.categories || [],
            products: data.products || [],
            packs: data.packs || [],
            translations: translations
        };
    }

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.trim();
        filterAndRenderProducts();
    });

    priceFilter.addEventListener('input', () => {
        maxPrice = parseInt(priceFilter.value) || 5000;
        priceDisplay.textContent = `0 - ${maxPrice} DA`;
        filterAndRenderProducts();
    });

    function renderCategoryTabs() {
        if (!menuData) return;
        categoryTabs.innerHTML = '';
        const allTab = document.createElement('button');
        allTab.className = `category-tab ${activeCategory === 'all' ? 'active' : ''}`;
        allTab.textContent = activeLanguage === 'ar' ? 'الكل' : (activeLanguage === 'en' ? 'All' : 'Tous');
        allTab.addEventListener('click', () => selectCategory('all'));
        categoryTabs.appendChild(allTab);

        (menuData.categories || []).forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${activeCategory === String(cat.id) ? 'active' : ''}`;
            tab.textContent = cat.name[activeLanguage] || cat.name['fr'];
            tab.addEventListener('click', () => selectCategory(String(cat.id)));
            categoryTabs.appendChild(tab);
        });
    }

    function selectCategory(id) {
        activeCategory = id;
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        renderCategoryTabs();
        filterAndRenderProducts();
    }

    function filterAndRenderProducts() {
        if (!menuData) return;
        const products = menuData.products || [];
        const data = window.GoogleSheetsData;
        const inventory = data && data.inventory ? data.inventory : window.InventoryData || {};

        const filtered = products.filter(p => {
            const effectivePrice = (p.is_promo && p.promo_price) ? p.promo_price : p.price;
            if (effectivePrice > maxPrice) return false;
            if (activeCategory !== 'all' && String(p.categoryId) !== activeCategory) return false;
            if (searchTerm) {
                const name = (p.name[activeLanguage] || p.name['fr']).toLowerCase();
                const desc = (p.description[activeLanguage] || p.description['fr']).toLowerCase();
                return name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
            }
            return true;
        });

        renderGridCards(filtered, inventory);
    }

    function renderGridCards(products, inventory) {
        productsGrid.innerHTML = '';
        if (products.length === 0) {
            productsGrid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        productsGrid.style.display = 'grid';
        noResults.style.display = 'none';

        products.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.animationDelay = `${index * 0.04}s`;

            const name = p.name[activeLanguage] || p.name['fr'];
            const desc = p.description[activeLanguage] || p.description['fr'];
            const effectivePrice = (p.is_promo && p.promo_price) ? p.promo_price : p.price;
            const hasPromo = p.is_promo && p.promo_price && p.promo_price < p.price;
            const stock = (inventory && inventory[p.id] !== undefined) ? inventory[p.id] : null;
            const isOutOfStock = stock !== null && stock <= 0;
            const isLowStock = stock !== null && stock > 0 && stock <= 5;

            let priceHtml = `<span class="product-price fw-bold text-primary">${effectivePrice} DA</span>`;
            if (hasPromo) {
                priceHtml = `
                    <span class="product-price fw-bold text-danger">${effectivePrice} DA</span>
                    <span class="product-price-old text-muted"><del>${p.price} DA</del></span>`;
            }

            let badgesHtml = '';
            if (hasPromo) {
                const discount = Math.round((1 - p.promo_price / p.price) * 100);
                badgesHtml += `<span class="promo-ribbon">-${discount}%</span>`;
            }
            if (isOutOfStock) {
                badgesHtml += `<span class="stock-badge out-of-stock">Épuisé</span>`;
            } else if (isLowStock) {
                badgesHtml += `<span class="stock-badge low-stock">Plus que ${stock}</span>`;
            }

            card.innerHTML = `
                <div class="product-image">
                    <img src="${p.image}" alt="${name}" loading="lazy">
                    ${badgesHtml}
                </div>
                <div class="product-content p-3">
                    <div class="product-name fw-bold mb-1 fs-5">${name}</div>
                    <div class="product-description text-muted small text-truncate mb-3">${desc}</div>
                    <div class="product-footer d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            ${priceHtml}
                        </div>
                        <span class="availability-badge ${(!isOutOfStock && p.available !== false) ? 'available' : 'unavailable'}">
                            <i class="fas ${(!isOutOfStock && p.available !== false) ? 'fa-circle' : 'fa-times-circle'}" style="font-size:9px;"></i>
                            ${(!isOutOfStock && p.available !== false) ? 'Dispo' : 'Complet'}
                        </span>
                    </div>
                </div>
            `;

            if (!isOutOfStock && p.available !== false) {
                card.addEventListener('click', () => openDynamicProductModal(p, inventory));
            } else {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }

            productsGrid.appendChild(card);
        });
    }

    window.renderPacks = function () {
        if (!packsSection || !packsGrid) return;
        const data = window.GoogleSheetsData;
        const packs = (menuData && menuData.packs) || (data && data.packs) || window.PacksData || [];

        if (!packs || packs.length === 0) {
            packsSection.style.display = 'none';
            return;
        }
        packsSection.style.display = 'block';
        packsGrid.innerHTML = '';

        packs.filter(p => p.available !== false).forEach((pack, index) => {
            const name = pack.name[activeLanguage] || pack.name['fr'] || '';
            const desc = pack.description[activeLanguage] || pack.description['fr'] || '';
            const card = document.createElement('div');
            card.className = 'pack-card';
            card.style.animationDelay = `${index * 0.06}s`;

            const itemsList = pack.items
                ? pack.items.split(',').map(i => i.trim()).filter(Boolean)
                : [];

            card.innerHTML = `
                <div class="pack-image">
                    <img src="${pack.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80'}" alt="${name}" loading="lazy">
                    <span class="pack-badge">Pack</span>
                </div>
                <div class="pack-content p-3">
                    <h5 class="pack-name fw-bold">${name}</h5>
                    <p class="pack-description text-muted small">${desc}</p>
                    ${itemsList.length > 0 ? `
                        <div class="pack-items">
                            <small class="text-muted fw-semibold"><i class="fas fa-check-circle me-1"></i> ${activeLanguage === 'ar' ? 'يشمل' : activeLanguage === 'en' ? 'Includes' : 'Inclus'}:</small>
                            <ul class="pack-items-list">
                                ${itemsList.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="pack-footer d-flex justify-content-between align-items-center mt-2">
                        <span class="pack-price fw-bold text-primary fs-5">${pack.price} DA</span>
                        <span class="pack-save-badge">
                            <i class="fas fa-gift"></i>
                            ${activeLanguage === 'ar' ? 'عرض خاص' : activeLanguage === 'en' ? 'Special Offer' : 'Offre Spéciale'}
                        </span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                const msg = `Bonjour,\n\nJe souhaite commander le pack : ${name}\nPrix : ${pack.price} DA\n\nMerci.`;
                const num = window.RestaurantSettings.whatsappNumber || '213555725285';
                window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
            });

            packsGrid.appendChild(card);
        });
    };

    function openDynamicProductModal(product, inventory) {
        const modal = document.getElementById('productModal');
        document.getElementById('productModalLabel').dataset.productId = product.id;
        document.getElementById('productModalName').textContent = product.name[activeLanguage] || product.name['fr'];
        document.getElementById('productModalDescription').textContent = product.description[activeLanguage] || product.description['fr'];
        document.getElementById('productModalIngredients').textContent = product.ingredients[activeLanguage] || product.ingredients['fr'];

        const effectivePrice = (product.is_promo && product.promo_price) ? product.promo_price : product.price;
        const priceEl = document.getElementById('productModalPrice');
        if (product.is_promo && product.promo_price && product.promo_price < product.price) {
            priceEl.innerHTML = `<span class="text-danger">${effectivePrice} DA</span> <del class="text-muted fs-6">${product.price} DA</del>`;
        } else {
            priceEl.textContent = `${effectivePrice} DA`;
        }

        const imgContainer = document.getElementById('productModalImage');
        imgContainer.innerHTML = `<img src="${product.image}" class="img-fluid rounded-3 w-100" style="max-height:300px; object-fit:cover;">`;

        document.getElementById('productQuantity').value = 1;

        const stock = (inventory && inventory[product.id] !== undefined) ? inventory[product.id] : null;
        const availEl = document.getElementById('productModalAvailability');
        if (stock !== null && stock <= 0) {
            availEl.innerHTML = '<span class="badge bg-danger fs-6">Rupture de stock</span>';
        } else if (stock !== null && stock <= 5) {
            availEl.innerHTML = `<span class="badge bg-warning text-dark fs-6">Plus que ${stock} en stock</span>`;
        } else if (stock !== null) {
            availEl.innerHTML = `<span class="badge bg-success fs-6">En stock (${stock})</span>`;
        } else {
            availEl.innerHTML = '';
        }

        const modalInstance = new bootstrap.Modal(modal);
        window.currentProductModal = modalInstance;
        modalInstance.show();
    }

    document.getElementById('addToOrderBtn').addEventListener('click', () => {
        const id = document.getElementById('productModalLabel').dataset.productId;
        const qty = parseInt(document.getElementById('productQuantity').value) || 1;
        const products = (menuData && menuData.products) || [];
        const targetProduct = products.find(p => String(p.id) === id);

        if (targetProduct) {
            const inventory = window.InventoryData || {};
            const stock = inventory[targetProduct.id];
            if (stock !== undefined && stock <= 0) {
                showNotificationToast('Produit en rupture de stock', 'danger');
                return;
            }

            const currentOrders = JSON.parse(localStorage.getItem('menuOrders') || '[]');
            const existingItem = currentOrders.find(item => item.productId === targetProduct.id);
            const effectivePrice = (targetProduct.is_promo && targetProduct.promo_price) ? targetProduct.promo_price : targetProduct.price;

            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                currentOrders.push({
                    productId: targetProduct.id,
                    name: targetProduct.name[activeLanguage] || targetProduct.name['fr'],
                    price: effectivePrice,
                    quantity: qty
                });
            }

            localStorage.setItem('menuOrders', JSON.stringify(currentOrders));
            if (window.updateCartBadgeCount) window.updateCartBadgeCount();
            showNotificationToast('Produit ajouté au panier !', 'success');
            if (window.currentProductModal) window.currentProductModal.hide();
        }
    });

    function showNotificationToast(msg, type) {
        let container = document.getElementById('toastWrapper');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastWrapper';
            container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
            container.style.zIndex = '1090';
            document.body.appendChild(container);
        }
        const icon = type === 'success' ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-danger';
        container.innerHTML = `
            <div class="toast align-items-center text-bg-dark border-0 shadow" role="alert" data-bs-delay="2000">
                <div class="d-flex">
                    <div class="toast-body fw-medium"><i class="fas ${icon} me-2"></i> ${msg}</div>
                </div>
            </div>`;
        const bToast = new bootstrap.Toast(container.querySelector('.toast'));
        bToast.show();
    }

    document.getElementById('sendWhatsAppOrderBtn').addEventListener('click', () => {
        const orders = JSON.parse(localStorage.getItem('menuOrders') || '[]');
        if (orders.length === 0) return alert("Votre panier est vide.");

        const urlParams = new URLSearchParams(window.location.search);
        const tableNum = urlParams.get('table') ? `Table N°${urlParams.get('table')}` : 'Table: Non spécifiée';

        let messageText = `Bonjour,\n\nJe souhaite passer la commande suivante :\n\n`;
        messageText += `*${tableNum}*\n\n`;

        let orderTotal = 0;
        orders.forEach(item => {
            const lineValue = item.price * item.quantity;
            orderTotal += lineValue;
            messageText += `* ${item.quantity} × ${item.name}\n`;
        });

        messageText += `\n*Total : ${orderTotal} DA*\n\nMerci.`;

        const targetWhatsAppNum = window.RestaurantSettings ? window.RestaurantSettings.whatsappNumber : "213555123456";
        const targetURL = `https://wa.me/${targetWhatsAppNum}?text=${encodeURIComponent(messageText)}`;
        window.open(targetURL, '_blank');
    });

    loadMenuData();
});
