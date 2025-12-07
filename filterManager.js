// Filter Manager - Handles cuisine filtering logic
const FilterManager = {
    selectedCuisines: new Set(),
    isExploreMode: false,
    searchText: '',
    openNowOnly: false,

    /**
     * Initialize filter manager
     */
    init() {
        this.selectedCuisines.clear();
        this.isExploreMode = false;
        this.searchText = '';
        this.openNowOnly = false;
    },

    /**
     * Toggle cuisine selection
     */
    toggleCuisine(cuisineId) {
        if (this.selectedCuisines.has(cuisineId)) {
            this.selectedCuisines.delete(cuisineId);
        } else {
            this.selectedCuisines.add(cuisineId);
        }
    },

    /**
     * Select a cuisine
     */
    selectCuisine(cuisineId) {
        this.selectedCuisines.add(cuisineId);
    },

    /**
     * Deselect a cuisine
     */
    deselectCuisine(cuisineId) {
        this.selectedCuisines.delete(cuisineId);
    },

    /**
     * Clear all selections
     */
    clearSelections() {
        this.selectedCuisines.clear();
    },

    /**
     * Get selected cuisine IDs as array
     */
    getSelectedCuisines() {
        return Array.from(this.selectedCuisines);
    },

    /**
     * Check if any cuisines are selected
     */
    hasSelections() {
        return this.selectedCuisines.size > 0;
    },

    /**
     * Set explore mode
     */
    setExploreMode(isExplore) {
        this.isExploreMode = isExplore;
    },

    /**
     * Toggle explore mode
     */
    toggleExploreMode() {
        this.isExploreMode = !this.isExploreMode;
        return this.isExploreMode;
    },

    /**
     * Set search text
     */
    setSearchText(text) {
        this.searchText = text.trim();
    },

    /**
     * Get search text
     */
    getSearchText() {
        return this.searchText;
    },

    /**
     * Check if search text is set
     */
    hasSearchText() {
        return this.searchText.length > 0;
    },

    /**
     * Clear search text
     */
    clearSearchText() {
        this.searchText = '';
    },

    /**
     * Set open now filter
     */
    setOpenNow(value) {
        this.openNowOnly = value;
    },

    /**
     * Check if open now filter is enabled
     */
    isOpenNowEnabled() {
        return this.openNowOnly;
    },

    /**
     * Clear open now filter
     */
    clearOpenNow() {
        this.openNowOnly = false;
    },

    /**
     * Check if in explore mode
     */
    isInExploreMode() {
        return this.isExploreMode;
    },

    /**
     * Filter restaurants by selected cuisines (client-side)
     */
    filterRestaurants(restaurants) {
        let filtered = restaurants;

        // Filter by cuisine if not in explore mode
        if (!this.isExploreMode && this.hasSelections()) {
            filtered = filtered.filter(restaurant => {
                return this.selectedCuisines.has(restaurant.cuisineType);
            });
        }

        // Filter by open now if enabled
        if (this.openNowOnly) {
            filtered = filtered.filter(restaurant => {
                return restaurant.isOpen === true;
            });
        }

        return filtered;
    },

    /**
     * Get filter summary text
     */
    getFilterSummary() {
        if (this.isExploreMode) {
            return 'All Restaurants';
        }

        if (!this.hasSelections()) {
            return 'No filters selected';
        }

        const cuisineNames = this.getSelectedCuisines()
            .map(id => {
                const cuisine = CONFIG.getCuisineById(id);
                return cuisine ? cuisine.name : id;
            })
            .join(', ');

        return cuisineNames;
    },

    /**
     * Get current mode description
     */
    getModeDescription() {
        if (this.isExploreMode) {
            return 'Explore Mode - Showing all nearby restaurants';
        }

        if (this.hasSelections()) {
            const count = this.selectedCuisines.size;
            return `Guided Mode - Filtered by ${count} cuisine${count > 1 ? 's' : ''}`;
        }

        return 'Select cuisines to filter results';
    }
};
