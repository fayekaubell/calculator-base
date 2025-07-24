// Canvas Drawing Patterns Module - UPDATED: Multi-repeat half-drop pattern support  
// FIXED: Non-repeating patterns anchor to panel bottom while panels stay centered

function calculateHalfDropVisualOffset(pattern, panelIndex) {
    // Calculate half-drop offset for patterns that need it
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    if (!isHalfDrop) return 0;
    
    // Calculate repeats per panel
    const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
    
    console.log(`🔄 Half-drop calculation for ${pattern.name}:`, {
        panelIndex,
        repeatsPerPanel,
        panelWidth: pattern.panelWidth,
        repeatWidth: pattern.repeatWidth
    });
    
    // NEW LOGIC: Multi-repeat vs single-repeat behavior
    if (repeatsPerPanel >= 2) {
        // Multi-repeat patterns: No panel-level offset
        // Individual tiles within panels will be handled in drawPatternInArea
        console.log(`📐 Multi-repeat half-drop: Panel ${panelIndex} gets NO panel offset`);
        return 0;
    } else {
        // Single-repeat patterns: Alternate panel offset (existing behavior)
        const isOddPanel = panelIndex % 2 === 1;
        const offset = isOddPanel ? pattern.repeatHeight / 2 : 0;
        console.log(`📐 Single-repeat half-drop: Panel ${panelIndex} gets ${offset}" offset`);
        return offset;
    }
}

