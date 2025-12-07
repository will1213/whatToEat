// Local configuration template
// Copy this to config.local.js and add your actual API key

const LOCAL_CONFIG = {
    GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE'
};

if (typeof CONFIG !== 'undefined') {
    Object.assign(CONFIG, LOCAL_CONFIG);
}
