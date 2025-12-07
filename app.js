// Main Application Logic
let userLocation = null;

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Restaurant Finder App...');

    // Check if API key is configured
    if (!CONFIG.GOOGLE_MAPS_API_KEY || CONFIG.GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
        UIManager.cacheElements();
        UIManager.showError(
            'Please configure your Google Maps API key in config.js to use this application. ' +
            'Get your API key from the Google Cloud Console and enable the Maps JavaScript API and Places API.'
        );
        return;
    }

    // Load Google Maps API
    try {
        await loadGoogleMapsAPI();

        // Initialize managers
        UIManager.cacheElements();
        UIManager.renderCuisineCards();
        FilterManager.init();

        // Set up event listeners
        setupEventListeners();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        UIManager.showError('Failed to load Google Maps. Please check your internet connection and API key.');
    }
}

/**
 * Load Google Maps JavaScript API
 */
function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;

        script.onerror = () => reject(new Error('Failed to load Google Maps API'));

        // Global callback
        window.initMap = () => {
            console.log('Google Maps API loaded');
            resolve();
        };

        document.head.appendChild(script);
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search button
    UIManager.elements.searchBtn.addEventListener('click', handleSearch);

    // Explore button
    UIManager.elements.exploreBtn.addEventListener('click', handleExplore);

    // Back button
    UIManager.elements.backBtn.addEventListener('click', handleBack);

    // Mode toggle
    UIManager.elements.modeToggle.addEventListener('click', handleModeToggle);

    // Error modal close
    UIManager.elements.closeErrorBtn.addEventListener('click', () => {
        UIManager.hideError();
    });

    // Search input
    UIManager.elements.foodSearchInput.addEventListener('input', (e) => {
        FilterManager.setSearchText(e.target.value);
        UIManager.updateSearchButtonState();
    });

    // Enter key on search input
    UIManager.elements.foodSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !UIManager.elements.searchBtn.disabled) {
            handleSearch();
        }
    });

    // Search icon click
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            if (!UIManager.elements.searchBtn.disabled) {
                handleSearch();
            }
        });
    }

    // Surprise Me button
    const surpriseMeBtn = document.getElementById('surpriseMeBtn');
    if (surpriseMeBtn) {
        surpriseMeBtn.addEventListener('click', handleSurpriseMe);
    }

    // Pick One button
    const pickOneBtn = document.getElementById('pickOneBtn');
    if (pickOneBtn) {
        pickOneBtn.addEventListener('click', handlePickOne);
    }

    // Open Now toggle
    const openNowToggle = document.getElementById('openNowToggle');
    if (openNowToggle) {
        openNowToggle.addEventListener('change', (e) => {
            FilterManager.setOpenNow(e.target.checked);
        });
    }
}

/**
 * Handle search button click
 */
async function handleSearch() {
    try {
        // Get user location
        const location = await getUserLocation();
        userLocation = location;

        // Show results view
        UIManager.showResultsView();
        UIManager.showLoading();

        // Initialize map
        if (!MapHandler.map) {
            MapHandler.init(location);
            RestaurantService.init(MapHandler.map);

            // Set up location change callback for map clicks
            MapHandler.onLocationChange = async (newLocation) => {
                userLocation = newLocation;
                UIManager.showLoading();

                try {
                    const searchText = FilterManager.getSearchText();
                    const hasText = FilterManager.hasSearchText();
                    let restaurants;

                    if (hasText) {
                        restaurants = await RestaurantService.searchNearby(newLocation, null, searchText);
                    } else if (FilterManager.isInExploreMode()) {
                        restaurants = await RestaurantService.searchNearby(newLocation);
                    } else {
                        const cuisineTypes = FilterManager.getSelectedCuisines();
                        if (cuisineTypes.length > 0) {
                            restaurants = await RestaurantService.searchNearby(newLocation, cuisineTypes);
                        } else {
                            restaurants = await RestaurantService.searchNearby(newLocation);
                        }
                    }

                    displayResults(restaurants);
                } catch (error) {
                    console.error('Location change search error:', error);
                    UIManager.hideLoading();
                }
            };
        }

        // Set to guided mode
        FilterManager.setExploreMode(false);

        const searchText = FilterManager.getSearchText();
        const hasText = FilterManager.hasSearchText();

        // Search for restaurants
        let restaurants;

        // Prioritize search text if provided
        if (hasText) {
            restaurants = await RestaurantService.searchNearby(location, null, searchText);
        } else {
            // Otherwise use cuisine types
            const cuisineTypes = FilterManager.getSelectedCuisines();
            restaurants = await RestaurantService.searchNearby(location, cuisineTypes);
        }

        // Display results
        displayResults(restaurants);

    } catch (error) {
        console.error('Search error:', error);
        UIManager.hideLoading();
        UIManager.showError(error.message || 'Failed to search for restaurants. Please try again.');
    }
}

