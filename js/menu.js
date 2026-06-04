let activeLanguage = localStorage.getItem('selectedLanguage') || 'fr';

document.addEventListener('DOMContentLoaded', function() {
    const productsGrid = document.getElementById('productsGrid');
    const categoryTabs = document.getElementById('categoryTabs');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');

    let menuData = null;
    let activeCategory = 'all';
    let searchTerm = '';
    let maxPrice = 5000;

    // Load menu data
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            menuData = data;
            // Build stable indexing maps
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
        })
        .catch(err => {
            console.error(err);
            productsGrid.innerHTML = '<p class="text-danger p-4 text-center">Erreur système.</p>';
        });

    // Handle incoming broadcast events safely
    document.addEventListener('languageChanged', (e) => {
        activeLanguage = e.detail.lang;
        renderCategoryTabs();
        filterAndRenderProducts();
    });

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

        // Master Selector Tab
        const allTab = document.createElement('button');
        allTab.className = `category-tab ${activeCategory === 'all' ? 'active' : ''}`;
        allTab.textContent = activeLanguage === 'ar' ? 'الكل' : (activeLanguage === 'en' ? 'All' : 'Tous');
        allTab.addEventListener('click', () => selectCategory('all'));
        categoryTabs.appendChild(allTab);

        menuData.categories.forEach(cat => {
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

        const filtered = menuData.products.filter(p => {
            if (p.price > maxPrice) return false;
            if (activeCategory !== 'all' && String(p.categoryId) !== activeCategory) return false;
            if (searchTerm) {
                const name = (p.name[activeLanguage] || p.name['fr']).toLowerCase();
                const desc = (p.description[activeLanguage] || p.description['fr']).toLowerCase();
                return name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
            }
            return true;
        });

        renderGridCards(filtered);
    }

    function renderGridCards(products) {
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
            // Stagger animations smoothly like Framer Motion
            card.style.animationDelay = `${index * 0.04}s`;

            const name = p.name[activeLanguage] || p.name['fr'];
            const desc = p.description[activeLanguage] || p.description['fr'];

            card.innerHTML = `
                <div class="product-image">
                    <img src="${p.image}" alt="${name}" loading="lazy">
                </div>
                <div class="product-content p-3">
                    <div class="product-name fw-bold mb-1 fs-5">${name}</div>
                    <div class="product-description text-muted small text-truncate mb-3">${desc}</div>
                    <div class="product-footer d-flex justify-content-between align-items-center">
                        <span class="product-price fw-bold text-primary">${p.price} DA</span>
                        <span class="availability-badge ${p.available ? 'text-success' : 'text-danger'} small">
                            <i class="fas ${p.available ? 'fa-circle' : 'fa-times-circle'}" style="font-size:9px;"></i> ${p.available ? 'Dispo' : 'Complet'}
                        </span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openDynamicProductModal(p));
            productsGrid.appendChild(card);
        });
    }

    function openDynamicProductModal(product) {
        document.getElementById('productModalLabel').dataset.productId = product.id;
        document.getElementById('productModalName').textContent = product.name[activeLanguage] || product.name['fr'];
        document.getElementById('productModalDescription').textContent = product.description[activeLanguage] || product.description['fr'];
        document.getElementById('productModalIngredients').textContent = product.ingredients[activeLanguage] || product.ingredients['fr'];
        document.getElementById('productModalPrice').textContent = `${product.price} DA`;
        
        const imgContainer = document.getElementById('productModalImage');
        imgContainer.innerHTML = `<img src="${product.image}" class="img-fluid rounded-3 w-100" style="max-height:300px; object-fit:cover;">`;

        document.getElementById('productQuantity').value = 1;

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        window.currentProductModal = modal;
        modal.show();
    }

    // Add To Order Handler Logic
    document.getElementById('addToOrderBtn').addEventListener('click', () => {
        const id = document.getElementById('productModalLabel').dataset.productId;
        const qty = parseInt(document.getElementById('productQuantity').value) || 1;
        const targetProduct = menuData.products.find(p => String(p.id) === id);

        if (targetProduct) {
            const currentOrders = JSON.parse(localStorage.getItem('menuOrders') || '[]');
            // Check if item already exists to merge quantity cleanly
            const existingItem = currentOrders.find(item => item.productId === targetProduct.id);
            
            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                currentOrders.push({
                    productId: targetProduct.id,
                    name: targetProduct.name[activeLanguage] || targetProduct.name['fr'],
                    price: targetProduct.price,
                    quantity: qty
                });
            }

            localStorage.setItem('menuOrders', JSON.stringify(currentOrders));
            if (window.updateCartBadgeCount) window.updateCartBadgeCount();
            
            // Premium Added Confirmation Toast
            showPremiumNotificationToast();
            if (window.currentProductModal) window.currentProductModal.hide();
        }
    });

    function showPremiumNotificationToast() {
        let container = document.getElementById('toastWrapper');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastWrapper';
            container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
            container.style.zIndex = '1090';
            document.body.appendChild(container);
        }
        container.innerHTML = `
            <div class="toast align-items-center text-bg-dark border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="2000">
                <div class="d-flex">
                    <div class="toast-body fw-medium"><i class="fas fa-check-circle text-success me-2"></i> Produit ajouté au panier !</div>
                </div>
            </div>
        `;
        const bToast = new bootstrap.Toast(container.querySelector('.toast'));
        bToast.show();
    }

    // WhatsApp Automated Message Dispatch Order Builder Engine
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

        // Load configuration from local singleton safely
        const targetWhatsAppNum = window.RestaurantSettings ? window.RestaurantSettings.whatsappNumber : "213555123456";
        const targetURL = `https://wa.me/${targetWhatsAppNum}?text=${encodeURIComponent(messageText)}`;
        
        window.open(targetURL, '_blank');
    });
});