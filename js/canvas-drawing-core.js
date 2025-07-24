// Canvas Drawing Core Module - Core functions and coordinate calculations
// FIXED: Corrected coordinate calculation to prevent wall/panel misalignment

// Calculate the reference coordinate system for consistent pattern positioning
function calculateReferenceCoordinates() {
    const canvas = document.getElementById('previewCanvas');
    const { wallWidth, wallHeight, calculations, pattern } = currentPreview;
    
    // Use the same layout constants as the main drawing function
    const leftMargin = 120;
    const rightMargin = 120;
    const topMargin = 140;
    const bottomMargin = 120;
    const sectionGap = 60;
    
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - topMargin - bottomMargin;
    
    // FIXED: Determine bottom anchoring based on actual panel vs wall relationship
    let shouldBottomAnchor = false;
    let anchorReason = '';
    
    if (pattern.saleType === 'panel') {
        if (!pattern.hasRepeatHeight) {
            // Non-repeating patterns: Only bottom-anchor if pattern is taller than panel
            const patternHeightInches = pattern.repeatHeight;
            const panelHeightInches = calculations.totalHeight;
            
            if (patternHeightInches > panelHeightInches) {
                shouldBottomAnchor = true;
                anchorReason = `non-repeating pattern (${patternHeightInches}") exceeds panel (${panelHeightInches}")`;
            } else {
                shouldBottomAnchor = false;
                anchorReason = `non-repeating pattern fits within panel`;
            }
        } else if (wallHeight + pattern.minOverage > calculations.panelLength * 12) {
            // Repeating patterns that exceed panel length also get bottom-anchored
            shouldBottomAnchor = true;
            anchorReason = 'wall exceeds panel length';
        }
    }
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    
    // FIXED: Use the PANEL height for layout, not pattern height
    // The panel height determines the visual space, pattern drawing handles the rest
    let completeViewHeight = calculations.totalHeight;
    if (calculations.stripLengths && calculations.stripLengths.length > 0) {
        const maxStripLength = Math.max(...calculations.stripLengths);
        completeViewHeight = maxStripLength;
    }
    
    // For normal cases, ensure we show enough height to include wall + overage
    if (!shouldBottomAnchor) {
        completeViewHeight = Math.max(completeViewHeight, wallHeight + pattern.minOverage);
    }
    
    console.log(`📐 Layout heights:`, {
        panelHeight: calculations.totalHeight,
        patternHeight: pattern.repeatHeight,
        completeViewHeight: completeViewHeight,
        shouldBottomAnchor: shouldBottomAnchor,
        reason: anchorReason
    });
    
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    const section1StartY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Pattern coverage area in Section 1 - FIXED: Use completeViewHeight consistently
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = completeViewHeight * scale; // FIXED: Use layout height, not calculations.totalHeight
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Section 1 coordinates
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1OffsetY = section1StartY;
    
    // FIXED: Simplified and corrected wall positioning logic
    let section1WallOffsetX, section1WallOffsetY;
    
    if (shouldBottomAnchor) {
        // Bottom-anchored: Wall bottom aligns with panel bottom
        const panelBottomY = section1OffsetY + scaledTotalHeight;
        const wallBottomY = panelBottomY;
        const wallTopY = wallBottomY - scaledWallHeight;
        
        section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
        section1WallOffsetY = wallTopY;
        
        console.log(`🔻 Bottom-anchored positioning:`, {
            reason: anchorReason,
            panelBottomY: panelBottomY,
            wallBottomY: wallBottomY,
            wallTopY: wallTopY
        });
    } else {
        // Normal positioning: Wall centered within panel area with overage
        section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
        section1WallOffsetY = section1OffsetY + (scaledTotalHeight - scaledWallHeight) / 2;
        
        console.log(`📐 Normal centered positioning`);
    }
    
    // Section 2 coordinates
    const section2StartY = section1StartY + scaledTotalHeight + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    return {
        scale,
        shouldBottomAnchor,
        anchorReason,
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
            scaledTotalHeight, // FIXED: This now represents the actual drawn panel height
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
    
    // Top overage - show if panel extends above wall
    if (wallStartY > panelStartY) {
        const overageHeight = wallStartY - panelStartY;
        ctx.fillRect(wallStartX, panelStartY, wallWidth, overageHeight);
    }
    
    // Bottom overage - show if panel extends below wall
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
