// Main Calculator Logic

// Global variables
let patterns = {};
let patternsLoaded = false;
let currentPreview = null;
let patternImage = null;
let imageLoaded = false;

// Initialize calculator
function initializeCalculator() {
    console.log('🚀 Initializing Wallpaper Calculator...');
    
    // Apply configuration to UI
    applyConfiguration();
    
    // Load patterns from CSV
    loadPatternsFromCSV();
}

// Apply configuration settings to the UI
function applyConfiguration() {
    if (!window.CONFIG) {
        console.error('Configuration not loaded');
        return;
    }
    
    const config = window.CONFIG;
    
    // Update page title and subtitle
    document.getElementById('pageTitle').textContent = config.ui.text.pageTitle;
    document.getElementById('pageSubtitle').textContent = config.ui.text.pageSubtitle;
    
    // Update measuring guide
    const guide = config.ui.text.measuringGuide;
    document.getElementById('standardWallsGuide').textContent = guide.standardWalls;
    document.getElementById('stairwayWallsGuide').textContent = guide.stairwayWalls;
    document.getElementById('ceilingsGuide').textContent = guide.ceilings;
    document.getElementById('slopedCeilingsGuide').textContent = guide.slopedCeilings;
    document.getElementById('measuringNote').textContent = guide.note.replace('info@fayebell.com', config.business.email);
    
    // Update disclaimers
    document.getElementById('resultsDisclaimer').textContent = config.ui.text.disclaimers.results;
    
    // Set up reCAPTCHA if enabled
    if (config.quotes.requireCaptcha && config.google.recaptchaSiteKey) {
        document.querySelector('.g-recaptcha').setAttribute('data-sitekey', config.google.recaptchaSiteKey);
    } else {
        document.getElementById('captchaGroup').style.display = 'none';
    }
    
    // Hide quote form if disabled
    if (!config.quotes.enabled) {
        document.querySelector('.btn-success').style.display = 'none';
    }
}

// Load patterns from CSV file
async function loadPatternsFromCSV() {
    try {
        console.log('📊 Loading patterns from CSV...');
        
        const response = await fetch(CONFIG.data.patternsCSV);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('📄 CSV loaded, parsing...');
        
        // Parse CSV using Papa Parse
        const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
        });
        
        if (parsed.errors.length > 0) {
            console.warn('⚠️ CSV parsing warnings:', parsed.errors);
        }
        
        console.log('📋 CSV parsed successfully:', parsed.data.length, 'patterns found');
        
        // Convert CSV data to pattern objects
        patterns = {};
        parsed.data.forEach((row, index) => {
            try {
                const pattern = createPatternFromCSV(row);
                if (pattern) {
                    patterns[pattern.id] = pattern;
                    console.log(`✅ Created pattern ${pattern.id}:`, pattern.name);
                }
            } catch (error) {
                console.error(`❌ Error processing pattern at row ${index + 1}:`, error, row);
            }
        });
        
        patternsLoaded = true;
        populatePatternDropdown();
        hideLoadingMessage();
        console.log(`🎉 Total patterns loaded: ${Object.keys(patterns).length}`);
        
    } catch (error) {
        console.error('❌ Error loading patterns from CSV:', error);
        showErrorMessage('Failed to load wallpaper patterns. Please refresh the page to try again.');
        
        // Fall back to demo pattern
        patterns = {
            'demo-pattern': {
                id: 'demo-pattern',
                name: 'Demo Pattern',
                sku: 'DEMO-001',
                repeatWidth: 108,
                repeatHeight: 144,
                hasRepeatHeight: true,
                panelWidth: 54,
                availableLengths: [9, 12, 15],
                minOverage: 4,
                saleType: 'panel',
                panelSequence: 'AB',
                sequenceLength: 2,
                imageUrl: '',
                thumbnailUrl: ''
            }
        };
        patternsLoaded = true;
        populatePatternDropdown();
        hideLoadingMessage();
    }
}

