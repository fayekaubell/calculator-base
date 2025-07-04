// Canvas Preview Generation Module - Fixed Pattern Alignment & Opacity System

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

// FIXED: Draw pattern with consistent coordinate system and proper draw modes
function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, drawMode = 'normal') {
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
    
    // Set clip area
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
    
    // Draw pattern for each panel/strip
    for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
        // Calculate panel position in the reference coordinate system
        const panelX = patternOriginX + (panelIndex * pattern.panelWidth * scale);
        
        // Apply coordinate offset for Section 2
        const drawPanelX = panelX + coordinateOffsetX;
        const drawPanelY = patternOriginY + coordinateOffsetY;
        
        // Calculate sequence offset for panel patterns
        const sequencePosition = pattern.sequenceLength === 0 ? 0 : panelIndex % pattern.sequenceLength;
        const sourceOffsetX = sequencePosition * offsetPerPanel;
        
        // Draw pattern repeats for this panel
        const panelWidth = pattern.panelWidth * scale;
        
        // Determine the drawing height based on draw mode
        let drawHeight, drawStartY;
        
        if (drawMode === 'full_coverage') {
            // Full panel coverage - draw the entire panel height
            drawStartY = drawPanelY;
            drawHeight = referenceCoords.dimensions.scaledTotalHeight;
        } else if (drawMode === 'wall_area') {
            // Wall area only - calculate based on limitations
            const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
            if (hasLimitation && !isSection2) {
                const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
                    calculations.actualPanelLength : calculations.panelLength;
                const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
                const wallHeight = referenceCoords.dimensions.scaledWallHeight;
                drawStartY = drawPanelY + Math.max(0, wallHeight - panelCoverageHeight);
                drawHeight = Math.min(panelCoverageHeight, wallHeight);
            } else {
                drawStartY = drawPanelY;
                drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledWallHeight;
            }
        } else {
            // Normal drawing (Section 2 or other cases)
            drawStartY = drawPanelY;
            drawHeight = isSection2 ? areaHeight : referenceCoords.dimensions.scaledTotalHeight;
        }
        
        // Draw horizontal repeats
        for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
            const drawX = Math.floor(drawPanelX + x - (sourceOffsetX * scale));
            
            if (pattern.hasRepeatHeight) {
                // Patterns with height repeats
                for (let y = -repeatH; y < drawHeight + repeatH; y += repeatH) {
                    const drawY = Math.floor(drawStartY + y);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            } else {
                // Patterns without height repeats (bottom-aligned)
                const drawY = Math.floor(drawStartY + drawHeight - repeatH);
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
            }
        }
    }
    
    ctx.restore();
}

// Draw preview on canvas - RESTRUCTURED LAYOUT with fixed pattern alignment
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate reference coordinates for consistent pattern positioning
    const referenceCoords = calculateReferenceCoordinates();
    
    // Section 1: Complete view with wall overlay
    drawCompleteViewWithAnnotations(ctx, referenceCoords);
    
    // Section 2: Wall only view
    drawWallOnlyView(ctx, referenceCoords);
}

// FIXED: Draw Complete View with proper two-pass opacity system (no overlap)
function drawCompleteViewWithAnnotations(ctx, referenceCoords) {
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
    
    // Calculate panel coverage for limitations
    const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
        calculations.actualPanelLength : calculations.panelLength;
    const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
    const panelStartY = wallOffsetY + Math.max(0, scaledWallHeight - panelCoverageHeight);
    const actualPanelHeight = Math.min(panelCoverageHeight, scaledWallHeight);
    
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    
    // FIXED: Clean two-pass opacity system with no overlap
    if (imageLoaded && patternImage) {
        
        // PASS 1: Draw ALL panel coverage at 50% opacity
        ctx.globalAlpha = 0.5;
        drawPatternInArea(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, referenceCoords, false, 'full_coverage');
        
        // PASS 2: Draw ONLY wall area at 100% opacity (overwrites the 50% underneath)
        ctx.globalAlpha = 1.0;
        if (hasLimitation) {
            // With limitations, draw only the covered portion of the wall
            drawPatternInArea(ctx, wallOffsetX, panelStartY, scaledWallWidth, actualPanelHeight, referenceCoords, false, 'wall_area');
        } else {
            // No limitations, draw the full wall area
            drawPatternInArea(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, referenceCoords, false, 'wall_area');
        }
        
        // Reset alpha for subsequent drawing
        ctx.globalAlpha = 1.0;
    }
    
    // Draw uncovered area if panels exceed any limit
    if (hasLimitation) {
        const uncoveredAreaHeight = scaledWallHeight - actualPanelHeight;
        if (uncoveredAreaHeight > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(wallOffsetX, wallOffsetY, scaledWallWidth, uncoveredAreaHeight);
        }
    }
    
    // Draw all outlines and annotations
    drawCompleteViewOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                           scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    // Draw dimension labels
    drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                              scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    // Draw panel labels
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
