// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// Part 2 of modularized canvas drawing system
// FIXED: Half-drop patterns with repeat width < panel width

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    if (!pattern.patternMatch || pattern.patternMatch.toLowerCase() !== 'half drop') {
        return 0;
    }
    
    // Even strips (2nd, 4th, 6th) get offset
    if (panelIndex % 2 === 0) {
        return 0; // Odd strips (1, 3, 5) - no offset
    }
    
    // FIXED: When repeat width is less than panel width, strips should NOT be offset
    // The half-drop happens WITHIN the strip, not by moving the strip
    const visualOffsetRatio = pattern.repeatWidth / pattern.panelWidth;
    
    // Only offset the strip if the pattern is as wide as the panel
    if (visualOffsetRatio < 1) {
        // Pattern repeats within the strip - no strip offset needed
        return 0;
    }
    
    // Full-width patterns get the full visual offset
    const visualOffset = pattern.repeatHeight / 2;
    
    console.log(`🎨 Half-drop visual offset for strip ${panelIndex + 1}:`, {
        repeatWidth: pattern.repeatWidth,
        panelWidth: pattern.panelWidth,
        ratio: visualOffsetRatio,
        fullOffset: pattern.repeatHeight / 2,
        visualOffset: visualOffset
    });
    
    return visualOffset;
}

// Calculate pattern offset for half-drop when pattern repeats within strip
function calculatePatternOffsetWithinStrip(pattern, stripIndex, repeatIndex) {
    if (!pattern.patternMatch || pattern.patternMatch.toLowerCase() !== 'half drop') {
        return 0;
    }
    
    // For patterns that repeat within the strip width
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    if (repeatsPerStrip <= 1) {
        return 0; // Full-width patterns handled by strip offset
    }
    
    // Even strips (2nd, 4th, 6th) have offset pattern
    if (stripIndex % 2 === 1) { // Index 1, 3, 5 = strips 2, 4, 6
        // Every other repeat within the strip is offset
        if (repeatIndex % 2 === 1) {
            return pattern.repeatHeight / 2;
        }
    }
    
    return 0;
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
    const repeatW = pattern.repeatWidth * scale;
    const repeatH = pattern.repeatHeight * scale;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    
    // Set clip area to prevent drawing outside boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
    ctx.clip();
    
    // If drawing a specific panel (used in Section 1)
    if (panelIndex !== null) {
        // Calculate visual offset for the entire strip
        const stripOffset = calculateHalfDropVisualOffset(pattern, panelIndex);
        const scaledStripOffset = stripOffset * scale;
        
        // Apply strip offset to the drawing area
        const drawAreaY = areaY + scaledStripOffset;
        const drawAreaHeight = areaHeight;
        
        // Draw pattern repeats within this strip
        if (isHalfDrop && repeatsPerStrip > 1) {
            // Pattern repeats within strip - handle half-drop WITHIN the strip
            let repeatX = 0;
            let repeatIndex = 0;
            
            while (repeatX < areaWidth + repeatW) {
                const patternOffset = calculatePatternOffsetWithinStrip(pattern, panelIndex, repeatIndex);
                const scaledPatternOffset = patternOffset * scale;
                
                // Draw vertical repeats for this horizontal position
                const bottomY = drawAreaY + drawAreaHeight;
                for (let y = -scaledPatternOffset; y >= -drawAreaHeight - repeatH - scaledPatternOffset; y -= repeatH) {
                    const drawY = Math.floor(bottomY + y - repeatH);
                    const drawX = Math.floor(areaX + repeatX);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
                
                repeatX += repeatW;
                repeatIndex++;
            }
        } else {
            // Original logic for full-width patterns or no half-drop
            for (let x = 0; x < areaWidth + repeatW; x += repeatW) {
                const drawX = Math.floor(areaX + x);
                
                if (pattern.hasRepeatHeight) {
                    // Patterns with height repeats
                    const bottomY = drawAreaY + drawAreaHeight;
                    
                    // Start from the bottom and tile upward
                    for (let y = 0; y >= -drawAreaHeight - repeatH; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                } else {
                    // Patterns WITHOUT height repeats
                    const drawY = Math.floor(drawAreaY + drawAreaHeight - repeatH);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
    } else {
        // Drawing for Section 2 - show pattern as it appears on the wall
        if (isHalfDrop && repeatsPerStrip > 1) {
            // For Section 2 with half-drop patterns that repeat within strips
            // We need to show how the pattern actually appears on the wall
            
            // Calculate which strips are visible in this wall area
            const wallStartX = referenceCoords.section2.wallStartX;
            const firstStripIndex = Math.floor((areaX - wallStartX) / (pattern.panelWidth * scale));
            const lastStripIndex = Math.ceil((areaX + areaWidth - wallStartX) / (pattern.panelWidth * scale));
            
            // Draw each strip's portion that falls within the wall area
            for (let stripIdx = firstStripIndex; stripIdx <= lastStripIndex; stripIdx++) {
                if (stripIdx < 0 || stripIdx >= calculations.panelsNeeded) continue;
                
                const stripX = wallStartX + (stripIdx * pattern.panelWidth * scale);
                
                // Draw pattern repeats within this strip
                let repeatX = 0;
                let repeatIndex = 0;
                
                while (repeatX < pattern.panelWidth * scale) {
                    const patternOffset = calculatePatternOffsetWithinStrip(pattern, stripIdx, repeatIndex);
                    const scaledPatternOffset = patternOffset * scale;
                    
                    const drawX = stripX + repeatX;
                    
                    // Only draw if within the wall area
                    if (drawX + repeatW >= areaX && drawX <= areaX + areaWidth) {
                        // Draw vertical repeats
                        const bottomY = areaY + areaHeight;
                        for (let y = -scaledPatternOffset; y >= -areaHeight - repeatH - scaledPatternOffset; y -= repeatH) {
                            const drawY = Math.floor(bottomY + y - repeatH);
                            ctx.drawImage(patternImage, Math.floor(drawX), drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                        }
                    }
                    
                    repeatX += repeatW;
                    repeatIndex++;
                }
            }
        } else {
            // Original logic for non-half-drop or full-width patterns
            const patternOriginX = referenceCoords.section1.patternStartX;
            const patternOriginY = referenceCoords.section1.patternStartY;
            const coordinateOffsetX = referenceCoords.section2.wallStartX - referenceCoords.section1.wallStartX;
            const coordinateOffsetY = referenceCoords.section2.wallStartY - referenceCoords.section1.wallStartY;
            
            for (let i = 0; i < calculations.panelsNeeded; i++) {
                const panelX = patternOriginX + (i * pattern.panelWidth * scale);
                const drawPanelX = panelX + coordinateOffsetX;
                
                // Calculate strip offset for full-width half-drop patterns
                const stripOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, i) * scale : 0;
                
                // Draw pattern repeats for this panel
                const panelWidth = pattern.panelWidth * scale;
                
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x);
                    
                    if (pattern.hasRepeatHeight) {
                        const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                        const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                        const section1PatternRelativeToWall = section1WallBottom - section1PanelBottom;
                        
                        const section2WallBottom = areaY + areaHeight;
                        const section2PanelBottom = section2WallBottom - section1PatternRelativeToWall;
                        const drawPanelY = section2PanelBottom - areaHeight;
                        
                        const bottomY = drawPanelY + areaHeight + stripOffset;
                        
                        for (let y = 0; y >= -areaHeight - repeatH; y -= repeatH) {
                            const drawY = Math.floor(bottomY + y - repeatH);
                            ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                        }
                    }
                }
            }
        }
    }
    
    ctx.restore();
}
