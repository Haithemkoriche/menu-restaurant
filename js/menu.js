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
        allTab.textContent = getTranslation('all_categories') || 'Tous';
        allTab.addEventListener('click', () => {
            setActiveCategory('all');
        });
        categoryTabs.appendChild(allTab);

        // Add category tabs
        menuData.categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.textContent = getCategoryTranslation(category.name);
            tab.addEventListener('click', () => {
                setActiveCategory(category.name.fr); // Using French as key for now
            });
            categoryTabs.appendChild(tab);
        });
    }

    // Set active category
    function setActiveCategory(category) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            const tabText = tab.textContent.trim();
            if (category === 'all') {
                if (tabText === 'Tous' || tabText === 'الكل' || tabText === 'All') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            } else {
                if (tabText === category) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        });

        activeCategory = category;
        filterProducts();
    }

    // Filter products based on search, category, and price
    function filterProducts() {
        if (!menuData) return;

        filteredProducts = menuData.products.filter(product => {
            // Price filter
            if (product.price > maxPrice) return false;

            // Category filter
            if (activeCategory !== 'all' && product.category !== activeCategory) return false;

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
});