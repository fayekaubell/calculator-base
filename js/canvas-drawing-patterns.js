// Canvas Drawing Patterns Module - FIXED: No gaps, exact positioning

function calculateHalfDropVisualOffset(pattern, panelIndex) {
    return 0;
}

function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, panelIndex = null) {
    const { pattern, calculations } = currentPreview;
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // DEBUG: Log basic info for Alpine Tulip
    const isAlpine = pattern.name.toLowerCase().includes('alpine tulip');
    if (isAlpine) {
        console.log(`🌷 ALPINE TULIP FIXED - ${isSection2 ? 'Section 2' : 'Section 1'} Panel ${panelIndex}:`, {
            areaX: areaX,
            areaY: areaY, 
            areaWidth: areaWidth,
            areaHeight: areaHeight,
            patternRepeatWidth: pattern.repeatWidth,
            patternPanelWidth: pattern.panelWidth,
            scale: scale
        });
    }
    
    // Calculate repeat size to fit perfectly within strip width
    const stripWidthPixels = pattern.panelWidth * scale;
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth; // For Alpine Tulip: 27/9 = 3
    const repeatWidthPixels = stripWidthPixels / repeatsPerStrip; // EXACT fit, no rounding
    const repeatHeightPixels = (pattern.repeatHeight / pattern.repeatWidth) * repeatWidthPixels; // Maintain aspect ratio
    
    // DEBUG for Alpine Tulip
    if (isAlpine) {
        console.log(`🎯 ALPINE TULIP FIXED CALCULATIONS:`, {
            stripWidthPixels: stripWidthPixels,
            repeatsPerStrip: repeatsPerStrip,
            exactRepeatWidth: repeatWidthPixels,
            exactRepeatHeight: repeatHeightPixels,
            calculation: `${stripWidthPixels} ÷ ${repeatsPerStrip} = ${repeatWidthPixels} EXACT pixels per repeat`
        });
    }
    
    const offsetPerPanel = (pattern.sequenceLength === 0 || pattern.sequenceLength === 1) ? 0 : 
        pattern.repeatWidth / pattern.sequenceLength;
    
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    // Set clip area - ONLY clip to the actual drawing area, not individual panels
    ctx.save();
    ctx.beginPath();
    ctx.rect(areaX, areaY, areaWidth, areaHeight);
    ctx.clip();
    
    const patternOriginX = referenceCoords.section1.patternStartX;
    const patternOriginY = referenceCoords.section1.patternStartY;
    
    let coordinateOffsetX = 0;
    let coordinateOffsetY = 0;
    
    if (isSection2) {
        coordinateOffsetX = referenceCoords.section2.wallStartX - referenceCoords.section1.wallStartX;
        coordinateOffsetY = referenceCoords.section2.wallStartY - referenceCoords.section1.wallStartY;
    }
    
    const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
    
    // FIXED: Instead of drawing panel-by-panel, draw continuously across the full area
    if (panelIndex !== null) {
        // Section 1: Draw for specific panel but use continuous pattern positioning
        const numPanels = calculations.panelsNeeded;
        const totalPatternWidth = numPanels * stripWidthPixels;
        const totalHorizontalRepeats = Math.ceil(totalPatternWidth / repeatWidthPixels);
        
        if (isAlpine) {
            console.log(`🔄 ALPINE TULIP CONTINUOUS PATTERN:`, {
                numPanels: numPanels,
                totalPatternWidth: totalPatternWidth,
                totalHorizontalRepeats: totalHorizontalRepeats,
                targetPanel: panelIndex
            });
        }
        
        // Draw all repeats that could be visible in this area
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels; // EXACT positioning - NO ROUNDING
            const drawX = patternOriginX + repeatX; // EXACT positioning - NO ROUNDING
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (isAlpine && i < 10) {
                    console.log(`🎨 ALPINE TULIP CONTINUOUS REPEAT ${i}:`, {
                        repeatX: repeatX,
                        drawX: drawX,
                        exactRight: drawX + repeatWidthPixels,
                        areaRight: areaX + areaWidth,
                        willDraw: (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth)
                    });
                }
                
                if (pattern.hasRepeatHeight) {
                    // Vertical repeating pattern
                    const numVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels) + 1; // +1 to ensure full coverage
                    
                    if (isAlpine && i === 0) {
                        console.log(`🔄 ALPINE TULIP VERTICAL REPEATS:`, {
                            areaHeight: areaHeight,
                            repeatHeightPixels: repeatHeightPixels,
                            numVerticalRepeats: numVerticalRepeats
                        });
                    }
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels; // EXACT positioning - NO ROUNDING
                        const drawY = (areaY + areaHeight) - repeatY - repeatHeightPixels; // EXACT positioning - NO ROUNDING
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            if (isAlpine && i === 0 && v < 5) {
                                console.log(`🎨 ALPINE TULIP VERTICAL REPEAT ${v}:`, {
                                    repeatY: repeatY,
                                    drawY: drawY,
                                    exactBottom: drawY + repeatHeightPixels,
                                    areaBottom: areaY + areaHeight
                                });
                            }
                            
                            // FIXED: Use exact pixel dimensions - NO ROUNDING
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // Non-repeating pattern
                    const drawY = (areaY + areaHeight) - repeatHeightPixels; // EXACT positioning - NO ROUNDING
                    
                    if (isAlpine && i === 0) {
                        console.log(`🎨 ALPINE TULIP NON-REPEATING:`, {
                            areaBottom: areaY + areaHeight,
                            drawY: drawY,
                            repeatHeightPixels: repeatHeightPixels
                        });
                    }
                    
                    // FIXED: Use exact pixel dimensions - NO ROUNDING
                    ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                }
            }
        }
    } else {
        // Section 2: Draw continuously across the full wall area
        const numPanels = calculations.panelsNeeded;
        const totalPatternWidth = numPanels * stripWidthPixels;
        const totalHorizontalRepeats = Math.ceil(totalPatternWidth / repeatWidthPixels);
        
        if (isAlpine) {
            console.log(`🌷 ALPINE TULIP SECTION 2 CONTINUOUS:`, {
                numPanels: numPanels,
                totalPatternWidth: totalPatternWidth,
                totalHorizontalRepeats: totalHorizontalRepeats,
                coordinateOffsetX: coordinateOffsetX,
                coordinateOffsetY: coordinateOffsetY
            });
        }
        
        // Draw all repeats continuously
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels; // EXACT positioning - NO ROUNDING
            const drawX = patternOriginX + repeatX + coordinateOffsetX; // EXACT positioning - NO ROUNDING
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (pattern.hasRepeatHeight) {
                    const numVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels) + 1; // +1 to ensure full coverage
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels; // EXACT positioning - NO ROUNDING
                        const drawY = (areaY + areaHeight) - repeatY - repeatHeightPixels; // EXACT positioning - NO ROUNDING
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            // FIXED: Use exact pixel dimensions - NO ROUNDING
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // Non-repeating pattern - need to maintain alignment with Section 1
                    let drawY;
                    
                    if (isSection2) {
                        const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                        const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                        const section1PatternBottom = section1PanelBottom - repeatHeightPixels;
                        const patternOffsetFromWallBottom = section1WallBottom - (section1PatternBottom + repeatHeightPixels);
                        const section2WallBottom = areaY + areaHeight;
                        drawY = section2WallBottom - repeatHeightPixels - patternOffsetFromWallBottom; // EXACT positioning - NO ROUNDING
                    } else {
                        drawY = (areaY + areaHeight) - repeatHeightPixels; // EXACT positioning - NO ROUNDING
                    }
                    
                    // FIXED: Use exact pixel dimensions - NO ROUNDING
                    ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                }
            }
        }
    }
    
    ctx.restore();
}

window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
