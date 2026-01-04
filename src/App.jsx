import { useState, useEffect, useCallback } from 'react'
import CONFIG from './config'
import RestaurantService from './services/restaurantService'
import LandingScreen from './components/LandingScreen'
import ResultsView from './components/ResultsView'
import './index.css'

function App() {
  const [view, setView] = useState('landing');
  const [userLocation, setUserLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Filter State
  const [openNow, setOpenNow] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [isExploreMode, setIsExploreMode] = useState(false);

  // Selection
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // Load Maps API
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Get API Key from Config (loaded from env)
        const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          setError("Google Maps API Key is missing. Please check your .env configuration.");
          return;
        }

        // 2. Load Map Script
        if (window.google && window.google.maps) {
          setIsMapLoaded(true);
          return;
        }

        // Check for existing script
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsMapLoaded(true);
        script.onerror = () => setError("Failed to load Google Maps script");
        document.head.appendChild(script);

      } catch (err) {
        console.error("Init failed", err);
        setError("Failed to initialize application configuration");
      }
    };

    initApp();
  }, []);

  // Get Location helper
  const ensureLocation = async () => {
    if (userLocation) return userLocation;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          resolve(loc);
        },
        (err) => {
          console.error("Geolocation error or timeout", err);
          // Fallback
          const fallback = CONFIG.MAP_CONFIG.defaultCenter;
          setUserLocation(fallback);
          setError("Location access denied or timed out. Using default location.");
          resolve(fallback);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  };

  const performSearch = async (loc, text, cuisines, explore, priceLimit) => {
    if (!window.google || !isMapLoaded) {
      setError("Google Maps API is not loaded yet. Please wait.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let results;
      if (text) {
        results = await RestaurantService.searchNearby(loc, null, text, priceLimit);
      } else if (explore) {
        results = await RestaurantService.searchNearby(loc, null, '', priceLimit); // All
      } else if (cuisines && cuisines.length > 0) {
        results = await RestaurantService.searchNearby(loc, cuisines, '', priceLimit);
      } else {
        // Default fallback
        results = await RestaurantService.searchNearby(loc, null, '', priceLimit);
      }

      // Client-side filtering for Open Now (as Places API open_now param is deprecated or we want consistent behavior)
      if (openNow) {
        results = results.filter(r => r.isOpen);
      }

      // Calculate distance
      results.forEach(r => {
        r.distance = RestaurantService.calculateDistance(loc.lat, loc.lng, r.location.lat, r.location.lng);
        r.distanceText = RestaurantService.formatDistance(r.distance);
      });

      // Smart Sorting: If budget is set, prioritize Rating. Otherwise Distance.
      if (priceLimit) {
        results.sort((a, b) => {
          // Sort by Rating Descending
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
          // Secondary: Distance Ascending
          return a.distance - b.distance;
        });
      } else {
        results.sort((a, b) => a.distance - b.distance);
      }

      setRestaurants(results);
      if (results.length === 0 && !error) {
        // results view handles empty state
      }
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params) => {
    try {
      const { text, cuisines, openNow: openNowParam, maxPrice: priceParam } = params;
      setSearchText(text);
      setSelectedCuisines(cuisines);
      setOpenNow(openNowParam);
      setMaxPrice(priceParam);
      setIsExploreMode(false);

      const loc = await ensureLocation();
      setView('results');
      performSearch(loc, text, cuisines, false, priceParam);
    } catch (err) {
      console.error("Search Handler failed", err);
      setError("Failed to start search");
    }
  };

  const handleExplore = async () => {
    try {
      setIsExploreMode(true);
      // Clear filters
      setSearchText('');
      setSelectedCuisines([]);
      setMaxPrice(null);

      const loc = await ensureLocation();
      setView('results');
      performSearch(loc, null, null, true, null);
    } catch (err) {
      console.error("Explore Handler failed", err);
      setError("Failed to start explore mode");
    }
  };

  const handleSurprise = async () => {
    const allCuisines = CONFIG.getAllCuisines();
    const numToSelect = Math.random() < 0.7 ? 1 : 2;
    const shuffled = [...allCuisines].sort(() => 0.5 - Math.random());
    const randomCuisines = shuffled.slice(0, numToSelect);
    const ids = randomCuisines.map(c => c.id);

    // Update state to reflect selection (so if they go back, it's there? Legacy did this)
    setSelectedCuisines(ids);
    setSearchText('');
    setOpenNow(false);
    setMaxPrice(null);
    setIsExploreMode(false);

    const loc = await ensureLocation();
    setView('results');
    performSearch(loc, null, ids, false, null);
  };

  const handleBack = () => {
    setView('landing');
    setRestaurants([]);
    setSelectedRestaurantId(null);
  };

  const handlePickOne = () => {
    if (restaurants.length === 0) return;
    const random = restaurants[Math.floor(Math.random() * restaurants.length)];
    handleRestaurantClick(random);
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurantId(restaurant.placeId);
    // Scroll to logic is in ResultsView effect
  };

  const handleToggleMode = () => {
    const newMode = !isExploreMode;
    setIsExploreMode(newMode);
    if (newMode) {
      performSearch(userLocation, null, null, true, maxPrice);
    } else {
      // Guided: use existing filters
      performSearch(userLocation, searchText, selectedCuisines, false, maxPrice);
    }
  };

  // Compute results title
  let title = "Nearby Restaurants";
  if (searchText) {
    title = `"${searchText}" Restaurants`;
  } else if (isExploreMode) {
    title = "All Nearby Restaurants";
  } else if (selectedCuisines.length > 0) {
    // Summary logic
    const names = selectedCuisines.map(id => CONFIG.getCuisineById(id)?.name).join(', ');
    title = `${names} Restaurants`;
  }

  const handleLocationUpdate = (newLoc) => {
    setUserLocation(newLoc);
    // Re-run search with current parameters but new location
    performSearch(newLoc, searchText, selectedCuisines, isExploreMode, maxPrice);
  };

  return (
    <div className="app-container">
      {view === 'landing' ? (
        <LandingScreen
          onSearch={handleSearch}
          onExplore={handleExplore}
          onSurprise={handleSurprise}
          openNow={openNow}
          onToggleOpenNow={setOpenNow}
        />
      ) : (
        <ResultsView
          restaurants={restaurants}
          loading={loading}
          error={error}
          onBack={handleBack}
          onPickOne={handlePickOne}
          onToggleMode={handleToggleMode}
          isExploreMode={isExploreMode}
          userLocation={userLocation}
          resultsTitle={title}
          resultsCount={restaurants.length}
          onRestaurantClick={handleRestaurantClick}
          selectedRestaurantId={selectedRestaurantId}
          onErrorClose={() => setError(null)}
          onLocationChange={handleLocationUpdate}
        />
      )}
    </div>
  )
}

export default App
