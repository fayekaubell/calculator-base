// Canvas Preview Generation Module - DEBUG VERSION with Y-Axis Logging

// Generate preview function
async function generatePreview() {
    try {
        console.log('🎨 Resetting preview state completely...');
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
        // Get DOM elements once at the top
        const previewSection = document.getElementById('previewSection');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const previewTitle = document.getElementById('previewTitle');
        
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const patternId = getSelectedPattern();
        const widthFeet = parseInt(document.getElementById('widthFeet').value) || 0;
        const widthInches = parseFloat(document.getElementById('widthInches').value) || 0;
        const heightFeet = parseInt(document.getElementById('heightFeet').value) || 0;
        const heightInches = parseFloat(document.getElementById('heightInches').value) || 0;
        
        console.log('🎯 Generate preview called with:', { patternId, widthFeet, widthInches, heightFeet, heightInches });
        
        if (!patternId) {
            alert('Please select a wallpaper pattern');
            return;
        }
        
        if (widthFeet === 0 && widthInches === 0) {
            alert('Please enter wall width');
            return;
        }
        
        if (heightFeet === 0 && heightInches === 0) {
            alert('Please enter wall height');
            return;
        }
        
        const pattern = patterns[patternId];
        if (!pattern) {
            alert('Pattern not found: ' + patternId);
            return;
        }
        
        const wallWidth = (widthFeet * 12) + widthInches;
        const wallHeight = (heightFeet * 12) + heightInches;
        
        console.log('🔢 Calculating requirements for:', { wallWidth, wallHeight });
        const calculations = calculatePanelRequirements(pattern, wallWidth, wallHeight);
        
        // Check for special cases
        if (!pattern.hasRepeatHeight && pattern.saleType === 'panel') {
            const maxAvailableLength = Math.max(...pattern.availableLengths);
            const calculatedPanelHeight = calculations.panelLength;
            
            if (calculatedPanelHeight > maxAvailableLength) {
                calculations.exceedsAvailableLength = true;
                calculations.maxAvailableLength = maxAvailableLength;
                calculations.actualPanelLength = maxAvailableLength;
            } else {
                calculations.exceedsAvailableLength = false;
            }
        } else {
            calculations.exceedsAvailableLength = false;
        }
        
        const formattedWidth = widthInches > 0 ? `${widthFeet}'${widthInches}"` : `${widthFeet}'`;
        const formattedHeight = heightInches > 0 ? `${heightFeet}'${heightInches}"` : `${heightFeet}'`;
        
        currentPreview = {
            pattern,
            wallWidth,
            wallHeight,
            calculations,
            wallWidthFeet: widthFeet,
            wallWidthInches: widthInches,
            wallHeightFeet: heightFeet,
            wallHeightInches: heightInches,
            formattedWidth: formattedWidth,
            formattedHeight: formattedHeight
        };
        
        // DEBUG: Log pattern Y-axis properties
        console.log('🔍 DEBUG: Pattern Y-Axis Properties:');
        console.log(`  Pattern: ${pattern.name} (${pattern.sku})`);
        console.log(`  Sale Type: ${pattern.saleType}`);
        console.log(`  Repeat Height: ${pattern.repeatHeight}`);
        console.log(`  Has Repeat Height: ${pattern.hasRepeatHeight}`);
        console.log(`  Wall Height: ${wallHeight}" (${(wallHeight/12).toFixed(1)}' total)`);
        console.log(`  Panel Length: ${calculations.panelLength}' (${calculations.panelLength * 12}")`);
        console.log(`  Input dimensions: ${widthFeet}'${widthInches}" x ${heightFeet}'${heightInches}"`);
        console.log(`  Formatted: ${formattedWidth} x ${formattedHeight}`);
        
        if (previewTitle) {
            previewTitle.textContent = `${pattern.name}: ${pattern.sku || 'N/A'}: ${formattedWidth}w x ${formattedHeight}h Wall`;
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        if (previewSection) {
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('🖼️ Preloading image:', pattern.imageUrl);
        await preloadPatternImage(pattern);
        
        updatePreviewInfo();
        drawPreview();
        
        // Show warnings if needed
        const warningElement = document.getElementById('panelLimitWarning');
        if (warningElement) {
            if (calculations.exceedsAvailableLength) {
                warningElement.innerHTML = `<p><em>${CONFIG.ui.text.disclaimers.noRepeatHeight}</em></p>`;
                warningElement.style.display = 'block';
                warningElement.style.color = '#dc3545';
            } else if (calculations.exceedsLimit) {
                warningElement.innerHTML = `<p><em>${CONFIG.ui.text.disclaimers.panelLimit}</em></p>`;
                warningElement.style.display = 'block';
                warningElement.style.color = '#dc3545';
            } else {
                warningElement.style.display = 'none';
            }
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Add click handler for canvas modal (non-mobile only)
        const canvas = document.getElementById('previewCanvas');
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (!isMobile) {
            canvas.style.cursor = 'zoom-in';
            canvas.onclick = openCanvasModal;
        } else {
            canvas.style.cursor = 'default';
            canvas.onclick = null;
        }
        
        console.log('✅ Preview generation complete');
        
    } catch (error) {
        console.error('❌ Error in generatePreview:', error);
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        alert('An error occurred: ' + error.message);
    }
}

// Update preview info display
function updatePreviewInfo() {
    const { calculations } = currentPreview;
    
    console.log('📝 updatePreviewInfo called with:', calculations);
    
    const orderQuantity = document.getElementById('orderQuantity');
    const orderQuantityWithOverage = document.getElementById('orderQuantityWithOverage');
    const yardagePerPanel = document.getElementById('yardagePerPanel');
    const totalYardage = document.getElementById('totalYardage');
    const yardagePerPanelOverage = document.getElementById('yardagePerPanelOverage');
    const totalYardageOverage = document.getElementById('totalYardageOverage');
    
    if (calculations.saleType === 'yard') {
        // Yard-based display
        const totalYardageValue = calculations.totalYardage;
        const overageTotalYardage = Math.ceil(totalYardageValue * 1.2);
        
        if (orderQuantity) {
            orderQuantity.textContent = `Total yardage: ${totalYardageValue} yds`;
        }
        
        // Hide panel-specific lines
        const yardagePerPanelEl = yardagePerPanel ? yardagePerPanel.parentElement : null;
        const totalYardageEl = totalYardage ? totalYardage.parentElement : null;
        if (yardagePerPanelEl) yardagePerPanelEl.style.display = 'none';
        if (totalYardageEl) totalYardageEl.style.display = 'none';
        
        if (orderQuantityWithOverage) {
            orderQuantityWithOverage.textContent = `Total yardage: ${overageTotalYardage} yds`;
        }
        
        const yardagePerPanelOverageEl = yardagePerPanelOverage ? yardagePerPanelOverage.parentElement : null;
        const totalYardageOverageEl = totalYardageOverage ? totalYardageOverage.parentElement : null;
        if (yardagePerPanelOverageEl) yardagePerPanelOverageEl.style.display = 'none';
        if (totalYardageOverageEl) totalYardageOverageEl.style.display = 'none';
    } else {
        // Panel-based display
        const actualPanelLength = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const yardagePerPanelValue = Math.round(actualPanelLength / 3);
        const totalYardageValue = calculations.panelsNeeded * yardagePerPanelValue;
        const overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
        const overageTotalYardage = overagePanels * yardagePerPanelValue;
        
        if (orderQuantity) {
            orderQuantity.textContent = `[x${calculations.panelsNeeded}] ${actualPanelLength}' Panels`;
        }
        
        // Show panel-specific lines
        const yardagePerPanelEl = yardagePerPanel ? yardagePerPanel.parentElement : null;
        const totalYardageEl = totalYardage ? totalYardage.parentElement : null;
        if (yardagePerPanelEl) yardagePerPanelEl.style.display = 'block';
        if (totalYardageEl) totalYardageEl.style.display = 'block';
        
        if (yardagePerPanel) {
            yardagePerPanel.textContent = `${yardagePerPanelValue} yds`;
        }
        if (totalYardage) {
            totalYardage.textContent = `${totalYardageValue} yds`;
        }
        
        if (orderQuantityWithOverage) {
            orderQuantityWithOverage.textContent = `[x${overagePanels}] ${actualPanelLength}' Panels`;
        }
        
        const yardagePerPanelOverageEl = yardagePerPanelOverage ? yardagePerPanelOverage.parentElement : null;
        const totalYardageOverageEl = totalYardageOverage ? totalYardageOverage.parentElement : null;
        if (yardagePerPanelOverageEl) yardagePerPanelOverageEl.style.display = 'block';
        if (totalYardageOverageEl) totalYardageOverageEl.style.display = 'block';
        
        if (yardagePerPanelOverage) {
            yardagePerPanelOverage.textContent = `${yardagePerPanelValue} yds`;
        }
        if (totalYardageOverage) {
            totalYardageOverage.textContent = `${overageTotalYardage} yds`;
        }
    }
}

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
    
    // DEBUG: Log coordinate calculations
    console.log('🔍 DEBUG: Reference Coordinates:');
    console.log(`  Canvas: ${canvas.width}x${canvas.height}`);
    console.log(`  Scale: ${scale.toFixed(4)}`);
    console.log(`  Section 1 Pattern Start: (${section1OffsetX.toFixed(1)}, ${section1OffsetY.toFixed(1)})`);
    console.log(`  Section 1 Wall Start: (${section1WallOffsetX.toFixed(1)}, ${section1WallOffsetY.toFixed(1)})`);
    console.log(`  Section 2 Wall Start: (${section2WallOffsetX.toFixed(1)}, ${section2WallOffsetY.toFixed(1)})`);
    console.log(`  Scaled Dimensions: ${scaledTotalWidth.toFixed(1)}x${scaledTotalHeight.toFixed(1)} (pattern), ${scaledWallWidth.toFixed(1)}x${scaledWallHeight.toFixed(1)} (wall)`);
    
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

// SIMPLE: Draw pattern with consistent coordinate system - DEBUG VERSION
function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false) {
    const { pattern, calculations } = currentPreview;
    
    console.log(`🔍 DEBUG: drawPatternInArea called for ${isSection2 ? 'Section 2' : 'Section 1'}`);
    console.log(`  Pattern: ${pattern.name} (${pattern.sku})`);
    console.log(`  Has Repeat Height: ${pattern.hasRepeatHeight}`);
    console.log(`  Area: (${areaX.toFixed(1)}, ${areaY.toFixed(1)}) ${areaWidth.toFixed(1)}x${areaHeight.toFixed(1)}`);
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // Calculate pattern dimensions
    const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
        (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
    const repeatH = pattern.repeatHeight * scale;
    
    console.log(`  Repeat Dimensions: ${repeatW.toFixed(1)}x${repeatH.toFixed(1)} (scaled)`);
    console.log(`  Original Repeat: ${pattern.repeatWidth}x${pattern.repeatHeight} (inches)`);
    
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
    
    console.log(`  Pattern Origin: (${patternOriginX.toFixed(1)}, ${patternOriginY.toFixed(1)})`);
    
    // For Section 2, calculate the coordinate offset but maintain the same pattern grid
    let coordinateOffsetX = 0;
    let coordinateOffsetY = 0;
    
    if (isSection2) {
        coordinateOffsetX = referenceCoords.section2.wallStartX - referenceCoords.section1.wallStartX;
        coordinateOffsetY = referenceCoords.section2.wallStartY - referenceCoords.section1.wallStartY;
        console.log(`  Section 2 Coordinate Offset: (${coordinateOffsetX.toFixed(1)}, ${coordinateOffsetY.toFixed(1)})`);
    }
    
    // Draw pattern for each panel/strip
    for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
        // Calculate panel position in the reference coordinate system
        const panelX = patternOriginX + (panelIndex * pattern.panelWidth * scale);
        
        // Apply coordinate offset for Section 2
        const drawPanelX = panelX + coordinateOffsetX;
        const drawPanelY = patternOriginY + coordinateOffsetY;
        
        console.log(`  Panel ${panelIndex}: drawPanel position (${drawPanelX.toFixed(1)}, ${drawPanelY.toFixed(1)})`);
        
        // Calculate sequence offset for panel patterns
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        // Draw pattern repeats for this panel
        const panelWidth = pattern.panelWidth * scale;
        const drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
        
        console.log(`  Panel ${panelIndex}: drawHeight = ${drawHeight.toFixed(1)}, panelWidth = ${panelWidth.toFixed(1)}`);
        
        // Draw horizontal repeats
        for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
            const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
            
            if (pattern.hasRepeatHeight) {
                // FIXED: Patterns with height repeats - START FROM BOTTOM (bottom-left alignment)
                console.log(`  Panel ${panelIndex}: WITH repeat height - tiling from BOTTOM (FIXED)`);
                
                // Calculate the bottom of the draw area
                const bottomY = drawPanelY + drawHeight;
                
                // Start from the bottom and tile upward (negative y offsets go up)
                for (let y = 0; y >= -drawHeight - repeatH; y -= repeatH) {
                    const drawY = Math.floor(bottomY + y - repeatH);
                    console.log(`    Drawing repeat at (${drawX}, ${drawY}) - y offset from bottom: ${y.toFixed(1)}`);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            } else {
                // FIXED: Patterns without height repeats - maintain consistent positioning between sections
                console.log(`  Panel ${panelIndex}: WITHOUT repeat height - consistent bottom alignment (FIXED)`);
                
                // For Section 1: Position relative to the wall area within the panel coverage
                // For Section 2: Position relative to the wall area directly
                let drawY;
                
                if (isSection2) {
                    // Section 2: Bottom-align to the wall area directly
                    drawY = Math.floor(drawPanelY + drawHeight - repeatH);
                    console.log(`    Section 2: drawY = drawPanelY(${drawPanelY.toFixed(1)}) + drawHeight(${drawHeight.toFixed(1)}) - repeatH(${repeatH.toFixed(1)}) = ${drawY.toFixed(1)}`);
                } else {
                    // Section 1: Position relative to where the wall would be within the panel coverage
                    const { wallStartY, wallHeight } = getWallPositionInSection1(referenceCoords);
                    const wallBottomY = wallStartY + (wallHeight * referenceCoords.scale);
                    drawY = Math.floor(wallBottomY - repeatH);
                    console.log(`    Section 1: Wall bottom Y(${wallBottomY.toFixed(1)}) - repeatH(${repeatH.toFixed(1)}) = ${drawY.toFixed(1)}`);
                }
                
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
            }
        }
    }
    
    ctx.restore();
}

// SIMPLE: Draw overage overlay rectangles to dim non-wall areas
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

// Draw preview on canvas - SIMPLE APPROACH
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    console.log('🔍 DEBUG: Starting drawPreview()');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate reference coordinates
    const referenceCoords = calculateReferenceCoordinates();
    
    // Section 1: Complete view with simple overlay
    console.log('🔍 DEBUG: Drawing Section 1 (Complete View)');
    drawCompleteViewWithOverlay(ctx, referenceCoords);
    
    // Section 2: Wall only view
    console.log('🔍 DEBUG: Drawing Section 2 (Wall Only View)');
    drawWallOnlyView(ctx, referenceCoords);
    
    console.log('🔍 DEBUG: drawPreview() complete');
}

// SIMPLE: Draw Complete View - pattern + overlay + annotations
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
    
    console.log(`🔍 DEBUG: Section 1 Complete View:`);
    console.log(`  Pattern Area: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}) ${scaledTotalWidth.toFixed(1)}x${scaledTotalHeight.toFixed(1)}`);
    console.log(`  Wall Area: (${wallOffsetX.toFixed(1)}, ${wallOffsetY.toFixed(1)}) ${scaledWallWidth.toFixed(1)}x${scaledWallHeight.toFixed(1)}`);
    
    // Step 1: Draw pattern at 100% opacity across entire panel coverage
    if (imageLoaded && patternImage) {
        ctx.globalAlpha = 1.0;
        drawPatternInArea(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, referenceCoords, false);
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
    
    // Step 4: Draw outlines and annotations
    drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                           scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                              scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
}

// Draw outlines for complete view
function drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Wall outline (thick, prominent)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Panel outlines (medium weight)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels (subtle)
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
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
    
    console.log(`🔍 DEBUG: Section 2 Wall Only View:`);
    console.log(`  Wall Area: (${wallOffsetX.toFixed(1)}, ${wallOffsetY.toFixed(1)}) ${scaledWallWidth.toFixed(1)}x${scaledWallHeight.toFixed(1)}`);
    
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
}

