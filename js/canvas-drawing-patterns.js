// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// Part 2 of modularized canvas drawing system
// REVERTED to maintain alignment, with careful half-drop additions

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    // No visual offset for strips - they all align at the same height
    // The pattern offset is handled internally in drawPatternInArea
    return 0;
}

// Draw pattern with consistent coordinate system - RESTORED ORIGINAL WITH HALF-DROP
function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, panelIndex = null) {
    const { pattern, calculations } = currentPreview;
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // Calculate pattern dimensions
    const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
        (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
    const repeatH = pattern.repeatHeight * scale;
    
    // Handle yard patterns (sequenceLength = 0) correctly
    const offsetPerPanel = (pattern.sequenceLength === 0 || pattern.sequenceLength === 1) ? 0 : 
        pattern.repeatWidth / pattern.sequenceLength;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    
    // Set clip area to prevent drawing outside boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
    ctx.clip();
    
    // Use consistent pattern origin for both sections - CRITICAL FOR ALIGNMENT
    const patternOriginX = referenceCoords.section1.patternStartX;
    const patternOriginY = referenceCoords.section1.patternStartY;
    
    // For Section 2, calculate the coordinate offset but maintain the same pattern grid
    let coordinateOffsetX = 0;
    let coordinateOffsetY = 0;
    
    if (isSection2) {
        coordinateOffsetX = referenceCoords.section2.wallStartX - referenceCoords.section1.wallStartX;
        coordinateOffsetY = referenceCoords.section2.wallStartY - referenceCoords.section1.wallStartY;
    }
    
    // Calculate draw height first (needed for coordinate calculations)
    const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
    
    // If drawing a specific panel (used in Section 1)
    if (panelIndex !== null) {
        // Drawing a specific panel
        const halfDropOffset = calculateHalfDropVisualOffset(pattern, panelIndex);
        const scaledHalfDropOffset = halfDropOffset * scale;
        
        // Calculate panel position in the reference coordinate system
        const panelX = patternOriginX + (panelIndex * pattern.panelWidth * scale);
        
        // Calculate sequence offset for panel patterns
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        // Draw pattern repeats for this panel
        const panelWidth = pattern.panelWidth * scale;
        
        // Apply half-drop offset to the area IF pattern is full width
        const offsetAreaY = areaY + scaledHalfDropOffset;
        const offsetAreaHeight = areaHeight;
        
        // For half-drop patterns that repeat within strip
        if (isHalfDrop && repeatsPerStrip > 1) {
            // Draw each column with alternating offset
            let xPos = 0;
            let columnIndex = 0;
            
            while (xPos < panelWidth) {
                const drawX = Math.floor(areaX + xPos);
                const columnOffset = (columnIndex % 2) * (repeatH / 2);
                
                // Draw vertical repeats for this column
                if (pattern.hasRepeatHeight) {
                    // Start from bottom of panel area
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    // First repeat starts at bottom, offset columns start higher
                    // Start from below bottom to ensure coverage
                    for (let y = repeatH - columnOffset; y >= -offsetAreaHeight - repeatH - columnOffset; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                } else {
                    // Non-repeating pattern
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    const drawY = Math.floor(bottomY - repeatH - columnOffset);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
                
                xPos += repeatW;
                columnIndex++;
            }
        } else {
            // For full-width patterns or straight match
            const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
            
            // Calculate pattern offset for even strips in full-width half-drop
            let patternOffsetY = 0;
            if (isFullWidthHalfDrop && panelIndex % 2 === 1) { // Even strips (2, 4, 6)
                patternOffsetY = -(repeatH / 2); // Shift pattern up by half repeat
            }
            
            // Draw pattern repeats
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                const drawX = Math.floor(areaX + x - (sourceOffsetX * scale));
                
                if (pattern.hasRepeatHeight) {
                    // Start from bottom of panel area
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    // Tile upward from bottom, applying any pattern offset
                    for (let y = repeatH + patternOffsetY; y >= -offsetAreaHeight - repeatH + patternOffsetY; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                } else {
                    // Non-repeating pattern - position at bottom with offset
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    const drawY = Math.floor(bottomY - repeatH + patternOffsetY);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
    } else {
        // Original logic for drawing all panels (used in Section 2) - RESTORED
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            // Calculate panel position in the reference coordinate system
            const panelX = patternOriginX + (i * pattern.panelWidth * scale);
            
            // For repeating patterns, maintain pattern alignment but adjust for clipping area
            let drawPanelX, drawPanelY;
            
            if (pattern.hasRepeatHeight) {
                // Repeating patterns: Calculate EXACT same position relative to wall in both sections
                drawPanelX = panelX + coordinateOffsetX;
                
                // The pattern starts from bottom of panel area in Section 1
                // We need to maintain that same relationship in Section 2
                const panelBottom = patternOriginY + referenceCoords.dimensions.scaledTotalHeight;
                
                if (isSection2) {
                    // Calculate where the pattern appears relative to wall
                    const section1WallTop = referenceCoords.section1.wallStartY;
                    const section1WallBottom = section1WallTop + referenceCoords.dimensions.scaledWallHeight;
                    const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                    
                    // How many pixels from panel bottom to wall bottom in Section 1
                    const panelBottomToWallBottom = section1PanelBottom - section1WallBottom;
                    
                    // Apply same relationship in Section 2
                    const section2WallBottom = areaY + areaHeight;
                    const section2PanelBottom = section2WallBottom + panelBottomToWallBottom;
                    
                    drawPanelY = section2PanelBottom - drawHeight;
                } else {
                    drawPanelY = patternOriginY;
                }
            } else {
                // Non-repeating patterns: Apply coordinate offset for Section 2
                drawPanelX = panelX + coordinateOffsetX;
                drawPanelY = patternOriginY + coordinateOffsetY;
            }
            
            // Calculate sequence offset for panel patterns
            const sequencePosition = pattern.sequenceLength === 0 ? 0 : i % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            // Draw pattern repeats for this panel
            const panelWidth = pattern.panelWidth * scale;
            
            // For half-drop patterns that repeat within strip in Section 2
            if (isSection2 && isHalfDrop && repeatsPerStrip > 1) {
                // Need to maintain the half-drop pattern as it appears
                let xPos = 0;
                let columnIndex = Math.floor((panelX + coordinateOffsetX - areaX) / repeatW);
                
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    // Only draw if within the clipped area
                    if (drawX + repeatW >= areaX && drawX < areaX + areaWidth) {
                        const columnOffset = (columnIndex % 2) * (repeatH / 2);
                        
                        if (pattern.hasRepeatHeight) {
                            // Calculate panel bottom position
                            const panelBottom = drawPanelY + drawHeight;
                            // Tile upward from bottom with column offset, start below to ensure coverage
                            for (let y = repeatH - columnOffset; y >= -drawHeight - repeatH - columnOffset; y -= repeatH) {
                                const drawY = Math.floor(panelBottom + y - repeatH);
                                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                            }
                        }
                    }
                    columnIndex++;
                }
            } else {
                // For full-width half-drop or straight match patterns
                const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
                
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    // Calculate pattern offset for even strips in full-width half-drop
                    let patternOffsetY = 0;
                    if (isFullWidthHalfDrop && i % 2 === 1) { // Even strips (2, 4, 6)
                        patternOffsetY = -(repeatH / 2); // Shift pattern up by half repeat
                    }
                    
                    if (pattern.hasRepeatHeight) {
                        // Calculate panel bottom position
                        const panelBottom = drawPanelY + drawHeight;
                        // Tile upward from bottom with pattern offset
                        for (let y = repeatH + patternOffsetY; y >= -drawHeight - repeatH + patternOffsetY; y -= repeatH) {
                            const drawY = Math.floor(panelBottom + y - repeatH);
                            ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                        }
                    } else {
                        let drawY;
                        
                        if (isSection2) {
                            // Section 2: Calculate the exact same relative position as Section 1
                            const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                            const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                            const section1PatternBottom = section1PanelBottom - repeatH;
                            
                            // Calculate the offset of pattern bottom relative to wall bottom in Section 1
                            const patternOffsetFromWallBottom = section1WallBottom - (section1PatternBottom + repeatH);
                            
                            // Apply the EXACT same offset in Section 2
                            const section2WallBottom = areaY + areaHeight;
                            drawY = Math.floor(section2WallBottom - repeatH - patternOffsetFromWallBottom);
                        } else {
                            // Section 1: Position pattern at bottom of PANEL
                            const panelBottom = drawPanelY + drawHeight;
                            drawY = Math.floor(panelBottom - repeatH);
                        }
                        
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                }
            }
        }
    }
    
    ctx.restore();
}

// Export functions to global scope for use in other modules
window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
