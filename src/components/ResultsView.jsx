import { useRef, useEffect } from 'react';
import RestaurantCard from './RestaurantCard';
import CONFIG from '../config';

const ResultsView = ({
    restaurants,
    loading,
    error,
    onBack,
    onPickOne,
    onToggleMode,
    isExploreMode,
    userLocation,
    resultsTitle,
    resultsCount,
    onRestaurantClick,
    selectedRestaurantId,
    onErrorClose,
    onLocationChange
}) => {
    const listRef = useRef(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);

    const infoWindowRef = useRef(null);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        if (!mapInstanceRef.current && userLocation) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: userLocation,
                zoom: CONFIG.MAP_CONFIG.zoom,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            infoWindowRef.current = new window.google.maps.InfoWindow();
        }
    }, [userLocation]);

    // Update User Marker
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation || !window.google) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(userLocation);
        } else {
            userMarkerRef.current = new window.google.maps.Marker({
                position: userLocation,
                map: mapInstanceRef.current,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                },
                title: "You are here",
                zIndex: 999
            });
        }
    }, [userLocation]);

    // Map Click Listener
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const listener = mapInstanceRef.current.addListener('click', (e) => {
            if (onLocationChange && e.latLng) {
                onLocationChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
        });

        return () => {
            window.google.maps.event.removeListener(listener);
        };
    }, [userLocation, onLocationChange]);

    // Update Markers when restaurants change
    useEffect(() => {
        if (!mapInstanceRef.current || !window.google) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Close info window if open
        if (infoWindowRef.current) infoWindowRef.current.close();

        // Add new markers
        const bounds = new window.google.maps.LatLngBounds();
        if (userLocation) {
            bounds.extend(userLocation);
        }

        restaurants.forEach(restaurant => {
            const marker = new window.google.maps.Marker({
                position: restaurant.location,
                map: mapInstanceRef.current,
                title: restaurant.name,
                animation: window.google.maps.Animation.DROP
            });

            // Attach ID for lookup
            marker.placeId = restaurant.placeId;

            marker.addListener('click', () => {
                onRestaurantClick(restaurant);
            });

            markersRef.current.push(marker);
            bounds.extend(restaurant.location);
        });

        // Fit bounds if we have results
        if (restaurants.length > 0) {
            mapInstanceRef.current.fitBounds(bounds);
            // Don't zoom in too close
            const listener = window.google.maps.event.addListener(mapInstanceRef.current, "idle", () => {
                if (mapInstanceRef.current.getZoom() > 16) mapInstanceRef.current.setZoom(16);
                window.google.maps.event.removeListener(listener);
            });
        } else if (userLocation) {
            mapInstanceRef.current.setCenter(userLocation);
            mapInstanceRef.current.setZoom(CONFIG.MAP_CONFIG.zoom);
        }

    }, [restaurants, userLocation, onRestaurantClick]);

    // Highlight selected restaurant on map and Show InfoWindow
    useEffect(() => {
        if (!selectedRestaurantId || !mapInstanceRef.current || !infoWindowRef.current) return;

        const restaurant = restaurants.find(r => r.placeId === selectedRestaurantId);
        const marker = markersRef.current.find(m => m.placeId === selectedRestaurantId);

        if (restaurant && marker) {
            mapInstanceRef.current.panTo(restaurant.location);
            mapInstanceRef.current.setZoom(17);

            const cuisine = CONFIG.getCuisineById(restaurant.cuisineType);
            const imageHtml = restaurant.photo
                ? `<img src="${restaurant.photo}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px; display: block;" alt="${restaurant.name}" />`
                : (cuisine ? `<div style="width: 100%; height: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 8px; border-radius: 4px;">${cuisine.emoji}</div>` : '');

            const content = `
                <div style="padding: 0; color: #333; max-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    ${imageHtml}
                    <div style="padding: 4px;">
                        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${restaurant.name}</h3>
                        <p style="margin: 0 0 4px; font-size: 13px; color: #666;">${restaurant.address || restaurant.vicinity || ''}</p>
                        <div style="font-weight: 500; font-size: 13px; display: flex; align-items: center;">
                            <span style="color: #f1c40f; margin-right: 4px;">${restaurant.rating ? '⭐'.repeat(Math.round(restaurant.rating)) : ''}</span>
                            <span>${restaurant.rating || ''}</span> 
                            <span style="color: #999; margin-left: 4px;">${restaurant.userRatingsTotal ? '(' + restaurant.userRatingsTotal + ')' : ''}</span>
                        </div>
                    </div>
                </div>
            `;

            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
    }, [selectedRestaurantId, restaurants]);


    return (
        <div className="results-view">
            <nav className="top-nav">
                <div className="nav-content">
                    <button className="btn-back" onClick={onBack}>
                        <span></span> Back
                    </button>
                    <h1 className="nav-title">What to Eat</h1>
                    <div className="nav-actions">
                        <button className="btn btn-pick-one" onClick={onPickOne} disabled={restaurants.length === 0}>
                            Pick One
                        </button>
                        <button className="btn-toggle" onClick={onToggleMode}>
                            <span id="modeToggleText">{isExploreMode ? 'Show Filters' : 'Show All'}</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div id="map" className="map-container" ref={mapRef}></div>

                <div className="restaurant-panel">
                    <div className="panel-header">
                        <h2 id="resultsTitle">{resultsTitle}</h2>
                        <span id="resultsCount" className="results-count">{resultsCount} results</span>
                    </div>

                    <div id="restaurantList" className="restaurant-list" ref={listRef}>
                        {loading && (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Finding restaurants near you...</p>
                            </div>
                        )}

                        {!loading && restaurants.length === 0 && (
                            <div className="empty-state">
                                <span className="empty-icon"></span>
                                <p>No restaurants found</p>
                                <small>Try adjusting your filters or location</small>
                            </div>
                        )}

                        {!loading && restaurants.map(restaurant => (
                            <RestaurantCard
                                key={restaurant.placeId}
                                restaurant={restaurant}
                                isSelected={restaurant.placeId === selectedRestaurantId}
                                onClick={() => onRestaurantClick(restaurant)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="modal">
                    <div className="modal-content">
                        <h3 className="modal-title">Error</h3>
                        <p className="modal-message">{error}</p>
                        <button className="btn btn-primary" onClick={onErrorClose}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsView;
