import { useState } from 'react';
import CONFIG from '../config';

const LandingScreen = ({ onSearch, onExplore, onSurprise, onToggleOpenNow, openNow }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedCuisines, setSelectedCuisines] = useState(new Set());
    const [priceLevel, setPriceLevel] = useState(4); // Default to method max (all)

    const handleCuisineToggle = (id) => {
        const newSelection = new Set(selectedCuisines);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedCuisines(newSelection);
    };

    const handleSearchClick = () => {
        onSearch({
            text: searchText,
            cuisines: Array.from(selectedCuisines),
            openNow,
            maxPrice: priceLevel < 4 ? priceLevel : null // If 4 (MAX), send null to imply all. 
        });
    };

    const isSearchDisabled = searchText.length === 0 && selectedCuisines.size === 0;

    const getPriceLabel = (level) => {
        switch (level) {
            case 1: return "$ (Cheap)";
            case 2: return "$$ (Moderate)";
            case 3: return "$$$ (Expensive)";
            case 4: return "$$$$ (Very Expensive)";
            default: return "Any";
        }
    };

    return (
        <div className="landing-screen">
            <div className="landing-container">
                <header className="landing-header">
                    <h1 className="landing-title">What to Eat?</h1>
                    <p className="landing-subtitle">Find amazing restaurants near you</p>
                </header>

                <div className="search-section">
                    <h2 className="section-title">Search for specific food</h2>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="e.g., pizza, sushi, tacos, burgers..."
                            autoComplete="off"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isSearchDisabled && handleSearchClick()}
                        />
                        <span className="search-icon" onClick={() => !isSearchDisabled && handleSearchClick()}>🔍</span>
                    </div>
                    <p className="search-hint">Or select from popular cuisines below</p>

                    <div className="filter-options">
                        <label className="toggle-container">
                            <input
                                type="checkbox"
                                className="toggle-checkbox"
                                checked={openNow}
                                onChange={(e) => onToggleOpenNow(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-label">⏰ Open Now Only</span>
                        </label>

                        <div className="budget-filter" style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>Max Budget:</span>
                            <input
                                type="range"
                                min="1"
                                max="4"
                                step="1"
                                value={priceLevel}
                                onChange={(e) => setPriceLevel(parseInt(e.target.value))}
                                style={{ accentColor: '#ff6b6b', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '600', minWidth: '80px', fontSize: '0.9rem' }}>{getPriceLabel(priceLevel)}</span>
                        </div>
                    </div>
                </div>

                <div className="cuisine-selection">
                    <h2 className="section-title">Popular Cuisines</h2>
                    <div className="cuisine-grid">
                        {CONFIG.getPopularCuisines().map((cuisine) => (
                            <div
                                key={cuisine.id}
                                className={`cuisine-card ${selectedCuisines.has(cuisine.id) ? 'selected' : ''}`}
                                style={{ '--cuisine-color': cuisine.color }}
                                onClick={() => handleCuisineToggle(cuisine.id)}
                            >
                                <div className="cuisine-emoji">{cuisine.emoji}</div>
                                <div className="cuisine-name">{cuisine.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        className="btn btn-primary"
                        disabled={isSearchDisabled}
                        onClick={handleSearchClick}
                    >
                        <span className="btn-icon">🔍</span>
                        Search Restaurants
                    </button>
                    <button className="btn btn-surprise" onClick={onSurprise}>
                        <span className="btn-icon">🎲</span>
                        Surprise Me!
                    </button>
                    <button className="btn btn-secondary" onClick={onExplore}>
                        <span className="btn-icon">🗺️</span>
                        Explore Map
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingScreen;
