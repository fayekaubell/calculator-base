// Canvas Drawing Patterns Module - SIMPLE auto-sizing approach
// Each repeat automatically sizes to fit perfectly within strip width

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
    
    // SIMPLE: Calculate repeat size based on strip width divided by number of repeats
    const stripWidthPixels = pattern.panelWidth * scale;
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth; // For Alpine Tulip: 27/9 = 3
    const repeatWidthPixels = stripWidthPixels / repeatsPerStrip; // Exact fit, no fractions
    const repeatHeightPixels = (pattern.repeatHeight / pattern.repeatWidth) * repeatWidthPixels; // Maintain aspect ratio
    
    // DEBUG for Alpine Tulip
    if (pattern.name.toLowerCase().includes('alpine tulip') && panelIndex === 0) {
        console.log(`🔥 SIMPLE ALPINE TULIP:`, {
            stripWidthPixels: stripWidthPixels,
            repeatsPerStrip: repeatsPerStrip,
            repeatWidthPixels: repeatWidthPixels,
            repeatHeightPixels: repeatHeightPixels,
            calculation: `${stripWidthPixels} ÷ ${repeatsPerStrip} = ${repeatWidthPixels} pixels per repeat`
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
        
        // SIMPLE: Draw exactly the number of repeats that fit, each at exact size
        const numRepeats = Math.round(repeatsPerStrip); // For Alpine Tulip: 3
        
        for (let i = 0; i < numRepeats; i++) {
            const repeatX = i * repeatWidthPixels;
            const drawX = Math.floor(areaX + repeatX - (sourceOffsetX * scale));
            
            if (pattern.hasRepeatHeight) {
                // Vertical repeating pattern
                const bottomY = areaY + areaHeight;
                const numVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels);
                
                for (let v = 0; v < numVerticalRepeats; v++) {
                    const repeatY = v * repeatHeightPixels;
                    const drawY = Math.floor(bottomY - repeatY - repeatHeightPixels);
                    
                    if (pattern.name.toLowerCase().includes('alpine tulip') && panelIndex === 0 && i === 0 && v === 0) {
                        console.log(`✅ SIMPLE drawImage - perfect fit:`, {
                            drawWidth: Math.round(repeatWidthPixels),
                            drawHeight: Math.round(repeatHeightPixels),
                            position: `${drawX}, ${drawY}`
                        });
                    }
                    
                    ctx.drawImage(patternImage, drawX, drawY, Math.round(repeatWidthPixels), Math.round(repeatHeightPixels));
                }
            } else {
                // Non-repeating pattern
                const bottomY = areaY + areaHeight;
                const drawY = Math.floor(bottomY - repeatHeightPixels);
                
                if (pattern.name.toLowerCase().includes('alpine tulip') && panelIndex === 0 && i === 0) {
                    console.log(`✅ SIMPLE drawImage - perfect fit:`, {
                        drawWidth: Math.round(repeatWidthPixels),
                        drawHeight: Math.round(repeatHeightPixels),
                        position: `${drawX}, ${drawY}`
                    });
                }
                
                ctx.drawImage(patternImage, drawX, drawY, Math.round(repeatWidthPixels), Math.round(repeatHeightPixels));
            }
        }
    } else {
        // Section 2 - drawing all panels
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
            
            // SIMPLE: Same logic for Section 2
            const numRepeats = Math.round(repeatsPerStrip);
            
            for (let i = 0; i < numRepeats; i++) {
                const repeatX = i * repeatWidthPixels;
                const drawX = Math.floor(drawPanelX + repeatX - (sourceOffsetX * scale));
                
                if (pattern.hasRepeatHeight) {
                    const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                    const numVerticalRepeats = Math.ceil(referenceCoords.dimensions.scaledTotalHeight / repeatHeightPixels);
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels;
                        const drawY = Math.floor(panelBottom - repeatY - repeatHeightPixels);
                        
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            ctx.drawImage(patternImage, drawX, drawY, Math.round(repeatWidthPixels), Math.round(repeatHeightPixels));
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
                    
                    ctx.drawImage(patternImage, drawX, drawY, Math.round(repeatWidthPixels), Math.round(repeatHeightPixels));
                }
            }
        }
    }
    
    ctx.restore();
}

window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
