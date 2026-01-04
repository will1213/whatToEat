import CONFIG from '../config';

const RestaurantService = {
    /**
     * Search for nearby restaurants via Google Maps JS API
     */
    async searchNearby(location, cuisineTypes = null, searchText = '', maxPrice = null) {
        try {
            let results = [];

            // Helper to Promisify PlacesService
            const searchPlaces = (request) => {
                return new Promise((resolve, reject) => {
                    const service = new google.maps.places.PlacesService(document.createElement('div'));
                    service.nearbySearch(request, (places, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                            resolve(places);
                        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                            resolve([]);
                        } else {
                            // Don't reject on ZERO_RESULTS, but reject on other errors
                            console.warn("Places Search Status:", status);
                            resolve([]);
                        }
                    });
                });
            };

            const baseRequest = {
                location: new google.maps.LatLng(location.lat, location.lng),
                radius: CONFIG.MAP_CONFIG.searchRadius,
                type: 'restaurant'
            };

            if (maxPrice) {
                baseRequest.maxPriceLevel = parseInt(maxPrice);
            }

            // If search text is provided
            if (searchText && searchText.trim().length > 0) {
                results = await searchPlaces({
                    ...baseRequest,
                    keyword: searchText.trim()
                });
            }
            // If specific cuisines
            else if (cuisineTypes && cuisineTypes.length > 0) {
                return await this.searchMultipleCuisines(location, cuisineTypes, maxPrice);
            }
            // General search
            else {
                results = await searchPlaces(baseRequest);
            }

            return results.map(place => this.formatRestaurant(place));
        } catch (error) {
            console.error("Search error", error);
            throw error;
        }
    },

    /**
     * Search for multiple cuisine types
     */
    async searchMultipleCuisines(location, cuisineTypes, maxPrice) {
        const searchPlaces = (request) => {
            return new Promise((resolve, reject) => {
                const service = new google.maps.places.PlacesService(document.createElement('div'));
                service.nearbySearch(request, (places, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                        resolve(places);
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve([]);
                    } else {
                        resolve([]);
                    }
                });
            });
        };

        const promises = cuisineTypes.map(async (cuisineId) => {
            const cuisine = CONFIG.getCuisineById(cuisineId);
            if (!cuisine) return [];

            const request = {
                location: new google.maps.LatLng(location.lat, location.lng),
                radius: CONFIG.MAP_CONFIG.searchRadius,
                type: 'restaurant',
                keyword: cuisine.keywords.join(' OR ')
            };

            if (maxPrice) {
                request.maxPriceLevel = parseInt(maxPrice);
            }

            return await searchPlaces(request);
        });

        const resultsArrays = await Promise.all(promises);

        // Deduplicate by place_id
        const allResults = resultsArrays.flat();
        const uniqueMap = new Map();
        allResults.forEach(place => {
            if (!uniqueMap.has(place.place_id)) {
                uniqueMap.set(place.place_id, place);
            }
        });

        const dedupedRaw = Array.from(uniqueMap.values());
        return dedupedRaw.map(place => this.formatRestaurant(place));
    },

    /**
     * Format a place result into our restaurant object
     * Handles Google Maps JS API PlaceResult objects
     */
    formatRestaurant(place) {
        const geometry = place.geometry?.location;
        const lat = typeof geometry.lat === 'function' ? geometry.lat() : geometry.lat;
        const lng = typeof geometry.lng === 'function' ? geometry.lng() : geometry.lng;

        const cuisineType = this.detectCuisineType(place);

        // Photos
        let photoUrl = null;
        if (place.photos && place.photos.length > 0) {
            const photo = place.photos[0];
            if (typeof photo.getUrl === 'function') {
                photoUrl = photo.getUrl({ maxWidth: 400 });
            }
        }

        // Open Status
        let isOpen = null;
        if (place.opening_hours) {
            // Safe check:
            if (typeof place.opening_hours.isOpen === 'function') {
                try {
                    isOpen = place.opening_hours.isOpen();
                } catch (e) {
                    // Start date optional
                    isOpen = place.opening_hours.isOpen(new Date());
                }
            } else if (place.opening_hours.open_now !== undefined) {
                isOpen = place.opening_hours.open_now;
            }
        }

        return {
            placeId: place.place_id,
            name: place.name,
            location: { lat, lng },
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || 0,
            priceLevel: place.price_level || null,
            address: place.vicinity || null,
            photo: photoUrl,
            cuisineType: cuisineType,
            isOpen: isOpen,
            types: place.types || []
        };
    },

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
        return null;
    },

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

    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    }
};

export default RestaurantService;
