// Pattern Data Module - Data loading, CSV parsing, and calculations
// Updated to handle product link columns for PDF generation

// Global variables for data
let patterns = {};
let patternsLoaded = false;
let patternImage = null;
let imageLoaded = false;

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
        console.log(`🎉 Total patterns loaded: ${Object.keys(patterns).length}`);
        return patterns;
        
    } catch (error) {
        console.error('❌ Error loading patterns from CSV:', error);
        
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
                thumbnailUrl: '',
                product_tearsheet_url: '',
                product_page_url: '',
                product_360_url: ''
            }
        };
        patternsLoaded = true;
        console.log('🔄 Using demo pattern as fallback');
        return patterns;
    }
}

// Create pattern object from CSV row - UPDATED FOR PRODUCT LINKS
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
    
    // FIXED: Parse panel sequence with proper yard pattern handling
    const panelSequence = row.panel_sequence || (row.sale_type === 'yard' ? '' : 'AB');
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
    
    // Determine image URL - FIXED: Handle GitHub raw URLs properly
    let imageUrl = '';
    let thumbnailUrl = '';
    
    if (row.repeat_url && row.repeat_url.trim()) {
        // Use the URL from CSV, but fix GitHub raw URLs to use GitHub Pages
        let csvUrl = row.repeat_url.trim();
        
        // Convert GitHub raw URLs to GitHub Pages URLs
        if (csvUrl.includes('raw.githubusercontent.com')) {
            csvUrl = csvUrl
                .replace('https://raw.githubusercontent.com/fayekaubell/calculator-base/refs/heads/main/', 'https://fayekaubell.github.io/calculator-base/')
                .replace('https://raw.githubusercontent.com/fayekaubell/calculator-base/main/', 'https://fayekaubell.github.io/calculator-base/');
            console.log(`🔧 Converted GitHub raw URL to Pages URL for ${row.sku}:`, csvUrl);
        }
        
        imageUrl = csvUrl;
        thumbnailUrl = imageUrl;
        console.log(`📸 Using CSV image URL for ${row.sku}:`, imageUrl);
    } else {
        // Try to construct from filename - use original SKU format
        const filename = row.sku + '.jpg'; // Keep original SKU format, try .jpg first
        imageUrl = CONFIG.data.imageBaseUrl + filename;
        thumbnailUrl = imageUrl;
        console.log(`📸 Constructed image URL for ${row.sku}:`, imageUrl);
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
        handle: patternId,
        // NEW: Product links for PDF generation
        product_tearsheet_url: row.product_tearsheet_url || '',
        product_page_url: row.product_page_url || '',
        product_360_url: row['360_view_url'] || '' // Note: CSV column is 360_view_url
    };
}

// ENHANCED: Preload pattern images with better error handling and fallbacks
function preloadPatternImage(pattern) {
    return new Promise((resolve, reject) => {
        if (!pattern.imageUrl) {
            console.warn('No image URL provided for pattern:', pattern.name);
            resolve(null);
            return;
        }
        
        console.log('🖼️ Loading pattern image:', pattern.imageUrl);
        
        const img = new Image();
        
        // Enable CORS for cross-origin images
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ Pattern image loaded successfully');
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.warn('⚠️ Failed to load pattern image:', pattern.imageUrl);
            
            // Try alternative image extensions if original fails
            const originalUrl = pattern.imageUrl;
            const extensions = ['.png', '.jpg', '.jpeg'];
            const currentExt = originalUrl.substring(originalUrl.lastIndexOf('.'));
            
            // Find an alternative extension to try
            const altExtensions = extensions.filter(ext => ext !== currentExt);
            
            if (altExtensions.length > 0) {
                const altUrl = originalUrl.replace(currentExt, altExtensions[0]);
                console.log('🔄 Trying alternative image URL:', altUrl);
                
                const altImg = new Image();
                altImg.crossOrigin = 'anonymous';
                
                altImg.onload = function() {
                    console.log('✅ Alternative pattern image loaded successfully');
                    patternImage = altImg;
                    imageLoaded = true;
                    resolve(altImg);
                };
                
                altImg.onerror = function() {
                    console.warn('⚠️ Alternative image also failed. Continuing without image.');
                    patternImage = null;
                    imageLoaded = false;
                    resolve(null);
                };
                
                altImg.src = altUrl;
            } else {
                console.warn('⚠️ No alternative extensions to try. Continuing without image.');
                patternImage = null;
                imageLoaded = false;
                resolve(null);
            }
        };
        
        // Start loading the image
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

// Export data access functions to global scope
window.patternDataAPI = {
    patterns,
    patternImage,
    imageLoaded,
    loadPatternsFromCSV,
    preloadPatternImage,
    calculatePanelRequirements,
    calculateYardRequirements
};
