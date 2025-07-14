// Canvas Drawing Core Module - Core functions and coordinate calculations
// FIXED: Panel bottoms anchor to wall bottom

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
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    // For Section 1, use the panel height (not strip height for yard patterns)
    let completeViewHeight = calculations.totalHeight; // This is the actual panel height
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
    const scaledTotalHeight = calculations.totalHeight * scale; // Panel height
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // FIXED: Section 1 coordinates - panels anchor to wall bottom
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const section1WallOffsetY = section1StartY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    
    // FIXED: Panels anchor to bottom of wall
    const section1WallBottomY = section1WallOffsetY + scaledWallHeight;
    const section1PanelBottomY = section1WallBottomY; // Panels anchor to wall bottom
    const section1OffsetY = section1PanelBottomY - scaledTotalHeight; // Panel top
    
    // Section 2 coordinates
    const section2StartY = section1StartY + completeViewHeight * scale + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    console.log('📐 FIXED coordinate calculation (panels anchor to wall bottom):', {
        section1WallBottomY: section1WallBottomY,
        section1PanelBottomY: section1PanelBottomY,
        section1OffsetY: section1OffsetY,
        scaledTotalHeight: scaledTotalHeight,
        scaledWallHeight: scaledWallHeight
    });
    
    return {
        scale,
        section1: {
            patternStartX: section1OffsetX,
            patternStartY: section1OffsetY,
            wallStartX: section1WallOffsetX,
            wallStartY: section1WallOffsetY,
            wallBottomY: section1WallBottomY, // NEW: Wall bottom for anchoring
            panelBottomY: section1PanelBottomY // NEW: Panel bottom anchor point
        },
        section2: {
            wallStartX: section2WallOffsetX,
            wallStartY: section2WallOffsetY,
            wallBottomY: section2WallOffsetY + scaledWallHeight // NEW: Section 2 wall bottom
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

// FIXED: Helper function to get wall position for consistent pattern alignment anchored from bottom
function getWallPositionInSection1(referenceCoords) {
    const { wallHeight } = currentPreview;
    return {
        wallBottomY: referenceCoords.section1.wallBottomY,
        wallHeight: wallHeight
    };
}

// Export functions to global scope for use in other modules
window.calculateReferenceCoordinates = calculateReferenceCoordinates;
window.drawOverageOverlay = drawOverageOverlay;
window.getWallPositionInSection1 = getWallPositionInSection1;
