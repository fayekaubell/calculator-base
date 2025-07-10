// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// Part 2 of modularized canvas drawing system

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    if (!pattern.patternMatch || pattern.patternMatch.toLowerCase() !== 'half drop') {
        return 0;
    }
    
    // Even strips (2nd, 4th, 6th) get offset
    if (panelIndex % 2 === 0) {
        return 0; // Odd strips (1, 3, 5) - no offset
    }
    
    // Calculate visual offset based on repeat width to panel width ratio
    const visualOffsetRatio = pattern.repeatWidth / pattern.panelWidth;
    const visualOffset = (pattern.repeatHeight / 2) * visualOffsetRatio;
    
    console.log(`🎨 Half-drop visual offset for strip ${panelIndex + 1}:`, {
        repeatWidth: pattern.repeatWidth,
        panelWidth: pattern.panelWidth,
        ratio: visualOffsetRatio,
        fullOffset: pattern.repeatHeight / 2,
        visualOffset: visualOffset
    });
    
    return visualOffset;
}

// Draw pattern with consistent coordinate system - UPDATED FOR HALF-DROP
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
    
    // Set clip area to prevent drawing outside boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
    ctx.clip();
    
    // Use consistent pattern origin for both sections
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
    
    // If drawing a specific panel, use that index, otherwise draw all panels
    if (panelIndex !== null) {
        // Drawing a specific panel with potential half-drop offset
        const halfDropOffset = calculateHalfDropVisualOffset(pattern, panelIndex);
        const scaledHalfDropOffset = halfDropOffset * scale;
        
        // Calculate panel position in the reference coordinate system
        const panelX = patternOriginX + (panelIndex * pattern.panelWidth * scale);
        
        // Calculate sequence offset for panel patterns
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        // Draw pattern repeats for this panel
        const panelWidth = pattern.panelWidth * scale;
        
        // Apply half-drop offset to the area
        const offsetAreaY = areaY + scaledHalfDropOffset;
        const offsetAreaHeight = areaHeight;
        
        // Draw horizontal repeats
        for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
            const drawX = Math.floor(areaX + x - (sourceOffsetX * scale));
            
            if (pattern.hasRepeatHeight) {
                // Patterns with height repeats
                const bottomY = offsetAreaY + offsetAreaHeight;
                
                // Start from the bottom and tile upward
                for (let y = 0; y >= -offsetAreaHeight - repeatH; y -= repeatH) {
                    const drawY = Math.floor(bottomY + y - repeatH);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            } else {
                // Patterns WITHOUT height repeats
                const drawY = Math.floor(offsetAreaY + offsetAreaHeight - repeatH);
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
            }
        }
    } else {
        // Original logic for drawing all panels (used in Section 2)
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            // Calculate panel position in the reference coordinate system
            const panelX = patternOriginX + (i * pattern.panelWidth * scale);
            
            // For repeating patterns, maintain pattern alignment but adjust for clipping area
            let drawPanelX, drawPanelY;
            
            if (pattern.hasRepeatHeight) {
                // Repeating patterns: Calculate EXACT same position relative to wall in both sections
                drawPanelX = panelX + coordinateOffsetX;
                if (isSection2) {
                    // For Section 2, calculate where pattern appears relative to wall in Section 1
                    // then apply EXACT same relative position
                    
                    // Section 1: Calculate pattern position relative to wall bottom
                    const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                    const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                    const section1PatternRelativeToWall = section1WallBottom - section1PanelBottom;
                    
                    // Section 2: Apply EXACT same relative position
                    const section2WallBottom = areaY + areaHeight;
                    const section2PanelBottom = section2WallBottom - section1PatternRelativeToWall;
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
            
            // Draw horizontal repeats
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                
                if (pattern.hasRepeatHeight) {
                    // Patterns with height repeats - RESTORE ORIGINAL WORKING LOGIC
                    
                    // Calculate the bottom of the draw area (this was working before!)
                    const bottomY = drawPanelY + drawHeight;
                    
                    // Start from the bottom and tile upward
                    for (let y = 0; y >= -drawHeight - repeatH; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                } else {
                    // ONLY for patterns WITHOUT height repeats - calculate exact relative position
                    
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
    
    ctx.restore();
}
