// Pattern Data Module - Data loading, CSV parsing, and calculations
// Updated to handle product link columns for PDF generation and HALF-DROP patterns

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
                product_360_url: '',
                patternMatch: 'straight'
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
    
    // Determine image URL - SIMPLE: Use CSV URL or construct from SKU
    let imageUrl = '';
    let thumbnailUrl = '';
    
    if (row.repeat_url && row.repeat_url.trim()) {
        // Use the URL from CSV as-is
        imageUrl = row.repeat_url.trim();
        thumbnailUrl = imageUrl;
        console.log(`🔍 Using CSV URL for ${row.sku}: "${imageUrl}"`);
    } else {
        // Construct from SKU + .jpg
        const filename = row.sku + '.jpg';
        imageUrl = CONFIG.data.imageBaseUrl + filename;
        thumbnailUrl = imageUrl;
        console.log(`🔧 Constructed URL for ${row.sku}: CONFIG.data.imageBaseUrl ("${CONFIG.data.imageBaseUrl}") + filename ("${filename}") = "${imageUrl}"`);
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

// SIMPLE: Preload pattern images with basic error handling and debugging
function preloadPatternImage(pattern) {
    return new Promise((resolve, reject) => {
        if (!pattern.imageUrl) {
            console.warn('No image URL provided for pattern:', pattern.name);
            resolve(null);
            return;
        }
        
        console.log('🖼️ About to load pattern image for:', pattern.name);
        console.log('🖼️ Pattern object imageUrl:', pattern.imageUrl);
        console.log('🖼️ typeof pattern.imageUrl:', typeof pattern.imageUrl);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ Pattern image loaded successfully from:', this.src);
            patternImage = img;
            imageLoaded = true;
            resolve(img);
        };
        
        img.onerror = function() {
            console.error('⚠️ Failed to load pattern image');
            console.error('⚠️ Attempted URL:', this.src);
            console.error('⚠️ Original pattern.imageUrl was:', pattern.imageUrl);
            console.error('⚠️ Pattern object:', pattern);
            
            // Continue without image
            patternImage = null;
            imageLoaded = false;
            resolve(null);
        };
        
        // Log the exact URL we're about to set
        console.log('🔍 Setting img.src to:', pattern.imageUrl);
        
        // Start loading the image
        img.src = pattern.imageUrl;
        
        // Log what the browser actually received
        console.log('🔍 Browser received img.src as:', img.src);
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
        saleType: 'panel',
        patternMatch: pattern.patternMatch || 'straight'
    };
}

// Calculate yard requirements - UPDATED FOR HALF-DROP
function calculateYardRequirements(pattern, wallWidth, wallHeight) {
    const totalWidth = wallWidth + pattern.minOverage;
    const totalHeight = wallHeight + pattern.minOverage;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    console.log('🧮 Yard calculation debug:', {
        wallWidth,
        wallHeight,
        minOverage: pattern.minOverage,
        totalWidth,
        totalHeight,
        repeatHeight: pattern.repeatHeight,
        panelWidth: pattern.panelWidth,
        patternMatch: pattern.patternMatch,
        isHalfDrop: isHalfDrop
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
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
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
            stripLengthInches: 120,
            patternMatch: pattern.patternMatch || 'straight'
        };
    }
    
    // Calculate number of strips needed
    const stripsNeeded = Math.ceil(totalWidth / pattern.panelWidth);
    
    // Calculate strip lengths - UPDATED FOR HALF-DROP
    let stripLengths = [];
    let maxStripLength = 0;
    
    if (isHalfDrop) {
        // Check if pattern repeats within strip width
        const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
        
        if (repeatsPerStrip > 1) {
            // Pattern repeats within strip - all strips same height (like straight match)
            const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
            const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
            
            for (let i = 0; i < stripsNeeded; i++) {
                stripLengths.push(stripLengthInches);
            }
            maxStripLength = stripLengthInches;
            
            console.log(`🎯 Half-drop with ${repeatsPerStrip} repeats per strip - all strips: ${stripLengthInches}" material`);
        } else {
            // Full-width pattern - even strips need extra height
            for (let i = 0; i < stripsNeeded; i++) {
                let stripHeight = totalHeight;
                
                // Even strips (2nd, 4th, 6th, etc.) need an extra half repeat
                if (i % 2 === 1) { // Index 1, 3, 5 = strips 2, 4, 6
                    stripHeight += pattern.repeatHeight / 2;
                }
                
                // Calculate repeats needed for this strip
                const repeatsNeeded = Math.ceil(stripHeight / pattern.repeatHeight);
                const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
                
                stripLengths.push(stripLengthInches);
                maxStripLength = Math.max(maxStripLength, stripLengthInches);
                
                console.log(`🎯 Strip ${i + 1}: ${stripHeight}" height needs ${repeatsNeeded} repeats = ${stripLengthInches}" material`);
            }
        }
    } else {
        // Straight match - all strips are the same
        const repeatsNeeded = Math.ceil(totalHeight / pattern.repeatHeight);
        const stripLengthInches = repeatsNeeded * pattern.repeatHeight;
        
        for (let i = 0; i < stripsNeeded; i++) {
            stripLengths.push(stripLengthInches);
        }
        maxStripLength = stripLengthInches;
    }
    
    // Calculate total yardage
    const totalInches = stripLengths.reduce((sum, length) => sum + length, 0);
    const totalYardageRaw = totalInches / 36;
    const totalYardage = Math.max(Math.ceil(totalYardageRaw), pattern.minYardOrder || 5);
    
    console.log('📏 Yard calculation result:', {
        stripsNeeded,
        stripLengths,
        maxStripLength,
        totalInches,
        totalYardageRaw,
        totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: maxStripLength,
        isHalfDrop
    });
    
    return {
        panelsNeeded: stripsNeeded,
        panelLength: Math.floor(maxStripLength / 12),
        panelLengthInches: maxStripLength % 12,
        totalYardage: totalYardage,
        totalWidth: stripsNeeded * pattern.panelWidth,
        totalHeight: maxStripLength,
        saleType: 'yard',
        stripLengthInches: maxStripLength,
        stripLengths: stripLengths, // Array of individual strip lengths for half-drop
        patternMatch: pattern.patternMatch || 'straight',
        isHalfDrop: isHalfDrop
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
