// Map Handler - Manages Google Maps integration
const MapHandler = {
    map: null,
    markers: [],
    infoWindow: null,
    userLocation: null,

    /**
     * Initialize the Google Map
     */
    init(center, zoom = CONFIG.MAP_CONFIG.zoom) {
        const mapContainer = document.getElementById('map');

        this.map = new google.maps.Map(mapContainer, {
            center: center,
            zoom: zoom,
            styles: this.getMapStyles(),
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });

        this.infoWindow = new google.maps.InfoWindow();
        this.userLocation = center;

        // Add user location marker
        this.addUserMarker(center);

        // Add click listener for location exploration
        this.map.addListener('click', (event) => {
            const clickedLocation = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };

            // Update user location
            this.userLocation = clickedLocation;

            // Update user marker position
            if (this.userMarker) {
                this.userMarker.setPosition(event.latLng);
                this.userMarker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => this.userMarker.setAnimation(null), 1500);
            }

            // Update pulse circle
            if (this.pulseCircle) {
                this.pulseCircle.setCenter(clickedLocation);
            }

            // Trigger callback if set (for re-searching)
            if (this.onLocationChange) {
                this.onLocationChange(clickedLocation);
            }
        });
    },

    /**
     * Get custom map styles (dark theme)
     */
    getMapStyles() {
        return [
            { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#94a3b8" }]
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#94a3b8" }]
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#1e3a2f" }]
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6da073" }]
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#334155" }]
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1e293b" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#475569" }]
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#334155" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#0f172a" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#475569" }]
            }
        ];
    },

    /**
     * Add user location marker - enhanced visibility
     */
    addUserMarker(location) {
        // Create a larger, more visible user location marker
        this.userMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: '#6366f1',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 5,
            },
            title: 'Your Location',
            zIndex: 1000,
            animation: google.maps.Animation.BOUNCE
        });

        // Stop bouncing after 2 seconds
        setTimeout(() => {
            this.userMarker.setAnimation(null);
        }, 2000);

        // Add a pulsing circle around user location
        this.pulseCircle = new google.maps.Circle({
            strokeColor: '#6366f1',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#6366f1',
            fillOpacity: 0.2,
            map: this.map,
            center: location,
            radius: 100, // 100 meters
            zIndex: 999
        });
    },

    /**
     * Clear all restaurant markers
     */
    clearMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    },

    /**
     * Add restaurant markers to the map - enhanced visibility
     */
    addMarkers(restaurants) {
        this.clearMarkers();

        restaurants.forEach(restaurant => {
            const cuisine = CONFIG.getCuisineById(restaurant.cuisineType);
            const markerColor = cuisine ? cuisine.color : '#ec4899';

            // Create custom SVG pin icon for better visibility
            const pinIcon = {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: markerColor,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 2.5,
                anchor: new google.maps.Point(12, 22),
            };

            const marker = new google.maps.Marker({
                position: restaurant.location,
                map: this.map,
                title: restaurant.name,
                icon: pinIcon,
                animation: google.maps.Animation.DROP,
                zIndex: 100
            });

            // Add click listener for info window
            marker.addListener('click', () => {
                const content = this.getInfoWindowContent(restaurant);
                this.infoWindow.setContent(content);
                this.infoWindow.open(this.map, marker);

                // Highlight marker when clicked
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 700);
            });

            this.markers.push(marker);
            restaurant.marker = marker;
        });

        // Fit map to show all markers
        this.fitBounds(restaurants);
    },

    /**
     * Get info window HTML content
     */
    getInfoWindowContent(restaurant) {
        const ratingStars = '⭐'.repeat(Math.round(restaurant.rating || 0));
        const cuisine = CONFIG.getCuisineById(restaurant.cuisineType);

        const photoHTML = restaurant.photo
            ? `<img src="${restaurant.photo}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" alt="${restaurant.name}">`
            : `<div style="width: 100%; height: 150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">${cuisine?.emoji || '🍽️'}</div>`;

        return `
      <div style="padding: 0; max-width: 280px; color: #1e293b;">
        ${photoHTML}
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">${restaurant.name}</h3>
          <div style="margin-bottom: 4px;">
            <span style="color: #f59e0b; font-weight: bold;">${ratingStars} ${restaurant.rating || 'N/A'}</span>
          </div>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">${restaurant.address || 'Address not available'}</p>
          ${restaurant.priceLevel ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;">Price: ${'$'.repeat(restaurant.priceLevel)}</p>` : ''}
        </div>
      </div>
    `;
    },

    /**
     * Fit map bounds to show all restaurants and user location
     */
    fitBounds(restaurants) {
        if (restaurants.length === 0) return;

        const bounds = new google.maps.LatLngBounds();

        // Include user location
        bounds.extend(this.userLocation);

        // Include all restaurant locations
        restaurants.forEach(restaurant => {
            bounds.extend(restaurant.location);
        });

        this.map.fitBounds(bounds);
    },

    /**
     * Center map on user location
     */
    centerOnUser() {
        if (this.userLocation) {
            this.map.setCenter(this.userLocation);
            this.map.setZoom(CONFIG.MAP_CONFIG.zoom);
        }
    }
};
