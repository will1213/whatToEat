# What to Eat - Restaurant Finder

A beautiful web application that helps you find restaurants near you using Google Maps. Filter by cuisine type or explore all nearby options.

## ✨ Features

- 🗺️ **Interactive Map** - Google Maps integration with custom dark theme
- 🍕 **Cuisine Filters** - Search by Italian, Chinese, Japanese, Mexican, and more
- 📍 **Location-Based** - Automatically finds restaurants near you
- 🎨 **Modern UI** - Beautiful dark mode with glassmorphism effects
- 📱 **Responsive** - Works great on desktop, tablet, and mobile
- 🔄 **Toggle Modes** - Switch between filtered and explore modes

## 🚀 Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
4. Go to "Credentials" and create an API key
5. (Optional but recommended) Restrict your API key:
   - Application restrictions: HTTP referrers
   - API restrictions: Maps JavaScript API, Places API

### 2. Configure the Application

**Option A: Using Local Config (Recommended for GitHub)**

1. Copy `config.local.example.js` to `config.local.js`:
   ```bash
   copy config.local.example.js config.local.js
   ```
2. Open `config.local.js` and replace `YOUR_API_KEY_HERE` with your actual API key

**Option B: Direct Configuration**

1. Open `config.js`
2. Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key

> **Note**: `config.local.js` is git-ignored, so your API key stays private!

### 3. Run the Application

Simply open `index.html` in a modern web browser:

- **Double-click** `index.html`, or
- **Right-click** → Open with → Your preferred browser, or
- Use a local development server:
  ```bash
  # Python 3
  python -m http.server 8000
  
  # Node.js (with npx)
  npx serve
  ```

Then visit `http://localhost:8000` in your browser.

## 📖 How to Use

### Landing Screen
1. **Select Cuisines** - Click on cuisine cards to select what you're craving
2. **Search** - Click "Search Restaurants" to find filtered results
3. **Explore** - Or click "Explore Map" to browse all nearby restaurants

### Results View
- **View Restaurants** - See list of restaurants with ratings and distance
- **Click Cards** - Click restaurant cards to see location on map
- **Toggle Mode** - Switch between filtered and "show all" modes
- **Go Back** - Return to landing screen to change selections

## 🎨 Customization

### Add More Cuisines

Edit `config.js` and add new entries to `CUISINE_TYPES`:

```javascript
{
  id: 'spanish',
  name: 'Spanish',
  emoji: '🥘',
  color: '#e74c3c',
  googleType: 'spanish_restaurant',
  keywords: ['spanish', 'paella', 'tapas'],
  popular: true
}
```

### Adjust Search Radius

In `config.js`, modify:
```javascript
searchRadius: 5000, // Change to desired radius in meters
```

### Change Default Location

Update the fallback location in `config.js`:
```javascript
defaultCenter: { lat: YOUR_LAT, lng: YOUR_LNG },
```

## 📁 File Structure

```
whatToEat/
├── index.html           # Main HTML structure
├── styles.css           # All styling and animations
├── config.js            # Configuration and cuisine data
├── app.js               # Main application logic
├── mapHandler.js        # Google Maps integration
├── restaurantService.js # Places API calls
├── filterManager.js     # Filter state management
├── uiManager.js         # UI rendering and updates
└── README.md            # This file
```

## 🔧 Troubleshooting

### "Google Maps API key not configured" error
- Make sure you've added your API key to `config.js`
- Check that you've enabled Maps JavaScript API and Places API
- Verify your API key is valid

### Location permission denied
- The app will fall back to a default location (New York City)
- Grant location permission in your browser for better results
- Check browser settings: Privacy & Security → Location

### No restaurants found
- Try a different cuisine or use explore mode
- Increase search radius in `config.js`
- Make sure you're in an area with restaurants

### API quota exceeded
- Google Maps has a free tier with usage limits
- Check your usage in Google Cloud Console
- Consider setting up billing for higher limits

## 📱 Future Mobile App

This web app is designed with mobile app migration in mind:

- **Responsive Design** - Mobile-first CSS
- **Modular Code** - Easy to port to React Native
- **Clean Architecture** - Separation of concerns
- **Touch-Optimized** - Large tap targets and gestures

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Credits

- Google Maps Platform for mapping and places data
- Built with vanilla JavaScript, HTML, and CSS
- Icons: Emoji (native)