/**
 * Handle explore button click
 */
async function handleExplore() {
    try {
        // Get user location
        const location = await getUserLocation();
        userLocation = location;

        // Show results view
        UIManager.showResultsView();
        UIManager.showLoading();

        // Initialize map
        if (!MapHandler.map) {
            MapHandler.init(location);
            RestaurantService.init(MapHandler.map);

            // Set up location change callback for map clicks
            MapHandler.onLocationChange = async (newLocation) => {
                userLocation = newLocation;
                UIManager.showLoading();

                try {
                    const searchText = FilterManager.getSearchText();
                    const hasText = FilterManager.hasSearchText();
                    let restaurants;

                    if (hasText) {
                        restaurants = await RestaurantService.searchNearby(newLocation, null, searchText);
                    } else if (FilterManager.isInExploreMode()) {
                        restaurants = await RestaurantService.searchNearby(newLocation);
                    } else {
                        const cuisineTypes = FilterManager.getSelectedCuisines();
                        if (cuisineTypes.length > 0) {
                            restaurants = await RestaurantService.searchNearby(newLocation, cuisineTypes);
                        } else {
                            restaurants = await RestaurantService.searchNearby(newLocation);
                        }
                    }

                    displayResults(restaurants);
                } catch (error) {
                    console.error('Location change search error:', error);
                    UIManager.hideLoading();
                }
            };
        }

        // Set to explore mode
        FilterManager.setExploreMode(true);

        // Search for all nearby restaurants
        const restaurants = await RestaurantService.searchNearby(location);

        // Display results
        displayResults(restaurants);

    } catch (error) {
        console.error('Explore error:', error);
        UIManager.hideLoading();
        UIManager.showError(error.message || 'Failed to load restaurants. Please try again.');
    }
}

/**
 * Handle back button click
 */
function handleBack() {
    UIManager.showLandingScreen();
    MapHandler.clearMarkers();

    // Clear search text
    FilterManager.clearSearchText();
    UIManager.elements.foodSearchInput.value = '';

    // Update button state
    UIManager.updateSearchButtonState();
}

/**
 * Handle mode toggle button click
 */
async function handleModeToggle() {
    try {
        UIManager.showLoading();

        const newMode = FilterManager.toggleExploreMode();

        if (newMode) {
            // Switched to explore mode - show all restaurants
            const restaurants = await RestaurantService.searchNearby(userLocation);
            displayResults(restaurants);
        } else {
            // Switched to guided mode - filter by selections or search text
            const searchText = FilterManager.getSearchText();
            const hasText = FilterManager.hasSearchText();

            let restaurants;

            if (hasText) {
                restaurants = await RestaurantService.searchNearby(userLocation, null, searchText);
            } else {
                const cuisineTypes = FilterManager.getSelectedCuisines();

                if (cuisineTypes.length === 0) {
                    // No filters selected, show message
                    UIManager.hideLoading();
                    UIManager.showEmptyState();
                    UIManager.updateResultsTitle('No Filters Selected', 0);
                    UIManager.updateModeToggle();
                    MapHandler.clearMarkers();
                    return;
                }

                restaurants = await RestaurantService.searchNearby(userLocation, cuisineTypes);
            }

            displayResults(restaurants);
        }

    } catch (error) {
        console.error('Mode toggle error:', error);
        UIManager.hideLoading();
        UIManager.showError('Failed to update results. Please try again.');
    }
}

