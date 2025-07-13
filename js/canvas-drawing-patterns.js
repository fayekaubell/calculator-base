// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// Part 2 of modularized canvas drawing system
// REVERTED to maintain alignment, with careful half-drop additions
// ADDED: Comprehensive debug logging for Alpine Tulip pattern

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    // No visual offset for strips - they all align at the same height
    // The pattern offset is handled internally in drawPatternInArea
    return 0;
}

// Draw pattern with consistent coordinate system - RESTORED ORIGINAL WITH HALF-DROP + DEBUG
function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, panelIndex = null) {
    const { pattern, calculations } = currentPreview;
    
    // DEBUG: Alpine Tulip specific logging
    const isAlpineTulip = pattern.name.toLowerCase().includes('alpine tulip');
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP DEBUG - drawPatternInArea called:`, {
            patternName: pattern.name,
            isSection2: isSection2,
            panelIndex: panelIndex,
            areaX: areaX,
            areaY: areaY,
            areaWidth: areaWidth,
            areaHeight: areaHeight,
            scale: referenceCoords.scale
        });
        
        console.log(`🌷 ALPINE TULIP - Pattern properties:`, {
            repeatWidth: pattern.repeatWidth,
            repeatHeight: pattern.repeatHeight,
            panelWidth: pattern.panelWidth,
            saleType: pattern.saleType,
            hasRepeatHeight: pattern.hasRepeatHeight,
            patternMatch: pattern.patternMatch,
            sequenceLength: pattern.sequenceLength
        });
    }
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // Calculate pattern dimensions
    const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
        (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
    const repeatH = pattern.repeatHeight * scale;
    
    // DEBUG: Alpine Tulip repeat calculations
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP - Repeat calculations:`, {
            originalRepeatW: pattern.repeatWidth,
            originalRepeatH: pattern.repeatHeight,
            scale: scale,
            scaledRepeatW: repeatW,
            scaledRepeatH: repeatH,
            calculationPath: pattern.saleType === 'yard' ? 'yard: pattern.repeatWidth * scale' : 'panel path'
        });
    }
    
    // Handle yard patterns (sequenceLength = 0) correctly
    const offsetPerPanel = (pattern.sequenceLength === 0 || pattern.sequenceLength === 1) ? 0 : 
        pattern.repeatWidth / pattern.sequenceLength;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    
    // DEBUG: Alpine Tulip pattern analysis
    if (isAlpineTulip) {
        console.log(`🌷 ALPINE TULIP - Pattern analysis:`, {
            offsetPerPanel: offsetPerPanel,
            isHalfDrop: isHalfDrop,
            repeatsPerStrip: repeatsPerStrip,
            expectedRepeatsPerStrip: pattern.panelWidth / pattern.repeatWidth,
            panelWidth: pattern.panelWidth,
            repeatWidth: pattern.repeatWidth
        });
    }
    
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
        
        if (isAlpineTulip) {
            console.log(`🌷 ALPINE TULIP - Section 2 coordinate offsets:`, {
                coordinateOffsetX: coordinateOffsetX,
                coordinateOffsetY: coordinateOffsetY,
                section1WallStartX: referenceCoords.section1.wallStartX,
                section2WallStartX: referenceCoords.section2.wallStartX,
                section1WallStartY: referenceCoords.section1.wallStartY,
                section2WallStartY: referenceCoords.section2.wallStartY
            });
        }
    }
    
    // Calculate draw height first (needed for coordinate calculations)
    const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
    
    // If drawing a specific panel (used in Section 1)
    if (panelIndex !== null) {
        if (isAlpineTulip) {
            console.log(`🌷 ALPINE TULIP - Drawing specific panel ${panelIndex}`);
        }
        
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
        
        if (isAlpineTulip) {
            console.log(`🌷 ALPINE TULIP - Panel ${panelIndex} calculations:`, {
                panelX: panelX,
                panelWidth: panelWidth,
                scaledPanelWidth: pattern.panelWidth * scale,
                sourceOffsetX: sourceOffsetX,
                sequencePosition: sequencePosition
            });
        }
        
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
                    // Start from 0 to align bottom of first repeat with bottom of panel
                    for (let y = 0 - columnOffset; y >= -offsetAreaHeight - repeatH - columnOffset; y -= repeatH) {
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
            // For full-width patterns or straight match - ALPINE TULIP WILL USE THIS PATH
            const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
            
            // Calculate pattern offset for even strips in full-width half-drop
            let patternOffsetY = 0;
            if (isFullWidthHalfDrop && panelIndex % 2 === 1) { // Even strips (2, 4, 6)
                patternOffsetY = -(repeatH / 2); // Shift pattern up by half repeat
            }
            
            if (isAlpineTulip) {
                console.log(`🌷 ALPINE TULIP - About to draw repeats for panel ${panelIndex}:`, {
                    isFullWidthHalfDrop: isFullWidthHalfDrop,
                    patternOffsetY: patternOffsetY,
                    hasRepeatHeight: pattern.hasRepeatHeight,
                    repeatW: repeatW,
                    repeatH: repeatH,
                    panelWidth: panelWidth
                });
            }
            
            // Draw pattern repeats
            let repeatIndex = 0;
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                const drawX = Math.floor(areaX + x - (sourceOffsetX * scale));
                
                if (isAlpineTulip) {
                    console.log(`🌷 ALPINE TULIP - Drawing repeat ${repeatIndex} for panel ${panelIndex}:`, {
                        x: x,
                        drawX: drawX,
                        sourceOffsetX: sourceOffsetX,
                        scaledSourceOffset: sourceOffsetX * scale,
                        repeatW: repeatW,
                        willDraw: drawX >= areaX - repeatW && drawX < areaX + areaWidth
                    });
                }
                
                if (pattern.hasRepeatHeight) {
                    // Start from bottom of panel area
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    // First repeat bottom-left corner aligns with panel bottom-left
                    // For offset patterns, we need to start lower to ensure coverage
                    const startY = patternOffsetY < 0 ? repeatH + patternOffsetY : 0 + patternOffsetY;
                    let verticalRepeatIndex = 0;
                    for (let y = startY; y >= -offsetAreaHeight - repeatH + patternOffsetY; y -= repeatH) {
                        const drawY = Math.floor(bottomY + y - repeatH);
                        
                        if (isAlpineTulip) {
                            console.log(`🌷 ALPINE TULIP - Drawing vertical repeat ${verticalRepeatIndex} of repeat ${repeatIndex}:`, {
                                y: y,
                                drawY: drawY,
                                bottomY: bottomY,
                                repeatH: repeatH,
                                willDraw: true
                            });
                        }
                        
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                        verticalRepeatIndex++;
                    }
                } else {
                    // Non-repeating pattern - position at bottom with offset
                    const bottomY = offsetAreaY + offsetAreaHeight;
                    const drawY = Math.floor(bottomY - repeatH + patternOffsetY);
                    
                    if (isAlpineTulip) {
                        console.log(`🌷 ALPINE TULIP - Drawing non-repeating pattern:`, {
                            drawY: drawY,
                            bottomY: bottomY,
                            repeatH: repeatH,
                            patternOffsetY: patternOffsetY
                        });
                    }
                    
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
                repeatIndex++;
            }
        }
    } else {
        // Original logic for drawing all panels (used in Section 2) - RESTORED
        if (isAlpineTulip) {
            console.log(`🌷 ALPINE TULIP - Drawing all panels for Section 2, total panels: ${calculations.panelsNeeded}`);
        }
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            // Calculate panel position in the reference coordinate system
            const panelX = patternOriginX + (i * pattern.panelWidth * scale);
            
            // Pattern always starts from bottom of panels
            let drawPanelX = panelX + coordinateOffsetX;
            let drawPanelY;
            
            // For Section 2, we need to position the panels to maintain pattern alignment
            if (isSection2) {
                // The wall bottom in Section 2 should align with strip bottom in Section 1
                // So we position the panel top accordingly
                const section1PanelBottom = patternOriginY + referenceCoords.dimensions.scaledTotalHeight;
                const section2WallBottom = areaY + areaHeight;
                
                // Panel bottom should align with wall bottom
                drawPanelY = section2WallBottom - referenceCoords.dimensions.scaledTotalHeight;
            } else {
                drawPanelY = patternOriginY;
            }
            
            if (isAlpineTulip && i === 0) {
                console.log(`🌷 ALPINE TULIP - Section 2 panel positioning:`, {
                    panelX: panelX,
                    drawPanelX: drawPanelX,
                    drawPanelY: drawPanelY,
                    coordinateOffsetX: coordinateOffsetX,
                    coordinateOffsetY: coordinateOffsetY
                });
            }
            
            // Calculate sequence offset for panel patterns
            const sequencePosition = pattern.sequenceLength === 0 ? 0 : i % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            // Draw pattern repeats for this panel
            const panelWidth = pattern.panelWidth * scale;
            
            // For half-drop patterns that repeat within strip in Section 2
            if (isHalfDrop && repeatsPerStrip > 1) {
                // Need to maintain the half-drop pattern as it appears
                let xPos = 0;
                // Calculate starting column index based on panel position
                let columnIndex = 0;
                
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    // Only draw if within the clipped area
                    if (drawX + repeatW >= areaX && drawX < areaX + areaWidth) {
                        // Calculate which column we're in across all panels
                        const globalX = (drawPanelX + x - patternOriginX - coordinateOffsetX) / repeatW;
                        const globalColumnIndex = Math.floor(globalX);
                        const columnOffset = (globalColumnIndex % 2) * (repeatH / 2);
                        
                        if (pattern.hasRepeatHeight) {
                            // Use the full panel height for consistent positioning
                            const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                            // Start from 0 to match Section 1 alignment
                            for (let y = 0 - columnOffset; y >= -referenceCoords.dimensions.scaledTotalHeight - repeatH - columnOffset; y -= repeatH) {
                                const drawY = Math.floor(panelBottom + y - repeatH);
                                // Only draw if within the visible area
                                if (drawY + repeatH >= areaY && drawY < areaY + areaHeight) {
                                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                                }
                            }
                        }
                    }
                }
            } else {
                // For full-width half-drop or straight match patterns - ALPINE TULIP SECTION 2 PATH
                const isFullWidthHalfDrop = isHalfDrop && repeatsPerStrip <= 1;
                
                if (isAlpineTulip && i === 0) {
                    console.log(`🌷 ALPINE TULIP - Section 2 repeat drawing for panel ${i}:`, {
                        isFullWidthHalfDrop: isFullWidthHalfDrop,
                        panelWidth: panelWidth,
                        repeatW: repeatW
                    });
                }
                
                let repeatIndex = 0;
                for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                    const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
                    
                    // Calculate pattern offset for even strips in full-width half-drop
                    let patternOffsetY = 0;
                    if (isFullWidthHalfDrop && i % 2 === 1) { // Even strips (2, 4, 6)
                        patternOffsetY = -(repeatH / 2); // Shift pattern up by half repeat
                    }
                    
                    if (isAlpineTulip && i === 0) {
                        console.log(`🌷 ALPINE TULIP - Section 2 repeat ${repeatIndex} for panel ${i}:`, {
                            x: x,
                            drawX: drawX,
                            sourceOffsetX: sourceOffsetX,
                            patternOffsetY: patternOffsetY
                        });
                    }
                    
                    if (pattern.hasRepeatHeight) {
                        // Use the full panel height for consistent positioning
                        const panelBottom = drawPanelY + referenceCoords.dimensions.scaledTotalHeight;
                        // Tile upward from bottom with pattern offset
                        // For offset patterns, start lower to ensure coverage
                        const startY = patternOffsetY < 0 ? repeatH + patternOffsetY : 0 + patternOffsetY;
                        let verticalRepeatIndex = 0;
                        for (let y = startY; y >= -referenceCoords.dimensions.scaledTotalHeight - repeatH + patternOffsetY; y -= repeatH) {
                            const drawY = Math.floor(panelBottom + y - repeatH);
                            // Only draw if within the visible area
                            if (drawY + repeatH >= areaY && drawY < areaY + areaHeight) {
                                if (isAlpineTulip && i === 0 && repeatIndex === 0) {
                                    console.log(`🌷 ALPINE TULIP - Section 2 vertical repeat ${verticalRepeatIndex}:`, {
                                        y: y,
                                        drawY: drawY,
                                        panelBottom: panelBottom,
                                        repeatH: repeatH,
                                        withinArea: drawY + repeatH >= areaY && drawY < areaY + areaHeight
                                    });
                                }
                                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                            }
                            verticalRepeatIndex++;
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
                            drawY = Math.floor(section2WallBottom - repeatH - patternOffsetFromWallBottom + patternOffsetY);
                        } else {
                            // Section 1: Position pattern at bottom of PANEL
                            const panelBottom = drawPanelY + drawHeight;
                            drawY = Math.floor(panelBottom - repeatH + patternOffsetY);
                        }
                        
                        if (isAlpineTulip && i === 0 && repeatIndex === 0) {
                            console.log(`🌷 ALPINE TULIP - Section 2 non-repeating pattern:`, {
                                drawY: drawY,
                                patternOffsetY: patternOffsetY
                            });
                        }
                        
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                    repeatIndex++;
                }
            }
        }
    }
    
    ctx.restore();
}

// Export functions to global scope for use in other modules
window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.drawPatternInArea = drawPatternInArea;