// Create pattern object from CSV row
function createPatternFromCSV(row) {
    if (!row.pattern_name || !row.sku) {
        console.warn('⚠️ Skipping row with missing required fields:', row);
        return null;
    }
    
    const defaults = CONFIG.calculator.defaults;
    
    // Create pattern ID from SKU
    const patternId = row.sku.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    
    // Parse available lengths
    const availableLengthsStr = row.available_lengths_feet || '';
    const availableLengths = availableLengthsStr ? 
        availableLengthsStr.split(',').map(l => parseInt(l.trim())).filter(l => !isNaN(l)) :
        defaults.availableLengths;
    
    // Parse panel sequence
    const panelSequence = row.panel_sequence || 'AB';
    const sequenceLength = panelSequence.length;
    
    // Handle repeat height - check for "none" values
    const repeatHeightValue = row.repeat_height_inches;
    let repeatHeight = 144;
    let hasRepeatHeight = true;
    
    if (repeatHeightValue === 'none' || repeatHeightValue === 'None' || repeatHeightValue === 'NONE') {
        hasRepeatHeight = false;
        repeatHeight = 144; // Keep a default for calculations
    } else {
        repeatHeight = parseFloat(repeatHeightValue) || 144;
    }
    
    // Determine image URL
    let imageUrl = '';
    let thumbnailUrl = '';
    
    if (row.repeat_url) {
        imageUrl = row.repeat_url;
        thumbnailUrl = row.repeat_url;
    } else {
        // Try to construct from filename
        const filename = row.sku.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-') + '.jpg';
        imageUrl = CONFIG.data.imageBaseUrl + filename;
        thumbnailUrl = imageUrl;
    }
    
    return {
        id: patternId,
        name: row.pattern_name,
        sku: row.sku,
        repeatWidth: parseFloat(row.repeat_width_inches) || 108,
        repeatHeight: repeatHeight,
        hasRepeatHeight: hasRepeatHeight,
        minOverage: defaults.minOverage,
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
        saleType: row.sale_type || 'panel',
        panelWidth: parseFloat(row.material_width_inches) || defaults.panelWidth,
        availableLengths: availableLengths,
        panelSequence: panelSequence,
        sequenceLength: sequenceLength,
        rollWidth: row.sale_type === 'yard' ? defaults.rollWidth : null,
        minYardOrder: row.sale_type === 'yard' ? (row.min_yard_order || defaults.minYardOrder) : null,
        patternMatch: row.pattern_match || 'straight',
        productDescription: '',
        tearsheetUrl: '',
        view360Url: '',
        handle: patternId
    };
}

// Show/hide UI elements
function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('calculatorForm').style.display = 'block';
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('loadingMessage').style.display = 'none';
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

// Get selected pattern (compatibility function)
function getSelectedPattern() {
    const select = document.getElementById('pattern');
    return select ? select.value : '';
}

// Preload pattern images with CORS handling
function preloadPatternImage(pattern) {
    return new Promise((resolve, reject) => {
        if (!pattern.imageUrl) {
            resolve(null);
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.error('Failed to load pattern image with CORS');
            // Try without CORS
            const fallbackImg = new Image();
            fallbackImg.onload = function() {
                patternImage = fallbackImg;
                imageLoaded = true;
                resolve(fallbackImg);
            };
            fallbackImg.onerror = function() {
                console.error('Failed to load pattern image completely');
                resolve(null);
            };
            fallbackImg.src = pattern.imageUrl;
        };
        
        img.src = pattern.imageUrl;
    });
}