// Canvas modal functionality
function openCanvasModal() {
    const canvas = document.getElementById('previewCanvas');
    
    if (!currentPreview) {
        console.error('No current preview data available for high-res rendering');
        return;
    }
    
    console.log('Creating high-res modal...');
    
    const modal = document.createElement('div');
    modal.className = 'canvas-modal';
    
    const canvasContainer = document.createElement('div');
    canvasContainer.style.width = '100%';
    canvasContainer.style.maxWidth = '95vw';
    canvasContainer.style.margin = '0 auto';
    canvasContainer.style.overflowX = 'hidden';
    canvasContainer.style.overflowY = 'visible';
    
    const largeCanvas = document.createElement('canvas');
    
    const hiResScale = 3;
    const baseScale = 2;
    largeCanvas.width = canvas.width * hiResScale * baseScale;
    largeCanvas.height = canvas.height * hiResScale * baseScale;
    
    const displayWidth = window.innerWidth * 0.95;
    const canvasAspectRatio = canvas.width / canvas.height;
    const displayHeight = displayWidth / canvasAspectRatio;
    
    largeCanvas.style.width = displayWidth + 'px';
    largeCanvas.style.height = displayHeight + 'px';
    largeCanvas.style.maxWidth = 'none';
    largeCanvas.style.display = 'block';
    largeCanvas.style.margin = '0 auto';
    
    const largeCtx = largeCanvas.getContext('2d');
    
    largeCtx.imageSmoothingEnabled = true;
    largeCtx.imageSmoothingQuality = 'high';
    largeCtx.scale(hiResScale * baseScale, hiResScale * baseScale);
    
    largeCtx.fillStyle = '#ffffff';
    largeCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    renderHighQualityPreview(largeCtx, canvas.width, canvas.height);
    
    canvasContainer.appendChild(largeCanvas);
    modal.appendChild(canvasContainer);
    
    modal.onclick = (e) => {
        if (e.target === modal || e.target === canvasContainer) {
            document.body.removeChild(modal);
        }
    };
    
    largeCanvas.onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.body.appendChild(modal);
}

function renderHighQualityPreview(ctx, canvasWidth, canvasHeight) {
    // For high-quality rendering, we need to recalculate coordinates for the given canvas size
    const originalCanvas = document.getElementById('previewCanvas');
    const originalCurrentPreview = currentPreview;
    
    // Temporarily adjust the canvas reference for coordinate calculations
    const tempCanvas = { width: canvasWidth, height: canvasHeight };
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        if (id === 'previewCanvas') return tempCanvas;
        return originalGetElementById.call(document, id);
    };
    
    try {
        // Calculate reference coordinates for the high-res canvas
        const referenceCoords = calculateReferenceCoordinates();
        
        // Draw Section 1: Complete view
        drawCompleteViewWithOverlay(ctx, referenceCoords);
        
        // Draw Section 2: Wall only view  
        drawWallOnlyView(ctx, referenceCoords);
        
    } finally {
        // Restore original getElementById function
        document.getElementById = originalGetElementById;
    }
}

// Make generatePreview globally accessible
window.generatePreview = generatePreview;
