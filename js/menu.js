// Menu rendering and filtering
let currentLanguage = 'fr'; // Default language, will be updated by languageChange event

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const categoryTabs = document.getElementById('categoryTabs');
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');
    const searchBtn = document.getElementById('searchBtn');

    // State
    let menuData = null;
    let filteredProducts = [];
    let activeCategory = 'all';
    let searchTerm = '';
    let maxPrice = 5000; // Default max price

    // Initialize
    fetchMenuData();

    // Event listeners
    searchInput.addEventListener('input', debounce(() => {
        searchTerm = searchInput.value.trim();
        filterProducts();
    }), 300);

    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.trim();
        filterProducts();
    });

    priceFilter.addEventListener('input', () => {
        maxPrice = parseInt(priceFilter.value) || 5000;
        priceDisplay.textContent = `0 - ${maxPrice} DA`;
        filterProducts();
    });

    // Listen for language changes from app.js
    document.addEventListener('languageChange', () => {
        // Get current language from localStorage (set by app.js)
        currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
        // Re-render everything with new language
        renderCategories();
        filterProducts();
    });

    // Debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(func, delay);
        };
    }

    // Fetch menu data
    function fetchMenuData() {
        fetch('data/menu.json')
            .then(response => response.json())
            .then(data => {
                // Build a lookup from localized category name -> category id,
                // then attach categoryId to each product. This makes filtering
                // language-independent (we filter by id, not by name string).
                const categoryIdByName = {};
                data.categories.forEach(cat => {
                    Object.values(cat.name).forEach(name => {
                        categoryIdByName[name] = cat.id;
                    });
                });
                data.products.forEach(product => {
                    product.categoryId = categoryIdByName[product.category] || null;
                });

                menuData = data;
                renderCategories();
                filterProducts(); // Initial render
            })
            .catch(error => {
                console.error('Error loading menu data:', error);
                productsGrid.innerHTML = '<p class="text-center text-danger">Erreur de chargement du menu</p>';
            });
    }

    // Render category tabs
    function renderCategories() {
        if (!menuData) return;

        // Clear existing tabs
        categoryTabs.innerHTML = '';

        // Add "All" tab
        const allTab = document.createElement('button');
        allTab.className = 'category-tab active';
        allTab.dataset.categoryId = 'all';
        allTab.textContent = getTranslation('all_categories') || 'Tous';
        allTab.addEventListener('click', () => {
            setActiveCategory('all');
        });
        categoryTabs.appendChild(allTab);

        // Add category tabs
        menuData.categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.categoryId = String(category.id);
            tab.textContent = getCategoryTranslation(category.name);
            tab.addEventListener('click', () => {
                setActiveCategory(String(category.id));
            });
            categoryTabs.appendChild(tab);
        });
    }

    // Set active category
    function setActiveCategory(categoryId) {
        // Update active tab using stable data attribute (language-independent)
        document.querySelectorAll('.category-tab').forEach(tab => {
            if (tab.dataset.categoryId === String(categoryId)) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        activeCategory = categoryId;
        filterProducts();
    }

    // Filter products based on search, category, and price
    function filterProducts() {
        if (!menuData) return;

        filteredProducts = menuData.products.filter(product => {
            // Price filter
            if (product.price > maxPrice) return false;

            // Category filter
            if (activeCategory !== 'all' && String(product.categoryId) !== String(activeCategory)) return false;

            // Search filter
            if (searchTerm) {
                const productName = getProductTranslation(product.name).toLowerCase();
                const productDesc = getProductTranslation(product.description).toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                return productName.includes(searchLower) || productDesc.includes(searchLower);
            }

            return true;
        });

        renderProducts();
    }

    // Render products grid
    function renderProducts() {
        if (!menuData) return;

        if (filteredProducts.length === 0) {
            productsGrid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        productsGrid.style.display = 'grid';
        noResults.style.display = 'none';

        // Clear grid
        productsGrid.innerHTML = '';

        // Create product cards
        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.productId = product.id;

            // Product image
            const imageDiv = document.createElement('div');
            imageDiv.className = 'product-image';
            imageDiv.innerHTML = '<i class="fas fa-utensils"></i>'; // Default icon

            // Product content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'product-content';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'product-name';
            nameDiv.textContent = getProductTranslation(product.name);

            const descDiv = document.createElement('div');
            descDiv.className = 'product-description';
            descDiv.textContent = getProductTranslation(product.description);

            const footerDiv = document.createElement('div');
            footerDiv.className = 'product-footer';

            const priceSpan = document.createElement('span');
            priceSpan.className = 'product-price';
            priceSpan.textContent = `${product.price} ${menuData.currency}`;

            const availabilitySpan = document.createElement('span');
            availabilitySpan.className = `availability-badge ${product.available ? 'available' : 'unavailable'}`;
            availabilitySpan.textContent = product.available ? getTranslation('available') : getTranslation('unavailable');

            footerDiv.appendChild(priceSpan);
            footerDiv.appendChild(availabilitySpan);

            contentDiv.appendChild(nameDiv);
            contentDiv.appendChild(descDiv);
            contentDiv.appendChild(footerDiv);

            card.appendChild(imageDiv);
            card.appendChild(contentDiv);

            // Add click event to open modal
            card.addEventListener('click', () => {
                openProductModal(product);
            });

            productsGrid.appendChild(card);
        });
    }

    // Open product modal
    function openProductModal(product) {
        const modalTitle = document.getElementById('productModalLabel');
        const modalImage = document.getElementById('productModalImage');
        const modalName = document.getElementById('productModalName');
        const modalCategory = document.getElementById('productModalCategory');
        const modalDescription = document.getElementById('productModalDescription');
        const modalIngredients = document.getElementById('productModalIngredients');
        const modalPrice = document.getElementById('productModalPrice');
        const modalAvailability = document.getElementById('productModalAvailability');

        // Set modal content
        modalTitle.textContent = getProductTranslation(product.name);
        modalTitle.dataset.productId = product.id; // Store product ID for add to order
        modalImage.innerHTML = '<i class="fas fa-utensils"></i>'; // Default icon
        modalName.textContent = getProductTranslation(product.name);
        modalCategory.textContent = getCategoryTranslation({ name: { fr: product.category } });
        modalDescription.textContent = getProductTranslation(product.description);
        modalIngredients.textContent = getProductTranslation(product.ingredients);
        modalPrice.textContent = `${product.price} ${menuData.currency}`;
        modalAvailability.textContent = product.available ? getTranslation('available') : getTranslation('unavailable');
        modalAvailability.className = `availability-badge ${product.available ? 'available' : 'unavailable'}`;

        // Show modal
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.show();
    }

    // Helper to get translation for a product field
    function getProductTranslation(field) {
        if (!field || typeof field !== 'object') return field || '';
        return field[currentLanguage] || field.fr || Object.values(field)[0] || '';
    }

    // Helper to get translation for a category field
    function getCategoryTranslation(field) {
        if (!field || typeof field !== 'object') return field || '';
        return field[currentLanguage] || field.fr || Object.values(field)[0] || '';
    }

    // Get translation for UI strings
    function getTranslation(key) {
        if (!menuData || !menuData.translations) return key;
        return menuData.translations[currentLanguage] && menuData.translations[currentLanguage][key]
            ? menuData.translations[currentLanguage][key]
            : key;
    }

    // Order management functions
    function getOrders() {
        const orders = localStorage.getItem('menuOrders');
        return orders ? JSON.parse(orders) : [];
    }

    function saveOrder(product) {
        const orders = getOrders();
        const existingOrderIndex = orders.findIndex(order => order.productId === product.id);

        if (existingOrderIndex >= 0) {
            // If product already in order, increment quantity
            orders[existingOrderIndex].quantity += 1;
        } else {
            // Add new product to order
            orders.push({
                productId: product.id,
                name: getProductTranslation(product.name),
                price: product.price,
                quantity: 1,
                category: product.category,
                image: product.image,
                timestamp: new Date().toISOString()
            });
        }

        localStorage.setItem('menuOrders', JSON.stringify(orders));
        showOrderConfirmation();
    }

    function showOrderConfirmation() {
        // Create or update order confirmation toast
        let toast = document.getElementById('orderToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'orderToast';
            toast.className = 'position-fixed bottom-0 end-0 p-3';
            toast.style.zIndex = '1050';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        Produit ajouté à la commande!
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        const bootstrapToast = new bootstrap.Toast(toast);
        bootstrapToast.show();
    }

    // Initialize add to order button functionality
    document.addEventListener('DOMContentLoaded', function() {
        // This will run after the DOM is loaded, but we need to ensure the modal exists
        const addToOrderBtn = document.getElementById('addToOrderBtn');
        if (addToOrderBtn) {
            addToOrderBtn.addEventListener('click', function() {
                // Get the currently displayed product from the modal
                const modalProductId = document.getElementById('productModalLabel').dataset.productId;
                if (modalProductId && menuData) {
                    const product = menuData.products.find(p => p.id == modalProductId);
                    if (product) {
                        saveOrder(product);
                    }
                }
            });
        }
    });

});