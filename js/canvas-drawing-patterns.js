// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// CLEAN VERSION: Only essential debug for drawImage dimensions

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    return 0;
}

// Draw pattern with consistent coordinate system - CLEAN WITH TARGETED DEBUG
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
    
    // Handle yard patterns correctly
    const offsetPerPanel = (pattern.sequenceLength === 0 || pattern.sequenceLength === 1) ? 0 : 
        pattern.repeatWidth / pattern.sequenceLength;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    
    // Set clip area
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
    ctx.clip();
    
    // Use consistent pattern origin for both sections
    const patternOriginX = referenceCoords.section1.patternStartX;
    const patternOriginY = referenceCoords.section1.patternStartY;
    
    // For Section 2, calculate coordinate offset
    let coordinateOffsetX = 0;
    let coordinateOffsetY = 0;
    
    if (isSection2) {
        coordinateOffsetX = referenceCoords.section2.wallStartX - referenceCoords.section1.wallStartX;
        coordinateOffsetY = referenceCoords.section2.wallStartY - referenceCoords.section1.wallStartY;
    }
    
    // Calculate draw height
    const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
    
    // If drawing a specific panel (used in Section 1)
    if (panelIndex !== null) {
        // Calculate panel position
        const panelX = patternOriginX + (panelIndex * pattern.panelWidth * scale);
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        const panelWidth = pattern.panelWidth * scale;
        
        // For half-drop patterns that repeat within strip
        if (isHalfDrop && repeatsPerStrip > 1) {
            let xPos = 0;
            let columnIndex = 0;
            
            while (xPos < panelWidth) {
                const drawX = Math.floor(areaX + xPos);
                const columnOffset = (columnIndex % 2) * (repeatH / 2);
                
                if (pattern.hasRepeatHeight) {
                    const bottomY = areaY + areaHeight;
                    for (let y = 0 - columnOffset; y >= -areaHeight - repeatH - columnOffset; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    }
                } else {
                    const bottomY = areaY + areaHeight;
                    const drawY = Math.floor(bottomY - repeatH - columnOffset);
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
                
                xPos += repeatW;
                columnIndex++;
            }
        } else {
            // For straight match patterns like Alpine Tulip
            const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
            
            let patternOffsetY = 0;
            if (isFullWidthHalfDrop && panelIndex % 2 === 1) {
                patternOffsetY = -(repeatH / 2);
            }
            
            // Draw exactly the right number of repeats
            const maxRepeats = Math.floor(panelWidth / repeatW);
            
            for (let i = 0; i < maxRepeats; i++) {
                const x = i * repeatW;
                const drawX = Math.floor(areaX + x - (sourceOffsetX * scale));
                
                if (pattern.hasRepeatHeight) {
                    const bottomY = areaY + areaHeight;
                    const startY = patternOffsetY < 0 ? repeatH + patternOffsetY : 0 + patternOffsetY;
                    for (let y = startY; y >= -areaHeight - repeatH + patternOffsetY; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        
                        // CRITICAL DEBUG: Only for Alpine Tulip, only first repeat of first panel
                        if (pattern.name.toLowerCase().includes('alpine tulip') && panelIndex === 0 && i === 0) {
                            console.log(`✅ ALPINE TULIP FIXED - drawImage now using exact dimensions:`, {
                                exactRepeatW: repeatW,
                                exactRepeatH: repeatH,
                                drawnWidth: repeatW,
                                drawnHeight: repeatH,
                                previouslyDrawn: Math.ceil(repeatW) + ' (was causing clipping)'
                            });
                        }
                        
                                                            ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    }
                } else {
                    const bottomY = areaY + areaHeight;
                    const drawY = Math.floor(bottomY - repeatH + patternOffsetY);
                    
                    // CRITICAL DEBUG: Only for Alpine Tulip, only first repeat of first panel
                    if (pattern.name.toLowerCase().includes('alpine tulip') && panelIndex === 0 && i === 0) {
                        console.log(`✅ ALPINE TULIP FIXED - drawImage now using exact dimensions:`, {
                            exactRepeatW: repeatW,
                            exactRepeatH: repeatH,
                            drawnWidth: repeatW,
                            drawnHeight: repeatH,
                            previouslyDrawn: Math.ceil(repeatW) + ' (was causing clipping)'
                        });
                    }
                    
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
    } else {
        // Section 2 logic - drawing all panels
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const panelX = patternOriginX + (i * pattern.panelWidth * scale);
            
            let drawPanelX = panelX + coordinateOffsetX;
            let drawPanelY;
            
            if (isSection2) {
                const section1PanelBottom = patternOriginY + referenceCoords.dimensions.scaledTotalHeight;
                const section2WallBottom = areaY + areaHeight;
                drawPanelY = section2WallBottom - referenceCoords.dimensions.scaledTotalHeight;
            } else {
                drawPanelY = patternOriginY;
            }
            
            const sequencePosition = pattern.sequenceLength === 0 ? 0 : i % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            const panelWidth = pattern.panelWidth * scale;
            
            // For half-drop patterns that repeat within strip
            if (isHalfDrop && repeatsPerStrip > 1) {
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    if (drawX + repeatW >= areaX && drawX < areaX + areaWidth) {
                        const globalX = (drawPanelX + x - patternOriginX - coordinateOffsetX) / repeatW;
                        const globalColumnIndex = Math.floor(globalX);
                        const columnOffset = (globalColumnIndex % 2) * (repeatH / 2);
                        
                        if (pattern.hasRepeatHeight) {
                            const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                            for (let y = 0 - columnOffset; y >= -referenceCoords.dimensions.scaledTotalHeight - repeatH - columnOffset; y -= repeatH) {
                                const drawY = Math.floor(panelBottom + y - repeatH);
                                if (drawY + repeatH >= areaY && drawY < areaY + areaHeight) {
                                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                                }
                            }
                        }
                    }
                }
            } else {
                // For straight match patterns in Section 2
                const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
                const maxRepeats = Math.floor(panelWidth / repeatW);
                
                for (let r = 0; r < maxRepeats; r++) {
                    const x = r * repeatW;
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    let patternOffsetY = 0;
                    if (isFullWidthHalfDrop && i % 2 === 1) {
                        patternOffsetY = -(repeatH / 2);
                    }
                    
                    if (pattern.hasRepeatHeight) {
                        const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                        const startY = patternOffsetY < 0 ? repeatH + patternOffsetY : 0 + patternOffsetY;
                        for (let y = startY; y >= -referenceCoords.dimensions.scaledTotalHeight - repeatH + patternOffsetY; y -= repeatH) {
                            const drawY = Math.floor(panelBottom + y - repeatH);
                            if (drawY + repeatH >= areaY && drawY < areaY + areaHeight) {
                                ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                            }
                        }
                    } else {
                        let drawY;
                        
                        if (isSection2) {
                            const section1PanelBottom = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
                            const section1WallBottom = referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight;
                            const section1PatternBottom = section1PanelBottom - repeatH;
                            const patternOffsetFromWallBottom = section1WallBottom - (section1PatternBottom + repeatH);
                            const section2WallBottom = areaY + areaHeight;
                            drawY = Math.floor(section2WallBottom - repeatH - patternOffsetFromWallBottom + patternOffsetY);
                        } else {
                            const panelBottom = drawPanelY + drawHeight;
                            drawY = Math.floor(panelBottom - repeatH + patternOffsetY);
                        }
                        
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
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
