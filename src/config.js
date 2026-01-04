// Application Configuration
const CONFIG = {
    // Google Maps API Configuration
    // Key is fetched from environment variable (Vite)
    GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null,

    setApiKey(key) {
        this.GOOGLE_MAPS_API_KEY = key;
    },

    // Map Settings
    MAP_CONFIG: {
        zoom: 14,
        defaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York City (fallback)
        searchRadius: 5000, // 5km radius for nearby search
        maxResults: 20
    },

    // Cuisine Types with Display Data
    CUISINE_TYPES: [
        {
            id: 'italian',
            name: 'Italian',
            emoji: '🍝',
            color: '#e74c3c',
            googleType: 'italian_restaurant',
            keywords: ['pizza', 'pasta', 'italian'],
            popular: true
        },
        {
            id: 'chinese',
            name: 'Chinese',
            emoji: '🥢',
            color: '#f39c12',
            googleType: 'chinese_restaurant',
            keywords: ['chinese', 'dim sum'],
            popular: true
        },
        {
            id: 'japanese',
            name: 'Japanese',
            emoji: '🍣',
            color: '#e67e22',
            googleType: 'japanese_restaurant',
            keywords: ['sushi', 'ramen', 'japanese'],
            popular: true
        },
        {
            id: 'mexican',
            name: 'Mexican',
            emoji: '🌮',
            color: '#27ae60',
            googleType: 'mexican_restaurant',
            keywords: ['mexican', 'tacos', 'burrito'],
            popular: true
        },
        {
            id: 'indian',
            name: 'Indian',
            emoji: '🍛',
            color: '#d35400',
            googleType: 'indian_restaurant',
            keywords: ['indian', 'curry'],
            popular: true
        },
        {
            id: 'thai',
            name: 'Thai',
            emoji: '🍜',
            color: '#16a085',
            googleType: 'thai_restaurant',
            keywords: ['thai', 'pad thai'],
            popular: true
        },
        {
            id: 'american',
            name: 'American',
            emoji: '🍔',
            color: '#3498db',
            googleType: 'american_restaurant',
            keywords: ['burger', 'american', 'bbq'],
            popular: true
        },
        {
            id: 'mediterranean',
            name: 'Mediterranean',
            emoji: '🥙',
            color: '#9b59b6',
            googleType: 'mediterranean_restaurant',
            keywords: ['mediterranean', 'greek', 'falafel'],
            popular: true
        },
        {
            id: 'korean',
            name: 'Korean',
            emoji: '🍲',
            color: '#e91e63',
            googleType: 'korean_restaurant',
            keywords: ['korean', 'bbq', 'kimchi'],
            popular: false
        },
        {
            id: 'french',
            name: 'French',
            emoji: '🥐',
            color: '#8e44ad',
            googleType: 'french_restaurant',
            keywords: ['french', 'bistro'],
            popular: false
        },
        {
            id: 'seafood',
            name: 'Seafood',
            emoji: '🦞',
            color: '#1abc9c',
            googleType: 'seafood_restaurant',
            keywords: ['seafood', 'fish'],
            popular: false
        },
        {
            id: 'vietnamese',
            name: 'Vietnamese',
            emoji: '🍲',
            color: '#2ecc71',
            googleType: 'vietnamese_restaurant',
            keywords: ['vietnamese', 'pho'],
            popular: false
        }
    ],

    // Get popular cuisines only
    getPopularCuisines() {
        return this.CUISINE_TYPES.filter(c => c.popular);
    },

    // Get all cuisines
    getAllCuisines() {
        return this.CUISINE_TYPES;
    },

    // Get cuisine by ID
    getCuisineById(id) {
        return this.CUISINE_TYPES.find(c => c.id === id);
    }
};

export default CONFIG;
