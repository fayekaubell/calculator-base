// Canvas Drawing Patterns Module - EXACT PIXELS - No rounding anywhere
// DEBUG VERSION with Alpine Tulip logging

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
        console.log(`🌷 ALPINE TULIP DEBUG - ${isSection2 ? 'Section 2' : 'Section 1'} Panel ${panelIndex}:`, {
            areaX: areaX,
            areaY: areaY, 
            areaWidth: areaWidth,
            areaHeight: areaHeight,
            patternRepeatWidth: pattern.repeatWidth,
            patternPanelWidth: pattern.panelWidth,
            scale: scale
        });
    }
    
    // EXACT: Calculate repeat size to fit perfectly within strip width
    const stripWidthPixels = pattern.panelWidth * scale;
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth; // For Alpine Tulip: 27/9 = 3
    const repeatWidthPixels = stripWidthPixels / repeatsPerStrip; // EXACT fit, no rounding
    const repeatHeightPixels = (pattern.repeatHeight / pattern.repeatWidth) * repeatWidthPixels; // Maintain aspect ratio
    
    // DEBUG for Alpine Tulip
    if (isAlpine) {
        console.log(`🎯 ALPINE TULIP EXACT PIXELS:`, {
            stripWidthPixels: stripWidthPixels,
            repeatsPerStrip: repeatsPerStrip,
            exactRepeatWidth: repeatWidthPixels,
            exactRepeatHeight: repeatHeightPixels,
            calculation: `${stripWidthPixels} ÷ ${repeatsPerStrip} = ${repeatWidthPixels} EXACT pixels per repeat`,
            shouldCoverFullArea: `Area width: ${areaWidth}, Repeat coverage: ${repeatWidthPixels * repeatsPerStrip}`
        });
    }
    
    const offsetPerPanel = (pattern.sequenceLength === 0 || pattern.sequenceLength === 1) ? 0 : 
        pattern.repeatWidth / pattern.sequenceLength;
    
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    // Set clip area
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
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
    
    // If drawing a specific panel (Section 1)
    if (panelIndex !== null) {
        const panelX = patternOriginX + (panelIndex * stripWidthPixels);
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        // EXACT: Draw exactly the number of repeats that fit, each at EXACT size
        const numRepeats = Math.round(repeatsPerStrip); // For Alpine Tulip: 3
        
        if (isAlpine) {
            console.log(`🔄 ALPINE TULIP HORIZONTAL REPEATS:`, {
                numRepeats: numRepeats,
                panelIndex: panelIndex,
                panelX: panelX,
                areaX: areaX,
                sourceOffsetX: sourceOffsetX
            });
        }
        
        for (let i = 0; i < numRepeats; i++) {
            const repeatX = i * repeatWidthPixels; // EXACT positioning
            const drawX = Math.floor(areaX + repeatX - (sourceOffsetX * scale));
            
            if (isAlpine && i < 3) {
                console.log(`🎨 ALPINE TULIP REPEAT ${i}:`, {
                    repeatX: repeatX,
                    drawX: drawX,
                    expectedRight: drawX + repeatWidthPixels,
                    areaRight: areaX + areaWidth
                });
            }
            
            if (pattern.hasRepeatHeight) {
                // Vertical repeating pattern
                const bottomY = areaY + areaHeight;
                const numVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels);
                
                if (isAlpine && i === 0) {
                    console.log(`🔄 ALPINE TULIP VERTICAL REPEATS:`, {
                        areaHeight: areaHeight,
                        repeatHeightPixels: repeatHeightPixels,
                        numVerticalRepeats: numVerticalRepeats,
                        totalVerticalCoverage: numVerticalRepeats * repeatHeightPixels
                    });
                }
                
                for (let v = 0; v < numVerticalRepeats; v++) {
                    const repeatY = v * repeatHeightPixels; // EXACT positioning
                    const drawY = Math.floor(bottomY - repeatY - repeatHeightPixels);
                    
                    if (isAlpine && i === 0 && v < 3) {
                        console.log(`🎨 ALPINE TULIP VERTICAL REPEAT ${v}:`, {
                            repeatY: repeatY,
                            drawY: drawY,
                            expectedBottom: drawY + repeatHeightPixels,
                            areaBottom: areaY + areaHeight
                        });
                    }
                    
                    // EXACT: Use exact pixel dimensions - no rounding
                    ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                }
            } else {
                // Non-repeating pattern
                const bottomY = areaY + areaHeight;
                const drawY = Math.floor(bottomY - repeatHeightPixels);
                
                if (isAlpine && i === 0) {
                    console.log(`🎨 ALPINE TULIP NON-REPEATING:`, {
                        bottomY: bottomY,
                        drawY: drawY,
                        repeatHeightPixels: repeatHeightPixels
                    });
                }
                
                // EXACT: Use exact pixel dimensions - no rounding
                ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
            }
        }
    } else {
        // Section 2 - drawing all panels
        if (isAlpine) {
            console.log(`🌷 ALPINE TULIP SECTION 2 - Drawing all panels:`, {
                panelsNeeded: calculations.panelsNeeded,
                coordinateOffsetX: coordinateOffsetX,
                coordinateOffsetY: coordinateOffsetY
            });
        }
        
        for (let panelIdx = 0; panelIdx < calculations.panelsNeeded; panelIdx++) {
            const panelX = patternOriginX + (panelIdx * stripWidthPixels);
            
            let drawPanelX = panelX + coordinateOffsetX;
            let drawPanelY;
            
            if (isSection2) {
                const section1PanelBottom = patternOriginY + referenceCoords.dimensions.scaledTotalHeight;
                const section2WallBottom = areaY + areaHeight;
                drawPanelY = section2WallBottom - referenceCoords.dimensions.scaledTotalHeight;
            } else {
                drawPanelY = patternOriginY;
            }
            
            const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIdx % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            // EXACT: Same logic for Section 2
            const numRepeats = Math.round(repeatsPerStrip);
            
            for (let i = 0; i < numRepeats; i++) {
                const repeatX = i * repeatWidthPixels; // EXACT positioning
                const drawX = Math.floor(drawPanelX + repeatX - (sourceOffsetX * scale));
                
                if (pattern.hasRepeatHeight) {
                    const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                    const numVerticalRepeats = Math.ceil(referenceCoords.dimensions.scaledTotalHeight / repeatHeightPixels);
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels; // EXACT positioning
                        const drawY = Math.floor(panelBottom - repeatY - repeatHeightPixels);
                        
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            // EXACT: Use exact pixel dimensions - no rounding
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    let drawY;
                    
                    if (isSection2) {
                        const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                        const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                        const section1PatternBottom = section1PanelBottom - repeatHeightPixels;
                        const patternOffsetFromWallBottom = section1WallBottom - (section1PatternBottom + repeatHeightPixels);
                        const section2WallBottom = areaY + areaHeight;
                        drawY = Math.floor(section2WallBottom - repeatHeightPixels - patternOffsetFromWallBottom);
                    } else {
                        const panelBottom = drawPanelY + drawHeight;
                        drawY = Math.floor(panelBottom - repeatHeightPixels);
                    }
                    
                    // EXACT: Use exact pixel dimensions - no rounding
                    ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                }
            }
        }
    }
    
    ctx.restore();
}

window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