/**
 * Display search results
 */
function displayResults(restaurants) {
    // Update title based on search type
    let title;
    const searchText = FilterManager.getSearchText();

    if (searchText) {
        title = `"${searchText}" Restaurants`;
    } else if (FilterManager.isInExploreMode()) {
        title = 'All Nearby Restaurants';
    } else {
        title = `${FilterManager.getFilterSummary()} Restaurants`;
    }

    UIManager.updateResultsTitle(title, restaurants.length);
    UIManager.updateModeToggle();

    // Render restaurant cards
    UIManager.renderRestaurantCards(restaurants, userLocation);

    // Add markers to map
    MapHandler.addMarkers(restaurants);
}

/**
 * Handle Surprise Me button click
 */
async function handleSurpriseMe() {
    try {
        // Randomly select 1-2 cuisines
        const allCuisines = CONFIG.CUISINE_TYPES;
        const numToSelect = Math.random() < 0.7 ? 1 : 2; // 70% chance of 1 cuisine, 30% of 2

        const shuffled = [...allCuisines].sort(() => 0.5 - Math.random());
        const randomCuisines = shuffled.slice(0, numToSelect);

        // Clear previous selections
        FilterManager.clearSelections();
        const cards = document.querySelectorAll('.cuisine-card.selected');
        cards.forEach(card => card.classList.remove('selected'));

        // Select random cuisines and highlight their cards
        randomCuisines.forEach(cuisine => {
            FilterManager.selectCuisine(cuisine.id);
            const card = document.querySelector(`[data-cuisine-id="${cuisine.id}"]`);
            if (card) card.classList.add('selected');
        });

        // Auto-trigger search
        handleSearch();
    } catch (error) {
        console.error('Surprise Me error:', error);
        UIManager.showError('Failed to surprise you! Please try again.');
    }
}

/**
 * Handle Pick One button click (in results view)
 */
function handlePickOne() {
    const allCards = document.querySelectorAll('.restaurant-card');

    if (allCards.length === 0) {
        UIManager.showError('No restaurants to pick from!');
        return;
    }

    // Remove previous highlights
    allCards.forEach(card => card.classList.remove('highlighted'));

    // Pick random card
    const randomIndex = Math.floor(Math.random() * allCards.length);
    const selectedCard = allCards[randomIndex];

    // Highlight it
    selectedCard.classList.add('highlighted');

    // Scroll to it smoothly
    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-click after scroll animation
    setTimeout(() => selectedCard.click(), 500);
}

/**
 * Get user's current location
 */
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('User location obtained:', location);
                resolve(location);
            },
            (error) => {
                console.error('Geolocation error:', error);

                // Provide helpful error messages
                let message = 'Unable to get your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please enable location permissions for this site.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out.';
                        break;
                    default:
                        message += 'An unknown error occurred.';
                }

                // Use fallback location (New York City)
                const fallbackLocation = CONFIG.DEFAULT_LOCATION;
                console.log('Using fallback location:', fallbackLocation);

                // Show warning but continue with fallback
                setTimeout(() => {
                    UIManager.showError(message + ' Using default location (New York City) instead.');
                }, 500);

                resolve(fallbackLocation);
            },
            {
                enableHighAccuracy: false, // Faster results, still accurate enough for restaurants
                timeout: 30000, // 30 seconds - more time for slower systems
                maximumAge: 300000 // Accept cached position up to 5 minutes old
            }
        );
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
