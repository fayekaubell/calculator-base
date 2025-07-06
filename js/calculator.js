// Calculator Module - UI coordination and initialization
// Data loading functions moved to pattern-data.js

// Initialize calculator
function initializeCalculator() {
    console.log('🚀 Initializing Wallpaper Calculator...');
    
    // Apply configuration to UI
    applyConfiguration();
    
    // Load patterns from CSV and populate dropdown
    loadAndPopulatePatterns();
}

// Apply configuration settings to the UI
function applyConfiguration() {
    if (!window.CONFIG) {
        console.error('Configuration not loaded');
        return;
    }
    
    const config = window.CONFIG;
    
    // Update page title and subtitle
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) {
        pageTitle.textContent = config.ui.text.pageTitle;
    }
    if (pageSubtitle) {
        pageSubtitle.textContent = config.ui.text.pageSubtitle;
    }
    
    // Update measuring guide
    const guide = config.ui.text.measuringGuide;
    const standardWallsGuide = document.getElementById('standardWallsGuide');
    const stairwayWallsGuide = document.getElementById('stairwayWallsGuide');
    const ceilingsGuide = document.getElementById('ceilingsGuide');
    const slopedCeilingsGuide = document.getElementById('slopedCeilingsGuide');
    const measuringNote = document.getElementById('measuringNote');
    
    if (standardWallsGuide) standardWallsGuide.textContent = guide.standardWalls;
    if (stairwayWallsGuide) stairwayWallsGuide.textContent = guide.stairwayWalls;
    if (ceilingsGuide) ceilingsGuide.textContent = guide.ceilings;
    if (slopedCeilingsGuide) slopedCeilingsGuide.textContent = guide.slopedCeilings;
    if (measuringNote) measuringNote.textContent = guide.note;
    
    // Update disclaimers
    const resultsDisclaimer = document.getElementById('resultsDisclaimer');
    if (resultsDisclaimer) {
        resultsDisclaimer.textContent = config.ui.text.disclaimers.results;
    }
}

// Load patterns and populate dropdown
async function loadAndPopulatePatterns() {
    try {
        // Load patterns from CSV (function now in pattern-data.js)
        await loadPatternsFromCSV();
        
        // Populate the dropdown
        populatePatternDropdown();
        
        // Hide loading message and show form
        hideLoadingMessage();
        
    } catch (error) {
        console.error('❌ Failed to load patterns:', error);
        showErrorMessage('Failed to load wallpaper patterns. Please refresh the page to try again.');
    }
}

// Populate pattern dropdown
function populatePatternDropdown() {
    const select = document.getElementById('pattern');
    
    if (!select) {
        console.error('Could not find pattern select element');
        return;
    }
    
    // Clear existing options (except the first placeholder)
    select.innerHTML = '<option value="">Choose a pattern...</option>';
    
    // Sort patterns alphabetically by name
    const sortedPatterns = Object.keys(patterns).sort((a, b) => {
        return patterns[a].name.localeCompare(patterns[b].name);
    });
    
    // Add pattern options
    sortedPatterns.forEach(patternId => {
        const pattern = patterns[patternId];
        const option = document.createElement('option');
        option.value = patternId;
        option.textContent = pattern.sku ? `${pattern.name} / ${pattern.sku}` : pattern.name;
        select.appendChild(option);
    });
    
    console.log(`📝 Populated dropdown with ${sortedPatterns.length} patterns`);
}

// Get selected pattern (utility function)
function getSelectedPattern() {
    const select = document.getElementById('pattern');
    return select ? select.value : '';
}

// Show/hide UI elements
function hideLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    const calculatorForm = document.getElementById('calculatorForm');
    
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    if (calculatorForm) {
        calculatorForm.style.display = 'block';
    }
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
}

// Export calculator API functions to global scope for compatibility
window.calculatorAPI = {
    getSelectedPattern,
    hideLoadingMessage,
    showErrorMessage
};
