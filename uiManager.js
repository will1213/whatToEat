// UI Manager - Manages UI state and transitions
const UIManager = {
    elements: {},

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            landingScreen: document.getElementById('landingScreen'),
            resultsView: document.getElementById('resultsView'),
            cuisineGrid: document.getElementById('cuisineGrid'),
            searchBtn: document.getElementById('searchBtn'),
            exploreBtn: document.getElementById('exploreBtn'),
            backBtn: document.getElementById('backBtn'),
            modeToggle: document.getElementById('modeToggle'),
            modeToggleText: document.getElementById('modeToggleText'),
            restaurantList: document.getElementById('restaurantList'),
            resultsTitle: document.getElementById('resultsTitle'),
            resultsCount: document.getElementById('resultsCount'),
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            errorModal: document.getElementById('errorModal'),
            errorMessage: document.getElementById('errorMessage'),
            closeErrorBtn: document.getElementById('closeErrorBtn'),
            foodSearchInput: document.getElementById('foodSearchInput')
        };
    },

    /**
     * Render cuisine selection cards
     */
    renderCuisineCards() {
        const grid = this.elements.cuisineGrid;
        grid.innerHTML = '';

        CONFIG.CUISINE_TYPES.forEach(cuisine => {
            const card = document.createElement('div');
            card.className = 'cuisine-card';
            card.dataset.cuisineId = cuisine.id;
            card.innerHTML = `
        <span class="cuisine-emoji">${cuisine.emoji}</span>
        <span class="cuisine-name">${cuisine.name}</span>
      `;

            card.addEventListener('click', () => {
                this.toggleCuisineCard(cuisine.id);
            });

            grid.appendChild(card);
        });
    },

    /**
     * Toggle cuisine card selection
     */
    toggleCuisineCard(cuisineId) {
        const card = document.querySelector(`[data-cuisine-id="${cuisineId}"]`);
        if (!card) return;

        card.classList.toggle('selected');
        FilterManager.toggleCuisine(cuisineId);

        // Update search button state
        this.updateSearchButtonState();
    },

    /**
     * Update search button enabled/disabled state
     */
    updateSearchButtonState() {
        const hasSelections = FilterManager.hasSelections();
        const hasText = FilterManager.hasSearchText();
        this.elements.searchBtn.disabled = !hasSelections && !hasText;
    },

    /**
     * Show landing screen
     */
    showLandingScreen() {
        this.elements.landingScreen.classList.remove('hidden');
        this.elements.resultsView.classList.add('hidden');
    },

    /**
     * Show results view
     */
    showResultsView() {
        this.elements.landingScreen.classList.add('hidden');
        this.elements.resultsView.classList.remove('hidden');
    },

    /**
     * Show loading state
     */
    showLoading() {
        this.elements.loadingState.classList.remove('hidden');
        this.elements.emptyState.classList.add('hidden');
        this.clearRestaurantCards();
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        this.elements.loadingState.classList.add('hidden');
    },

    /**
     * Show empty state
     */
    showEmptyState() {
        this.elements.emptyState.classList.remove('hidden');
        this.elements.loadingState.classList.add('hidden');
    },

    /**
     * Hide empty state
     */
    hideEmptyState() {
        this.elements.emptyState.classList.add('hidden');
    },

    /**
     * Update results title
     */
    updateResultsTitle(title, count) {
        this.elements.resultsTitle.textContent = title;
        this.elements.resultsCount.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    },

    /**
     * Update mode toggle button
     */
    updateModeToggle() {
        const isExploreMode = FilterManager.isInExploreMode();
        this.elements.modeToggleText.textContent = isExploreMode ? 'Show Filters' : 'Show All';
    },

    /**
     * Clear all restaurant cards
     */
    clearRestaurantCards() {
        const cards = this.elements.restaurantList.querySelectorAll('.restaurant-card');
        cards.forEach(card => card.remove());
    },

    /**
     * Render restaurant cards
     */
    renderRestaurantCards(restaurants, userLocation) {
        this.clearRestaurantCards();
        this.hideLoading();

        if (restaurants.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Calculate distances and sort
        restaurants.forEach(restaurant => {
            const distance = RestaurantService.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                restaurant.location.lat,
                restaurant.location.lng
            );
            restaurant.distance = distance;
            restaurant.distanceText = RestaurantService.formatDistance(distance);
        });

        restaurants.sort((a, b) => a.distance - b.distance);

        // Create cards
        restaurants.forEach(restaurant => {
            const card = this.createRestaurantCard(restaurant);
            this.elements.restaurantList.appendChild(card);
        });
    },

    /**
     * Create a restaurant card element
     */
    createRestaurantCard(restaurant) {
        const card = document.createElement('div');
        card.className = 'restaurant-card';

        const cuisine = CONFIG.getCuisineById(restaurant.cuisineType);
        const cuisineTag = cuisine
            ? `<span class="cuisine-tag" style="background: ${cuisine.color}20; color: ${cuisine.color};">${cuisine.emoji} ${cuisine.name}</span>`
            : '';

        const ratingStars = restaurant.rating
            ? '⭐'.repeat(Math.round(restaurant.rating))
            : '';

        const openStatus = restaurant.isOpen !== null
            ? `<span class="status ${restaurant.isOpen ? 'open' : 'closed'}">${restaurant.isOpen ? '● Open' : '● Closed'}</span>`
            : '';

        const priceLevel = restaurant.priceLevel
            ? `<span class="price">${'$'.repeat(restaurant.priceLevel)}</span>`
            : '';

        // Photo element with fallback
        const photoElement = restaurant.photo
            ? `<div class="card-photo" style="background-image: url('${restaurant.photo}');"></div>`
            : `<div class="card-photo card-photo-placeholder">
                 <span style="font-size: 3rem; opacity: 0.3;">${cuisine?.emoji || '🍽️'}</span>
               </div>`;

        card.innerHTML = `
      ${photoElement}
      <div class="card-content">
        <div class="card-header">
          <h3 class="restaurant-name">${restaurant.name}</h3>
          <span class="distance">${restaurant.distanceText}</span>
        </div>
        <div class="card-details">
          ${restaurant.rating ? `<div class="rating">${ratingStars} ${restaurant.rating}</div>` : ''}
          ${openStatus}
          ${priceLevel}
        </div>
        ${restaurant.address ? `<p class="address">${restaurant.address}</p>` : ''}
        ${cuisineTag}
      </div>
    `;

        // Add click handler to highlight marker on map
        card.addEventListener('click', () => {
            if (restaurant.marker) {
                google.maps.event.trigger(restaurant.marker, 'click');
                // Create proper LatLng object for accurate centering
                const latLng = new google.maps.LatLng(restaurant.location.lat, restaurant.location.lng);
                MapHandler.map.setCenter(latLng);
                MapHandler.map.setZoom(17);
            }
        });

        return card;
    },

    /**
     * Show error modal
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.classList.remove('hidden');
    },

    /**
     * Hide error modal
     */
    hideError() {
        this.elements.errorModal.classList.add('hidden');
    }
};