function calculateTileOffsetWithinPanel(pattern, tileIndex) {
    // NEW FUNCTION: Calculate offset for individual tiles within a panel
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    if (!isHalfDrop) return 0;
    
    const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
    
    if (repeatsPerPanel >= 2) {
        // Multi-repeat patterns: Alternate tiles within panel
        const isOddTile = tileIndex % 2 === 1;
        const offset = isOddTile ? pattern.repeatHeight / 2 : 0;
        console.log(`🎯 Tile ${tileIndex} within panel gets ${offset}" offset`);
        return offset;
    }
    
    // Single-repeat patterns: No tile-level offset (handled at panel level)
    return 0;
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
    const repeatsPerPanel = pattern.panelWidth / pattern.repeatWidth;
    
    // Enhanced logging for half-drop patterns
    if (isHalfDrop) {
        console.log(`🌟 HALF-DROP PATTERN: ${pattern.name} - ${isSection2 ? 'Section 2' : 'Section 1'} Panel ${panelIndex}:`, {
            repeatsPerPanel: repeatsPerPanel,
            isMultiRepeat: repeatsPerPanel >= 2,
            areaX: areaX,
            areaY: areaY, 
            areaWidth: areaWidth,
            areaHeight: areaHeight
        });
    }
    
    // FIXED: For non-repeating patterns, always use the pattern's full repeatHeight
    const drawingRepeatHeight = pattern.repeatHeight; // Always use the full height (180" for Moon patterns)
    
    // Calculate repeat size to fit perfectly within strip width
    const stripWidthPixels = pattern.panelWidth * scale;
    const repeatWidthPixels = stripWidthPixels / repeatsPerPanel;
    const repeatHeightPixels = (drawingRepeatHeight / pattern.repeatWidth) * repeatWidthPixels;
    
    // Log the scaling for non-repeating patterns
    if (!pattern.hasRepeatHeight) {
        console.log(`🌙 Non-repeating pattern ${pattern.name}: Drawing at full height within panel`, {
            patternRepeatHeight: pattern.repeatHeight,
            drawingRepeatHeight: drawingRepeatHeight,
            repeatHeightPixels: repeatHeightPixels,
            calculatedPanelHeight: calculations.totalHeight,
            panelAreaHeight: areaHeight,
            note: 'Pattern will be bottom-anchored within the panel area'
        });
    }
    
    // UNIVERSAL COORDINATE SYSTEM
    const universalPatternOriginX = referenceCoords.section1.patternStartX;
    const universalPatternOriginY = referenceCoords.section1.patternStartY + referenceCoords.dimensions.scaledTotalHeight;
    
    // Calculate where the wall sits within this universal pattern grid for Section 1
    const section1WallRelativeX = referenceCoords.section1.wallStartX - universalPatternOriginX;
    const section1WallRelativeY = universalPatternOriginY - (referenceCoords.section1.wallStartY + referenceCoords.dimensions.scaledWallHeight);
    
    if (isHalfDrop) {
        console.log(`🎯 HALF-DROP UNIVERSAL COORDINATES:`, {
            universalPatternOriginX: universalPatternOriginX,
            universalPatternOriginY: universalPatternOriginY,
            section1WallRelativeX: section1WallRelativeX,
            section1WallRelativeY: section1WallRelativeY
        });
    }
    
    // FIXED: Calculate pattern start position with bottom-anchoring for non-repeating patterns
    let patternStartX, patternStartY;
    
    if (isSection2) {
        // Section 2: Position the pattern so the wall has the same relative position as in Section 1
        const section2WallLeft = referenceCoords.section2.wallStartX;
        const section2WallBottom = referenceCoords.section2.wallStartY + referenceCoords.dimensions.scaledWallHeight;
        
        patternStartX = section2WallLeft - section1WallRelativeX;
        
        if (!pattern.hasRepeatHeight) {
            // FIXED: For non-repeating patterns, anchor to the area bottom
            patternStartY = areaY + areaHeight; // Bottom of the drawing area
        } else {
            patternStartY = section2WallBottom + section1WallRelativeY;
        }
        
        if (isHalfDrop || !pattern.hasRepeatHeight) {
            console.log(`🌟 Section 2 positioning (${pattern.hasRepeatHeight ? 'repeating' : 'non-repeating'}):`, {
                section2WallLeft: section2WallLeft,
                section2WallBottom: section2WallBottom,
                patternStartX: patternStartX,
                patternStartY: patternStartY,
                bottomAnchored: !pattern.hasRepeatHeight
            });
        }
    } else {
        // Section 1: Use the universal pattern origin with bottom-anchoring adjustment
        patternStartX = universalPatternOriginX;
        
        if (!pattern.hasRepeatHeight) {
            // FIXED: For non-repeating patterns, anchor to the panel bottom
            // areaY + areaHeight = bottom of the panel area
            patternStartY = areaY + areaHeight;
        } else {
            patternStartY = universalPatternOriginY;
        }
        
        if (isHalfDrop || !pattern.hasRepeatHeight) {
            console.log(`🌟 Section 1 positioning (${pattern.hasRepeatHeight ? 'repeating' : 'non-repeating'}):`, {
                patternStartX: patternStartX,
                patternStartY: patternStartY,
                areaBottom: areaY + areaHeight,
                bottomAnchored: !pattern.hasRepeatHeight
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
        
        if (isHalfDrop) {
            console.log(`🔄 HALF-DROP SECTION 1 CONTINUOUS PATTERN:`, {
                numPanels: numPanels,
                totalHorizontalRepeats: totalHorizontalRepeats,
                repeatsPerPanel: repeatsPerPanel
            });
        }
        
        // Draw all repeats that could be visible in this area
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels;
            const drawX = patternStartX + repeatX;
            
            // UPDATED HALF-DROP LOGIC: Multi-repeat vs single-repeat
            let halfDropOffset = 0;
            
            if (isHalfDrop) {
                if (repeatsPerPanel >= 2) {
                    // Multi-repeat patterns: Use tile-based offset within panel
                    const tileIndexWithinPanel = i % repeatsPerPanel;
                    halfDropOffset = calculateTileOffsetWithinPanel(pattern, tileIndexWithinPanel) * scale;
                    
                    if (i < 8) { // Log first few for debugging
                        console.log(`🎨 MULTI-REPEAT TILE ${i} (tile ${tileIndexWithinPanel} in panel):`, {
                            drawX: drawX,
                            repeatX: repeatX,
                            halfDropOffset: halfDropOffset,
                            tileIndexWithinPanel: tileIndexWithinPanel
                        });
                    }
                } else {
                    // Single-repeat patterns: Use panel-based offset (existing logic)
                    const panelForThisRepeat = Math.floor(i * pattern.repeatWidth / pattern.panelWidth);
                    halfDropOffset = calculateHalfDropVisualOffset(pattern, panelForThisRepeat) * scale;
                    
                    if (i < 5) { // Log first few for debugging
                        console.log(`🎨 SINGLE-REPEAT PANEL ${i}:`, {
                            drawX: drawX,
                            repeatX: repeatX,
                            halfDropOffset: halfDropOffset,
                            panelForThisRepeat: panelForThisRepeat
                        });
                    }
                }
            }
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (pattern.hasRepeatHeight) {
                    // Vertical repeating pattern with half-drop offset DOWN (eliminates bottom gap)
                    const numVerticalRepeats = Math.ceil(drawHeight / repeatHeightPixels) + 3;
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels;
                        const drawY = patternStartY - repeatY - repeatHeightPixels + halfDropOffset;
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // FIXED: Non-repeating pattern - draw from panel bottom upward, clipped at panel top
                    const drawY = patternStartY - repeatHeightPixels + halfDropOffset;
                    
                    if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                        ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        
                        // Log the non-repeating pattern draw for debugging
                        if (!pattern.hasRepeatHeight && i < 3) {
                            console.log(`🌙 Non-repeating pattern draw ${i} (anchored to panel bottom):`, {
                                drawX: drawX,
                                drawY: drawY,
                                repeatWidthPixels: repeatWidthPixels,
                                repeatHeightPixels: repeatHeightPixels,
                                patternStartY: patternStartY,
                                areaBottom: areaY + areaHeight,
                                note: 'Pattern extends upward from panel bottom'
                            });
                        }
                    }
                }
            }
        }
    } else {
        // Section 2: Draw continuously using the same universal positioning system
        const numPanels = calculations.panelsNeeded;
        const totalPatternWidth = numPanels * stripWidthPixels;
        const totalHorizontalRepeats = Math.ceil(totalPatternWidth / repeatWidthPixels);
        
        if (isHalfDrop) {
            console.log(`🌟 HALF-DROP SECTION 2 CONTINUOUS PATTERN:`, {
                numPanels: numPanels,
                totalHorizontalRepeats: totalHorizontalRepeats,
                repeatsPerPanel: repeatsPerPanel
            });
        }
        
        // Draw all repeats continuously using universal coordinates
        for (let i = 0; i < totalHorizontalRepeats; i++) {
            const repeatX = i * repeatWidthPixels;
            const drawX = patternStartX + repeatX;
            
            // UPDATED HALF-DROP LOGIC: Multi-repeat vs single-repeat (same as Section 1)
            let halfDropOffset = 0;
            
            if (isHalfDrop) {
                if (repeatsPerPanel >= 2) {
                    // Multi-repeat patterns: Use tile-based offset within panel
                    const tileIndexWithinPanel = i % repeatsPerPanel;
                    halfDropOffset = calculateTileOffsetWithinPanel(pattern, tileIndexWithinPanel) * scale;
                    
                    if (i < 8) { // Log first few for debugging
                        console.log(`🎨 MULTI-REPEAT SECTION 2 TILE ${i} (tile ${tileIndexWithinPanel} in panel):`, {
                            drawX: drawX,
                            repeatX: repeatX,
                            halfDropOffset: halfDropOffset,
                            tileIndexWithinPanel: tileIndexWithinPanel
                        });
                    }
                } else {
                    // Single-repeat patterns: Use panel-based offset (existing logic)
                    const panelForThisRepeat = Math.floor(i * pattern.repeatWidth / pattern.panelWidth);
                    halfDropOffset = calculateHalfDropVisualOffset(pattern, panelForThisRepeat) * scale;
                    
                    if (i < 5) { // Log first few for debugging
                        console.log(`🎨 SINGLE-REPEAT SECTION 2 PANEL ${i}:`, {
                            drawX: drawX,
                            repeatX: repeatX,
                            halfDropOffset: halfDropOffset,
                            panelForThisRepeat: panelForThisRepeat
                        });
                    }
                }
            }
            
            // Only draw if this repeat intersects with the current area
            if (drawX + repeatWidthPixels >= areaX && drawX < areaX + areaWidth) {
                if (pattern.hasRepeatHeight) {
                    // Vertical repeating pattern with half-drop offset DOWN (consistent with Section 1)
                    const baseNumVerticalRepeats = Math.ceil(areaHeight / repeatHeightPixels) + 3;
                    
                    // For half-drop, we may need one extra repeat if the downward offset pushes pattern beyond area
                    const extraRepeatForOffset = (isHalfDrop && halfDropOffset > 0) ? 1 : 0;
                    const numVerticalRepeats = baseNumVerticalRepeats + extraRepeatForOffset;
                    
                    for (let v = 0; v < numVerticalRepeats; v++) {
                        const repeatY = v * repeatHeightPixels;
                        const drawY = patternStartY - repeatY - repeatHeightPixels + halfDropOffset;
                        
                        // Only draw if this repeat is visible
                        if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                            ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        }
                    }
                } else {
                    // FIXED: Non-repeating pattern in Section 2 - same bottom-anchored behavior
                    const drawY = patternStartY - repeatHeightPixels + halfDropOffset;
                    
                    if (drawY + repeatHeightPixels >= areaY && drawY < areaY + areaHeight) {
                        ctx.drawImage(patternImage, drawX, drawY, repeatWidthPixels, repeatHeightPixels);
                        
                        // Log the non-repeating pattern draw for debugging
                        if (!pattern.hasRepeatHeight && i < 3) {
                            console.log(`🌙 Non-repeating pattern Section 2 draw ${i} (anchored to area bottom):`, {
                                drawX: drawX,
                                drawY: drawY,
                                repeatWidthPixels: repeatWidthPixels,
                                repeatHeightPixels: repeatHeightPixels,
                                patternStartY: patternStartY,
                                areaBottom: areaY + areaHeight,
                                note: 'Pattern anchored to wall area bottom in Section 2'
                            });
                        }
                    }
                }
            }
        }
    }
    
    ctx.restore();
}

window.calculateHalfDropVisualOffset = calculateHalfDropVisualOffset;
window.calculateTileOffsetWithinPanel = calculateTileOffsetWithinPanel;
window.drawPatternInArea = drawPatternInArea;
