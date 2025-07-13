// Canvas Drawing Patterns Module - FIXED: Universal pattern positioning for perfect Section 1/2 alignment

function calculateHalfDropVisualOffset(pattern, panelIndex) {
    // Calculate half-drop offset for patterns that need it
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    if (!isHalfDrop) return 0;
    
    // For half-drop patterns, alternate panels are offset by half the repeat height
    const isOddPanel = panelIndex % 2 === 1;
    return isOddPanel ? pattern.repeatHeight / 2 : 0;
}

function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, panelIndex = null) {
    const { pattern, calculations } = currentPreview;
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    // DEBUG: Log basic info for Alpine Tulip
    const isAlpine = pattern.name.toLowerCase().includes('alpine tulip');
    if (isAlpine) {
        console.log(`🌷 ALPINE TULIP UNIVERSAL FIX - ${isSection2 ? 'Section 2' : 'Section 1'} Panel ${panelIndex}:`, {
            areaX: areaX,
            areaY: areaY, 
            areaWidth: areaWidth,
            areaHeight: areaHeight,
            isHalfDrop: isHalfDrop
        });
    }
    
    // Calculate repeat size to fit perfectly within strip width
    const stripWidthPixels = pattern.panelWidth * scale;
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    const repeatWidthPixels = stripWidthPixels / repeatsPerStrip; // EXACT fit, no rounding
    const repeatHeightPixels = (pattern.repeatHeight / pattern.repeatWidth) * repeatWidthPixels; // Maintain aspect ratio
    
    // UNIVERSAL COORDINATE SYSTEM - THE KEY FIX
    // Create a universal pattern grid where the first panel's lower-left corner is always the pattern origin
    const universalPatternOriginX = referenceCoords.section1.patternStartX;
    const universalPatternOriginY = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
    
    // Calculate where the wall sits within this universal pattern grid for Section 1
    const section1WallRelativeX = referenceCoords.section1.wallStartX - universalPatternOriginX;
    const section1WallRelativeY = universalPatternOriginY - (referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight);
    
    if (isAlpine) {
        console.log(`🎯 ALPINE TULIP UNIVERSAL COORDINATES:`, {
            universalPatternOriginX: universalPatternOriginX,
            universalPatternOriginY: universalPatternOriginY,
            section1WallRelativeX: section1WallRelativeX,
            section1WallRelativeY: section1WallRelativeY
        });
    }
    
    // For Section 2, calculate the universal pattern origin in Section 2's coordinate space
    // The pattern must maintain the EXACT same relationship to the wall as in Section 1
    let patternStartX, patternStartY;
    
    if (isSection2) {
        // Section 2: Position the pattern so the wall has the same relative position as in Section 1
        const section2WallLeft = referenceCoords.section2.wallStartX;
        const section2WallBottom = referenceCoords.section2.wallStartY + referenceCoords.dimensions.scaledWallHeight;
        
        patternStartX = section2WallLeft - section1WallRelativeX;
        patternStartY = section2WallBottom + section1WallRelativeY;
        
        if (isAlpine) {
            console.log(`🌷 ALPINE TULIP SECTION 2 UNIVERSAL POSITIONING:`, {
                section2WallLeft: section2WallLeft,
                section2WallBottom: section2WallBottom,
                patternStartX: patternStartX,
                patternStartY: patternStartY,
                maintainedWallRelativeX: section1WallRelativeX,
                maintainedWallRelativeY: section1WallRelativeY
            });
        }
    } else {
        // Section 1: Use the universal pattern origin directly
        patternStartX = universalPatternOriginX;
        patternStartY = universalPatternOriginY;
        
        if (isAlpine) {
            console.log(`🌷 ALPINE TULIP SECTION 1 UNIVERSAL POSITIONING:`, {
                patternStartX: patternStartX,
                patternStartY: patternStartY
            });
        }
    }
    
    // Set clip area - ONLY clip to the actual drawing area
    ctx.save();
    ctx.beginPath();
    ctx.rect(areaX, areaY, areaWidth, areaHeight);
    ctx.clip();
    
    const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
    
    // Draw pattern continuously across the full area using universal positioning
    if (panelIndex !== null) {
        // Section 1: Draw for specific panel but use continuous pattern positioning
        const numPanels = calculations.panelsNeeded;
        const totalPatternWidth = numPanels * stripWidthPixels;
        const totalHorizontalRepeats = Math.ceil(totalPatternWidth / repeatWidthPixels);
        
        if (isAlpine) {
            console.log(`🔄 ALPINE TULIP SECTION 1 CONTINUOUS PATTERN:`, {
                numPanels: numPanels,
                totalHorizontalRepeats: totalHorizontalRepeats
            });
        }
        
        // Draw all repeats that could be visible in this area
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels;
            const drawX = patternStartX + repeatX;
            
            // Calculate half-drop offset for this specific panel position
            const panelForThisRepeat = Math.floor(i * pattern.repeatWidth / pattern.panelWidth);
            const halfDropOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, panelForThisRepeat) * scale : 0;
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (isAlpine && i < 5) {
                    console.log(`🎨 ALPINE TULIP SECTION 1 REPEAT ${i}:`, {
                        drawX: drawX,
                        repeatX: repeatX,
                        halfDropOffset: halfDropOffset,
                        panelForThisRepeat: panelForThisRepeat
                    });
                }
                
                if (pattern.hasRepeatHeight) {
                    // Vertical repeating pattern with half-drop offset
                    // Add extra repeats to account for half-drop offset pushing pattern down
                    const extraRepeatsForHalfDrop = isHalfDrop ? 2 : 0;
                    const numVerticalRepeats = Math.ceil(drawHeight / repeatHeightPixels) + 3 + extraRepeatsForHalfDrop;
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels;
                        const drawY = patternStartY - repeatY - repeatHeightPixels - halfDropOffset;
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // Non-repeating pattern - position at bottom of pattern area with half-drop offset
                    const drawY = patternStartY - repeatHeightPixels - halfDropOffset;
                    
                    if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                        ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                    }
                }
            }
        }
    } else {
        // Section 2: Draw continuously using the same universal positioning system
        const numPanels = calculations.panelsNeeded;
        const totalPatternWidth = numPanels * stripWidthPixels;
        const totalHorizontalRepeats = Math.ceil(totalPatternWidth / repeatWidthPixels);
        
        if (isAlpine) {
            console.log(`🌷 ALPINE TULIP SECTION 2 CONTINUOUS PATTERN:`, {
                numPanels: numPanels,
                totalHorizontalRepeats: totalHorizontalRepeats
            });
        }
        
        // Draw all repeats continuously using universal coordinates
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels;
            const drawX = patternStartX + repeatX;
            
            // Calculate half-drop offset for this specific panel position (same logic as Section 1)
            const panelForThisRepeat = Math.floor(i * pattern.repeatWidth / pattern.panelWidth);
            const halfDropOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, panelForThisRepeat) * scale : 0;
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (isAlpine && i < 5) {
                    console.log(`🎨 ALPINE TULIP SECTION 2 REPEAT ${i}:`, {
                        drawX: drawX,
                        repeatX: repeatX,
                        halfDropOffset: halfDropOffset,
                        panelForThisRepeat: panelForThisRepeat
                    });
                }
                
                if (pattern.hasRepeatHeight) {
                    // Vertical repeating pattern with half-drop offset
                    // Add extra repeats to account for half-drop offset pushing pattern down
                    const extraRepeatsForHalfDrop = isHalfDrop ? 2 : 0;
                    const numVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels) + 3 + extraRepeatsForHalfDrop;
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels;
                        const drawY = patternStartY - repeatY - repeatHeightPixels - halfDropOffset;
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // Non-repeating pattern - maintain same Y position as Section 1 with half-drop offset
                    const drawY = patternStartY - repeatHeightPixels - halfDropOffset;
                    
                    if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                        ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                    }
                }
            }
        }
    }
    
    ctx.restore();
}

window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
