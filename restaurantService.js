// Restaurant Service - Handles Google Places API calls
const RestaurantService = {
    placesService: null,

    /**
     * Initialize the Places Service
     */
    init(map) {
        this.placesService = new google.maps.places.PlacesService(map);
    },

    /**
     * Search for nearby restaurants
     */
    searchNearby(location, cuisineTypes = null, searchText = '') {
        return new Promise((resolve, reject) => {
            const request = {
                location: location,
                radius: CONFIG.MAP_CONFIG.searchRadius,
                type: 'restaurant'
            };

            // If search text is provided, use it as keyword
            if (searchText && searchText.trim().length > 0) {
                request.keyword = searchText.trim();

                this.placesService.nearbySearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        const restaurants = results.map(place => this.formatRestaurant(place));
                        resolve(restaurants);
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve([]);
                    } else {
                        reject(new Error(`Places API error: ${status}`));
                    }
                });
                return;
            }

            // If specific cuisine types are selected, search for each
            if (cuisineTypes && cuisineTypes.length > 0) {
                this.searchMultipleCuisines(location, cuisineTypes)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            // Otherwise, search for all restaurants
            this.placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    const restaurants = results.map(place => this.formatRestaurant(place));
                    resolve(restaurants);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(new Error(`Places API error: ${status}`));
                }
            });
        });
    },

    /**
     * Search for multiple cuisine types
     */
    async searchMultipleCuisines(location, cuisineTypes) {
        const allRestaurants = [];
        const searchPromises = [];

        for (const cuisineId of cuisineTypes) {
            const cuisine = CONFIG.getCuisineById(cuisineId);
            if (!cuisine) continue;

            const promise = new Promise((resolve, reject) => {
                const request = {
                    location: location,
                    radius: CONFIG.MAP_CONFIG.searchRadius,
                    keyword: cuisine.keywords.join(' OR '),
                    type: 'restaurant'
                };

                this.placesService.nearbySearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        const restaurants = results.map(place =>
                            this.formatRestaurant(place, cuisineId)
                        );
                        resolve(restaurants);
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve([]);
                    } else {
                        resolve([]); // Don't reject, just return empty for this cuisine
                    }
                });
            });

            searchPromises.push(promise);
        }

        const results = await Promise.all(searchPromises);

        // Flatten and remove duplicates
        const restaurantMap = new Map();
        results.flat().forEach(restaurant => {
            if (!restaurantMap.has(restaurant.placeId)) {
                restaurantMap.set(restaurant.placeId, restaurant);
            }
        });

        return Array.from(restaurantMap.values());
    },

    /**
     * Format a place result into our restaurant object
     */
    formatRestaurant(place, cuisineType = null) {
        // Try to detect cuisine type from place details
        if (!cuisineType) {
            cuisineType = this.detectCuisineType(place);
        }

        return {
            placeId: place.place_id,
            name: place.name,
            location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            },
            rating: place.rating || null,
            priceLevel: place.price_level || null,
            address: place.vicinity || null,
            photo: place.photos && place.photos.length > 0
                ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
                : null,
            cuisineType: cuisineType,
            isOpen: place.opening_hours?.isOpen() || null,
            types: place.types || []
        };
    },

    /**
     * Detect cuisine type from place data
     */
    detectCuisineType(place) {
        const types = place.types || [];
        const name = place.name.toLowerCase();

        // Check place types first
        for (const cuisine of CONFIG.CUISINE_TYPES) {
            if (types.includes(cuisine.googleType)) {
                return cuisine.id;
            }
        }

        // Check name and keywords
        for (const cuisine of CONFIG.CUISINE_TYPES) {
            for (const keyword of cuisine.keywords) {
                if (name.includes(keyword.toLowerCase())) {
                    return cuisine.id;
                }
            }
        }

        return null; // Unknown cuisine type
    },

    /**
     * Calculate distance between two points (in meters)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    /**
     * Format distance for display
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    }
};
