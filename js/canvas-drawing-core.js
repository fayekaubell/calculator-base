// Canvas Drawing Core Module - Core functions and coordinate calculations
// FIXED: Panels and pattern anchor to bottom of wall when there are limitations

// Calculate the reference coordinate system for consistent pattern positioning
function calculateReferenceCoordinates() {
    const canvas = document.getElementById('previewCanvas');
    const { wallWidth, wallHeight, calculations } = currentPreview;
    
    // Use the same layout constants as the main drawing function
    const leftMargin = 120;
    const rightMargin = 120;
    const topMargin = 140;
    const bottomMargin = 120;
    const sectionGap = 60;
    
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - topMargin - bottomMargin;
    
    // FIXED: Calculate actual panel height (what's available vs what's needed)
    const hasLimitation = (calculations.exceedsLimit || calculations.exceedsAvailableLength) && 
                         calculations.uncoveredWallHeight > 0;
    
    let actualPanelHeight;
    if (hasLimitation) {
        // Use the actual available panel height (anchored to bottom)
        const totalWallHeight = wallHeight + calculations.pattern?.minOverage || 4;
        actualPanelHeight = totalWallHeight - calculations.uncoveredWallHeight;
    } else {
        // No limitation - use full height
        actualPanelHeight = calculations.totalHeight;
    }
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    // For Section 1, use the actual panel height that can be covered
    let completeViewHeight = actualPanelHeight;
    if (calculations.stripLengths && calculations.stripLengths.length > 0) {
        // Use the maximum strip length for layout calculation
        const maxStripLength = Math.max(...calculations.stripLengths);
        completeViewHeight = Math.min(maxStripLength, actualPanelHeight);
    }
    completeViewHeight = Math.max(completeViewHeight, wallHeight);
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    const section1StartY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Pattern coverage area in Section 1
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledActualPanelHeight = actualPanelHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // FIXED: Section 1 coordinates with bottom anchoring
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    // Calculate where panels should be positioned (anchored to bottom of wall)
    let section1OffsetY;
    let section1WallOffsetY;
    
    if (hasLimitation) {
        // Wall is positioned in the middle of the available space
        section1WallOffsetY = section1StartY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
        
        // Panels anchor to BOTTOM of wall
        const wallBottomY = section1WallOffsetY + scaledWallHeight;
        section1OffsetY = wallBottomY - scaledActualPanelHeight;
    } else {
        // No limitation - center everything as before
        section1OffsetY = section1StartY;
        section1WallOffsetY = section1OffsetY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    }
    
    const section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    
    // Section 2 coordinates
    const section2StartY = section1StartY + completeViewHeight * scale + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    console.log('🔧 FIXED coordinate calculation:', {
        hasLimitation: hasLimitation,
        actualPanelHeight: actualPanelHeight,
        wallHeight: wallHeight,
        uncoveredWallHeight: calculations.uncoveredWallHeight,
        section1OffsetY: section1OffsetY,
        section1WallOffsetY: section1WallOffsetY,
        panelsAnchoredToBottom: hasLimitation
    });
    
    return {
        scale,
        section1: {
            patternStartX: section1OffsetX,
            patternStartY: section1OffsetY,
            wallStartX: section1WallOffsetX,
            wallStartY: section1WallOffsetY,
            actualPanelHeight: actualPanelHeight // NEW: Pass actual panel height
        },
        section2: {
            wallStartX: section2WallOffsetX,
            wallStartY: section2WallOffsetY
        },
        dimensions: {
            scaledTotalWidth,
            scaledTotalHeight: scaledActualPanelHeight, // FIXED: Use actual panel height
            scaledWallWidth,
            scaledWallHeight
        },
        hasLimitation: hasLimitation // NEW: Pass limitation status
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
