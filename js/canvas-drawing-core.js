// Canvas Drawing Core Module - Core functions and coordinate calculations
// Part 1 of modularized canvas drawing system
// ADDED: Comprehensive debug logging for Alpine Tulip coordinate calculations

// Calculate the reference coordinate system for consistent pattern positioning
function calculateReferenceCoordinates() {
    const canvas = document.getElementById('previewCanvas');
    const { wallWidth, wallHeight, calculations } = currentPreview;
    
    // DEBUG: Alpine Tulip specific logging
    const isAlpineTulip = currentPreview.pattern.name.toLowerCase().includes('alpine tulip');
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Starting calculation:`, {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            wallWidth: wallWidth,
            wallHeight: wallHeight,
            wallWidthFeet: wallWidth / 12,
            wallHeightFeet: wallHeight / 12,
            calculationsTotalWidth: calculations.totalWidth,
            calculationsTotalHeight: calculations.totalHeight
        });
    }
    
    // Use the same layout constants as the main drawing function
    const leftMargin = 120;
    const rightMargin = 120;
    const topMargin = 140;
    const bottomMargin = 120;
    const sectionGap = 60;
    
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - topMargin - bottomMargin;
    
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Canvas layout:`, {
            leftMargin: leftMargin,
            rightMargin: rightMargin,
            topMargin: topMargin,
            bottomMargin: bottomMargin,
            sectionGap: sectionGap,
            maxWidth: maxWidth,
            maxHeight: maxHeight
        });
    }
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    // For Section 1, use the maximum strip height for full-width half-drop patterns
    let completeViewHeight = calculations.totalHeight;
    if (calculations.stripLengths && calculations.stripLengths.length > 0) {
        // Use the maximum strip length for layout calculation
        const maxStripLength = Math.max(...calculations.stripLengths);
        completeViewHeight = maxStripLength;
    }
    completeViewHeight = Math.max(completeViewHeight, wallHeight);
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Height calculations:`, {
            wallOnlyHeight: wallOnlyHeight,
            calculationsTotalHeight: calculations.totalHeight,
            stripLengths: calculations.stripLengths,
            maxStripLength: calculations.stripLengths ? Math.max(...calculations.stripLengths) : 'N/A',
            completeViewHeight: completeViewHeight,
            totalContentHeight: totalContentHeight,
            effectiveWidth: effectiveWidth
        });
    }
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Scale calculation:`, {
            widthScale: widthScale,
            heightScale: heightScale,
            finalScale: scale,
            scaleChoice: scale === widthScale ? 'limited by width' : 'limited by height'
        });
    }
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    const section1StartY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Pattern coverage area in Section 1
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Scaled dimensions:`, {
            actualContentHeight: actualContentHeight,
            section1StartY: section1StartY,
            scaledTotalWidth: scaledTotalWidth,
            scaledTotalHeight: scaledTotalHeight,
            scaledWallWidth: scaledWallWidth,
            scaledWallHeight: scaledWallHeight
        });
    }
    
    // Section 1 coordinates
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1OffsetY = section1StartY;
    const section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const section1WallOffsetY = section1OffsetY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    
    // Section 2 coordinates
    const section2StartY = section1StartY + completeViewHeight * scale + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP COORDINATES - Final coordinates:`, {
            section1: {
                patternStartX: section1OffsetX,
                patternStartY: section1OffsetY,
                wallStartX: section1WallOffsetX,
                wallStartY: section1WallOffsetY
            },
            section2: {
                wallStartX: section2WallOffsetX,
                wallStartY: section2WallOffsetY
            },
            section2StartY: section2StartY,
            completeViewHeightScaled: completeViewHeight * scale
        });
    }
    
    return {
        scale,
        section1: {
            patternStartX: section1OffsetX,
            patternStartY: section1OffsetY,
            wallStartX: section1WallOffsetX,
            wallStartY: section1WallOffsetY
        },
        section2: {
            wallStartX: section2WallOffsetX,
            wallStartY: section2WallOffsetY
        },
        dimensions: {
            scaledTotalWidth,
            scaledTotalHeight,
            scaledWallWidth,
            scaledWallHeight
        }
    };
}

// Draw overage overlay rectangles to dim non-wall areas
function drawOverageOverlay(ctx, panelStartX, panelStartY, panelTotalWidth, panelTotalHeight, 
                           wallStartX, wallStartY, wallWidth, wallHeight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 50% white overlay to dim
    
    // Left overage
    if (wallStartX > panelStartX) {
        const overageWidth = wallStartX - panelStartX;
        ctx.fillRect(panelStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Right overage
    if (wallStartX + wallWidth < panelStartX + panelTotalWidth) {
        const overageStartX = wallStartX + wallWidth;
        const overageWidth = (panelStartX + panelTotalWidth) - overageStartX;
        ctx.fillRect(overageStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Top overage
    if (wallStartY > panelStartY) {
        const overageHeight = wallStartY - panelStartY;
        ctx.fillRect(wallStartX, panelStartY, wallWidth, overageHeight);
    }
    
    // Bottom overage
    if (wallStartY + wallHeight < panelStartY + panelTotalHeight) {
        const overageStartY = wallStartY + wallHeight;
        const overageHeight = (panelStartY + panelTotalHeight) - overageStartY;
        ctx.fillRect(wallStartX, overageStartY, wallWidth, overageHeight);
    }
}

// Helper function to get wall position within Section 1 for consistent non-repeating pattern alignment
function getWallPositionInSection1(referenceCoords) {
    const { wallHeight } = currentPreview;
    return {
        wallStartY: referenceCoords.section1.wallStartY,
        wallHeight: wallHeight
    };
}

// Export functions to global scope for use in other modules
window.calculateReferenceCoordinates = calculateReferenceCoordinates;
window.drawOverageOverlay = drawOverageOverlay;
window.getWallPositionInSection1 = getWallPositionInSection1;