// Calculate panel requirements
function calculatePanelRequirements(pattern, wallWidth, wallHeight) {
    // Safety check
    if (!pattern || !pattern.saleType) {
        console.error('Invalid pattern data');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'panel'
        };
    }
    
    // If it's a yard-based pattern, use the yard calculation
    if (pattern.saleType === 'yard') {
        return calculateYardRequirements(pattern, wallWidth, wallHeight);
    }
    
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    console.log('🔢 Panel calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: pattern.minOverage,
        totalWidth,
        totalHeight,
        totalHeightInFeet: totalHeight / 12,
        availableLengths: pattern.availableLengths
    });
    
    const panelsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    
    let panelLength = 0;
    console.log('📏 Looking for panel length that covers', totalHeight, 'inches (', totalHeight / 12, 'feet)');
    
    for (let length of pattern.availableLengths) {
        console.log(`  Checking length ${length}' (${length * 12}" total) vs needed ${totalHeight}"`);
        if (length * 12 >= totalHeight) {
            panelLength = length;
            console.log(`  ✅ Selected ${length}' panel length`);
            break;
        } else {
            console.log(`  ❌ ${length}' too short (${length * 12}" < ${totalHeight}")`);
        }
    }
    
    if (panelLength === 0) {
        const minLengthFeet = Math.ceil(totalHeight / 12);
        panelLength = Math.ceil(minLengthFeet / 3) * 3;
        console.log(`🎯 No standard length found, calculated custom length: ${panelLength}'`);
    }
    
    // Check for limitations
    const totalHeightNeeded = totalHeight;
    const exceedsLimit = totalHeightNeeded > (CONFIG.calculator.limits.maxPanelHeight * 12);
    const idealPanelLength = panelLength;
    const actualPanelLength = Math.min(panelLength, CONFIG.calculator.limits.maxPanelHeight);
    const uncoveredHeight = exceedsLimit ? totalHeightNeeded - (CONFIG.calculator.limits.maxPanelHeight * 12) : 0;
    
    console.log('📊 Final calculation result:', {
        panelsNeeded,
        idealPanelLength,
        actualPanelLength,
        exceedsLimit,
        uncoveredHeight,
        totalWidth: panelsNeeded * pattern.panelWidth,
        totalHeight: actualPanelLength * 12
    });
    
    return {
        panelsNeeded,
        panelLength: actualPanelLength,
        exceedsLimit,
        idealPanelLength,
        uncoveredHeight,
        totalWidth: panelsNeeded * pattern.panelWidth,
        totalHeight: actualPanelLength * 12,
        saleType: 'panel'
    };
}

// Calculate yard requirements
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    console.log('🧮 Yard calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: pattern.minOverage,
        totalWidth,
        totalHeight,
        repeatHeight: pattern.repeatHeight,
        panelWidth: pattern.panelWidth
    });
    
    // Safety checks
    if (!pattern.repeatHeight || pattern.repeatHeight <= 0) {
        console.error('Invalid repeat height for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: pattern.panelWidth || 54,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120
        };
    }
    
    if (!pattern.panelWidth || pattern.panelWidth <= 0) {
        console.error('Invalid panel width for yard calculation');
        return {
            panelsNeeded: 1,
            panelLength: 10,
            totalYardage: 5,
            totalWidth: 54,
            totalHeight: 120,
            saleType: 'yard',
            stripLengthInches: 120
        };
    }
    
    // Calculate strip length
    const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
    const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
    
    // Calculate number of strips needed
    const stripsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    
    // Calculate total yardage
    const totalYardageRaw = (stripLengthInches * stripsNeeded) / 36;
    const totalYardage = Math.max(Math.ceil(totalYardageRaw), pattern.minYardOrder || 5);
    
    console.log('📏 Yard calculation result:', {
        repeatsNeeded,
        stripLengthInches,
        stripsNeeded,
        totalYardageRaw,
        totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: stripLengthInches
    });
    
    return {
        panelsNeeded: stripsNeeded,
        panelLength: Math.floor(stripLengthInches / 12),
        panelLengthInches: stripLengthInches % 12,
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: stripLengthInches,
        saleType: 'yard',
        stripLengthInches: stripLengthInches
    };
}

// Generate timestamp for preview numbers
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// Logging functions (optional - only if Google Sheets is configured)
async function logCalculatorUsage(wallWidth, wallHeight, pattern, totalYardage) {
    if (!CONFIG.google.sheetsUrl) {
        console.log('📊 Google Sheets logging disabled');
        return 20001 + Math.floor(Date.now() / 1000) % 10000;
    }
    
    try {
        const formData = new FormData();
        formData.append('logType', 'preview');
        formData.append('wallWidth', wallWidth);
        formData.append('wallHeight', wallHeight);
        formData.append('pattern', pattern);
        formData.append('totalYardage', totalYardage);
        formData.append('userAgent', navigator.userAgent);
        
        const response = await fetch(CONFIG.google.sheetsUrl, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('📊 Calculator usage logged, preview number:', result.previewNumber);
        return result.previewNumber;
        
    } catch (error) {
        console.error('❌ Error logging calculator usage:', error);
        return 20001 + Math.floor(Date.now() / 1000) % 10000;
    }
}

// Export functions for other modules
window.calculatorAPI = {
    patterns,
    currentPreview,
    patternImage,
    imageLoaded,
    getSelectedPattern,
    preloadPatternImage,
    calculatePanelRequirements,
    calculateYardRequirements,
    logCalculatorUsage,
    generateTimestamp
};
