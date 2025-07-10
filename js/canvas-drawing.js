// Canvas Drawing Module - Extracted from preview.js
// Handles all canvas rendering, pattern drawing, and coordinate calculations
// UPDATED: Half-drop pattern visual support

// Calculate the reference coordinate system for consistent pattern positioning
function calculateReferenceCoordinates() {
    const canvas = document.getElementById('previewCanvas');
    const { wallWidth, wallHeight, calculations } = currentPreview;
    
    // Use the same layout constants as the main drawing function
    const leftMargin = 120;
    const rightMargin = 120;
    const topMargin = 140;
    const bottomMargin = 120;
    const sectionGap = 60;
    
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - topMargin - bottomMargin;
    
    // Calculate dimensions for both sections
    const wallOnlyHeight = wallHeight;
    const completeViewHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    // Calculate scale
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    const section1StartY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Pattern coverage area in Section 1
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Section 1 coordinates
    const section1OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    const section1OffsetY = section1StartY;
    const section1WallOffsetX = section1OffsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const section1WallOffsetY = section1OffsetY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    
    // Section 2 coordinates
    const section2StartY = section1StartY + completeViewHeight * scale + sectionGap;
    const section2WallOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    const section2WallOffsetY = section2StartY;
    
    return {
        scale,
        section1: {
            patternStartX: section1OffsetX,
            patternStartY: section1OffsetY,
            wallStartX: section1WallOffsetX,
            wallStartY: section1WallOffsetY
        },
        section2: {
            wallStartX: section2WallOffsetX,
            wallStartY: section2WallOffsetY
        },
        dimensions: {
            scaledTotalWidth,
            scaledTotalHeight,
            scaledWallWidth,
            scaledWallHeight
        }
    };
}

// Helper function to get wall position within Section 1 for consistent non-repeating pattern alignment
function getWallPositionInSection1(referenceCoords) {
    const { wallHeight } = currentPreview;
    return {
        wallStartY: referenceCoords.section1.wallStartY,
        wallHeight: wallHeight
    };
}

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
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH)).ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
    }
    
    ctx.restore();
}

// Draw overage overlay rectangles to dim non-wall areas
function drawOverageOverlay(ctx, panelStartX, panelStartY, panelTotalWidth, panelTotalHeight, 
                           wallStartX, wallStartY, wallWidth, wallHeight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // 50% white overlay to dim
    
    // Left overage
    if (wallStartX > panelStartX) {
        const overageWidth = wallStartX - panelStartX;
        ctx.fillRect(panelStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Right overage
    if (wallStartX + wallWidth < panelStartX + panelTotalWidth) {
        const overageStartX = wallStartX + wallWidth;
        const overageWidth = (panelStartX + panelTotalWidth) - overageStartX;
        ctx.fillRect(overageStartX, panelStartY, overageWidth, panelTotalHeight);
    }
    
    // Top overage
    if (wallStartY > panelStartY) {
        const overageHeight = wallStartY - panelStartY;
        ctx.fillRect(wallStartX, panelStartY, wallWidth, overageHeight);
    }
    
    // Bottom overage
    if (wallStartY + wallHeight < panelStartY + panelTotalHeight) {
        const overageStartY = wallStartY + wallHeight;
        const overageHeight = (panelStartY + panelTotalHeight) - overageStartY;
        ctx.fillRect(wallStartX, overageStartY, wallWidth, overageHeight);
    }
}

// Main canvas drawing function
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate reference coordinates
    const referenceCoords = calculateReferenceCoordinates();
    
    // Section 1: Complete view with half-drop support
    drawCompleteViewWithOverlay(ctx, referenceCoords);
    
    // Section 2: Wall only view
    drawWallOnlyView(ctx, referenceCoords);
}

// Draw Complete View - pattern + overlay + annotations - UPDATED FOR HALF-DROP
function drawCompleteViewWithOverlay(ctx, referenceCoords) {
    const { pattern, calculations } = currentPreview;
    const { scale, section1, dimensions } = referenceCoords;
    
    const offsetX = section1.patternStartX;
    const offsetY = section1.patternStartY;
    const scaledTotalWidth = dimensions.scaledTotalWidth;
    const scaledTotalHeight = dimensions.scaledTotalHeight;
    const scaledWallWidth = dimensions.scaledWallWidth;
    const scaledWallHeight = dimensions.scaledWallHeight;
    const wallOffsetX = section1.wallStartX;
    const wallOffsetY = section1.wallStartY;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    
    // Step 1: Draw pattern for each panel/strip individually with half-drop offset
    if (imageLoaded && patternImage) {
        ctx.globalAlpha = 1.0;
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const panelX = offsetX + (i * pattern.panelWidth * scale);
            const panelWidth = pattern.panelWidth * scale;
            
            // Calculate visual offset for this panel
            const halfDropOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, i) * scale : 0;
            
            // Adjust panel height for half-drop patterns
            let panelHeight = scaledTotalHeight;
            if (isHalfDrop && calculations.stripLengths && calculations.stripLengths[i]) {
                // Use the actual calculated strip length for this panel
                panelHeight = (calculations.stripLengths[i] / calculations.stripLengthInches) * scaledTotalHeight;
            }
            
            // Draw pattern for this specific panel with offset
            drawPatternInArea(ctx, panelX, offsetY + halfDropOffset, panelWidth, panelHeight, referenceCoords, false, i);
        }
    }
    
    // Step 2: Draw semi-transparent overlay on overage areas (dims them to 50%)
    drawOverageOverlay(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight,
                      wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Step 3: Handle limitations (uncovered areas)
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    if (hasLimitation) {
        const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
        const uncoveredAreaHeight = scaledWallHeight - panelCoverageHeight;
        
        if (uncoveredAreaHeight > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(wallOffsetX, wallOffsetY, scaledWallWidth, uncoveredAreaHeight);
        }
    }
    
    // Step 4: Draw outlines and annotations with half-drop adjustments
    drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                           scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, isHalfDrop);
    
    drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                              scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
}

