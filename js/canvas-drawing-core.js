// Canvas Drawing Core Module - Core functions and coordinate calculations
// UPDATED: Enhanced bottom anchoring for non-repeating patterns like Moon patterns

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
    
    // UPDATED: Enhanced bottom anchoring logic for non-repeating patterns
    let shouldBottomAnchor = false;
    let anchorReason = '';
    
    if (pattern.saleType === 'panel') {
        if (!pattern.hasRepeatHeight) {
            // Non-repeating patterns (like Moon patterns) should always be bottom-anchored
            // This ensures they extend upward from the panel bottom and get clipped at the top
            shouldBottomAnchor = true;
            anchorReason = 'non-repeating pattern - always bottom-anchor';
        } else if (wallHeight + pattern.minOverage > calculations.panelLength * 12) {
            // Repeating patterns that exceed panel length also get bottom-anchored
            shouldBottomAnchor = true;
            anchorReason = 'wall exceeds panel length';
        }
    }
    
    // Calculate dimensions for both sections - ensuring pattern alignment
    const wallOnlyHeight = wallHeight;
    
    // For Section 1, use the appropriate height based on anchoring
    let completeViewHeight = calculations.totalHeight;
    if (calculations.stripLengths && calculations.stripLengths.length > 0) {
        // Use the maximum strip length for layout calculation
        const maxStripLength = Math.max(...calculations.stripLengths);
        completeViewHeight = maxStripLength;
    }
    
    // UPDATED: For non-repeating patterns, always show the full pattern height
    if (!pattern.hasRepeatHeight) {
        // Use the pattern's full repeat height for layout
        completeViewHeight = Math.max(completeViewHeight, pattern.repeatHeight);
        console.log(`🌙 Non-repeating pattern: Using full pattern height ${pattern.repeatHeight}" for layout`);
    } else {
        // For normal cases, ensure we show enough height to include wall + overage
        if (!shouldBottomAnchor) {
            completeViewHeight = Math.max(completeViewHeight, wallHeight + pattern.minOverage);
        }
    }
    
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
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    const scaledCompleteViewHeight = completeViewHeight * scale;
    
    // Section 1 coordinates
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1OffsetY = section1StartY;
    
    // UPDATED: Enhanced wall positioning logic
    let section1WallOffsetX, section1WallOffsetY;
    
    if (shouldBottomAnchor) {
        // Bottom-anchored: Panel bottom aligns with wall bottom (or pattern bottom if non-repeating)
        if (!pattern.hasRepeatHeight) {
            // Non-repeating patterns: Wall is positioned within the full pattern area
            // Pattern extends from panel bottom upward, wall is positioned appropriately within it
            const patternBottomY = section1OffsetY + scaledCompleteViewHeight;
            const wallBottomY = patternBottomY;
            const wallTopY = wallBottomY - scaledWallHeight;
            
            section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
            section1WallOffsetY = wallTopY;
            
            console.log(`🌙 Non-repeating pattern bottom-anchoring:`, {
                patternBottomY: patternBottomY,
                wallBottomY: wallBottomY,
                wallTopY: wallTopY,
                scaledCompleteViewHeight: scaledCompleteViewHeight,
                reason: anchorReason
            });
        } else {
            // Standard bottom-anchoring for repeating patterns that exceed panel length
            const panelBottomY = section1OffsetY + scaledTotalHeight;
            const wallBottomY = panelBottomY;
            const wallTopY = wallBottomY - scaledWallHeight;
            
            section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
            section1WallOffsetY = wallTopY;
            
            console.log(`🔻 Standard bottom-anchoring - ${anchorReason}`);
        }
    } else {
        // Normal positioning: Wall centered within panel area with overage
        section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
        section1WallOffsetY = section1OffsetY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
        
        console.log(`📐 Normal positioning - adequate panel coverage`);
    }
    
    // Section 2 coordinates
    const section2StartY = section1StartY + scaledCompleteViewHeight + sectionGap;
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
            scaledTotalHeight,
            scaledWallWidth,
            scaledWallHeight,
            scaledCompleteViewHeight: scaledCompleteViewHeight
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
