// Preview Module - Main orchestration with new tab high-res view
// UPDATED: Simplified warning logic - removed red overlay complexity
// UPDATED: Added Google Sheets logging integration

// Generate preview function - main coordination logic
async function generatePreview() {
    try {
        console.log('🎨 Resetting preview state completely...');
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
        // Get DOM elements once at the top
        const previewSection = document.getElementById('previewSection');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const previewTitle = document.getElementById('previewTitle');
        
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const patternId = getSelectedPattern();
        const widthFeet = parseInt(document.getElementById('widthFeet').value) || 0;
        const widthInches = parseFloat(document.getElementById('widthInches').value) || 0;
        const heightFeet = parseInt(document.getElementById('heightFeet').value) || 0