// Draw outlines for complete view - UPDATED FOR HALF-DROP
function drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale, isHalfDrop) {
    const { pattern, calculations } = currentPreview;
    
    // Wall outline (thick, prominent)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Panel outlines with half-drop offset
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        
        // Calculate visual offset for this panel
        const halfDropOffset = isHalfDrop ? calculateHalfDropVisualOffset(pattern, i) * scale : 0;
        
        // Adjust panel height for half-drop patterns
        let panelHeight = scaledTotalHeight;
        if (isHalfDrop && calculations.stripLengths && calculations.stripLengths[i]) {
            // Use the actual calculated strip length for this panel
            panelHeight = (calculations.stripLengths[i] / calculations.stripLengthInches) * scaledTotalHeight;
        }
        
        ctx.strokeRect(x, offsetY + halfDropOffset, width, panelHeight);
    }
    
    // Dashed lines between panels (subtle)
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        
        // For half-drop, draw a stepped line
        if (isHalfDrop) {
            const prevOffset = calculateHalfDropVisualOffset(pattern, i - 1) * scale;
            const currOffset = calculateHalfDropVisualOffset(pattern, i) * scale;
            
            ctx.beginPath();
            ctx.moveTo(x, offsetY + prevOffset);
            ctx.lineTo(x, offsetY + scaledTotalHeight + prevOffset);
            
            // If offsets differ, draw the step
            if (prevOffset !== currOffset) {
                ctx.moveTo(x, offsetY + currOffset);
                ctx.lineTo(x, offsetY + scaledTotalHeight + currOffset);
            }
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x, offsetY);
            ctx.lineTo(x, offsetY + scaledTotalHeight);
            ctx.stroke();
        }
    }
    ctx.setLineDash([]);
}

// Draw all dimension labels for complete view
function drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                   scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Panel dimensions formatting
    const panelWidthFeet = Math.floor(pattern.panelWidth / 12);
    const panelWidthInches = Math.round(pattern.panelWidth % 12);
    const panelWidthDisplay = panelWidthInches > 0 ? 
        `${panelWidthFeet}'-${panelWidthInches}"` : `${panelWidthFeet}'`;
    
    // Individual panel width annotation
    if (calculations.panelsNeeded > 0) {
        const panelStartX = offsetX;
        const panelEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 50;
        
        ctx.beginPath();
        ctx.moveTo(panelStartX, labelY);
        ctx.lineTo(panelEndX, labelY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(panelStartX, labelY - 5);
        ctx.lineTo(panelStartX, labelY + 5);
        ctx.moveTo(panelEndX, labelY - 5);
        ctx.lineTo(panelEndX, labelY + 5);
        ctx.stroke();
        
        const labelText = pattern.saleType === 'yard' ? 
            `Strip Width: ${panelWidthDisplay}` : 
            `Panel Width: ${panelWidthDisplay}`;
        ctx.fillText(labelText, (panelStartX + panelEndX) / 2, labelY - 8);
    }
    
    // Total panels width annotation
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = Math.round(calculations.totalWidth % 12);
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'`;
    
    const totalLabelY = offsetY - 80;
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY - 5);
    ctx.lineTo(offsetX, totalLabelY + 5);
    ctx.moveTo(offsetX + scaledTotalWidth, totalLabelY - 5);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY + 5);
    ctx.stroke();
    
    const totalLabelText = pattern.saleType === 'yard' ? 
        `All Strips: ${totalWidthDisplay}` : 
        `All Panels: ${totalWidthDisplay}`;
    ctx.fillText(totalLabelText, offsetX + scaledTotalWidth / 2, totalLabelY - 8);
    
    // Panel height annotation
    const panelHeightLineX = offsetX - 30;
    const panelHeightTextX = panelHeightLineX - 15;
    
    ctx.beginPath();
    ctx.moveTo(panelHeightLineX, offsetY);
    ctx.lineTo(panelHeightLineX, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(panelHeightLineX - 5, offsetY);
    ctx.lineTo(panelHeightLineX + 5, offsetY);
    ctx.moveTo(panelHeightLineX - 5, offsetY + scaledTotalHeight);
    ctx.lineTo(panelHeightLineX + 5, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(panelHeightTextX, offsetY + scaledTotalHeight / 2);
    ctx.rotate(-Math.PI/2);
    
    let heightDisplay;
    if (pattern.saleType === 'yard' && calculations.panelLengthInches !== undefined && calculations.panelLengthInches > 0) {
        heightDisplay = `Strip Height: ${calculations.panelLength}'-${calculations.panelLengthInches}"`;
    } else if (pattern.saleType === 'yard') {
        heightDisplay = `Strip Height: ${calculations.panelLength}'`;
    } else {
        heightDisplay = `Panel Height: ${calculations.panelLength}'`;
    }
    
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

// Draw panel labels (A/B/C sequence)
function drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    if (pattern.saleType === 'panel' && pattern.sequenceLength > 1) {
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const centerX = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const labelText = pattern.panelSequence[sequencePosition];
            const textY = offsetY - 25;
            
            ctx.fillText(labelText, centerX, textY);
        }
    }
}

// Draw Wall Only View with perfect pattern alignment
function drawWallOnlyView(ctx, referenceCoords) {
    const { pattern, wallWidth, wallHeight, calculations, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    const { section2, dimensions } = referenceCoords;
    
    const wallOffsetX = section2.wallStartX;
    const wallOffsetY = section2.wallStartY;
    const scaledWallWidth = dimensions.scaledWallWidth;
    const scaledWallHeight = dimensions.scaledWallHeight;
    
    // Draw pattern using the same coordinate system as Section 1
    if (imageLoaded && patternImage) {
        drawPatternInArea(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, referenceCoords, true);
    }
    
    // Draw uncovered area if needed
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    if (hasLimitation) {
        const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const coveredHeight = actualPanelLengthToUse * 12 * referenceCoords.scale;
        const uncoveredAreaHeight = scaledWallHeight - coveredHeight;
        
        if (uncoveredAreaHeight > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(wallOffsetX, wallOffsetY, scaledWallWidth, uncoveredAreaHeight);
        }
    }
    
    // Draw wall outline
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Draw wall dimensions
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Format the dimension text - using the correct variable names
    const wallWidthText = wallWidthInches > 0 ? 
        `Wall Width: ${wallWidthFeet}'-${wallWidthInches}"` : `Wall Width: ${wallWidthFeet}'`;
    const wallHeightText = wallHeightInches > 0 ? 
        `Wall Height: ${wallHeightFeet}'-${wallHeightInches}"` : `Wall Height: ${wallHeightFeet}'`;
    
    // Wall width annotation (bottom of wall)
    const widthLineY = wallOffsetY + scaledWallHeight + 30;
    const widthTextY = widthLineY + 15;
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY - 5);
    ctx.lineTo(wallOffsetX, widthLineY + 5);
    ctx.moveTo(wallOffsetX + scaledWallWidth, widthLineY - 5);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY + 5);
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.fillText(wallWidthText, wallOffsetX + scaledWallWidth / 2, widthTextY);
    
    // Wall height annotation (left side of wall)
    const wallHeightOffset = 30;
    const heightLineX = wallOffsetX - wallHeightOffset;
    const heightTextX = heightLineX - 15;
    
    ctx.beginPath();
    ctx.moveTo(heightLineX, wallOffsetY);
    ctx.lineTo(heightLineX, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(heightLineX - 5, wallOffsetY);
    ctx.lineTo(heightLineX + 5, wallOffsetY);
    ctx.moveTo(heightLineX - 5, wallOffsetY + scaledWallHeight);
    ctx.lineTo(heightLineX + 5, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(heightTextX, wallOffsetY + scaledWallHeight / 2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(wallHeightText, 0, 0);
    ctx.restore();
}.ceil(repeatW), Math.ceil(repeatH));
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
                    
                    ctx.drawImage(patternImage, drawX, drawY, Math
