// Canvas Preview Generation Module - Enhanced Version

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

// Draw preview on canvas - COMPLETELY RESTRUCTURED LAYOUT
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // MASSIVELY INCREASED MARGINS FOR PROPER SPACING
    const leftMargin = 120;    // INCREASED from 80
    const rightMargin = 120;   // INCREASED from 80
    const topMargin = 140;     // INCREASED from 100
    const bottomMargin = 120;  // INCREASED from 100
    const sectionGap = 60;     // INCREASED from 40
    
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
    
    // Scaled dimensions
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    // Calculate vertical positioning
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    let currentY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    // Center horizontally
    const offsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    // Section 1: Complete view with wall overlay
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = currentY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    
    drawCompleteViewWithAnnotations(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, 
                                   scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    currentY += completeViewHeight * scale + sectionGap;
    
    // Section 2: Wall only view (WITH WALL DIMENSIONS)
    const wallOnlyOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    drawWallOnlyView(ctx, wallOnlyOffsetX, currentY, scaledWallWidth, scaledWallHeight, scale);
}

// Draw Complete View with all annotations and labels - NO WALL DIMENSIONS
function drawCompleteViewWithAnnotations(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                       scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Calculate panel coverage for limitations
    const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
        calculations.actualPanelLength : calculations.panelLength;
    const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
    const panelStartY = wallOffsetY + Math.max(0, scaledWallHeight - panelCoverageHeight);
    const actualPanelHeight = Math.min(panelCoverageHeight, scaledWallHeight);
    
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    
    // Draw pattern with opacity for overage areas
    if (imageLoaded && patternImage) {
        const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
            (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
        const repeatH = pattern.repeatHeight * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeatWidth / pattern.sequenceLength;
        
        // First pass: Draw all panels at 50% opacity
        ctx.globalAlpha = 0.5;
        for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
            const panelX = offsetX + (panelIndex * pattern.panelWidth * scale);
            const panelWidth = pattern.panelWidth * scale;
            const sequencePosition = panelIndex % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            ctx.save();
            ctx.beginPath();
            
            if (hasLimitation) {
                ctx.rect(panelX, panelStartY, panelWidth, actualPanelHeight);
            } else {
                ctx.rect(panelX, offsetY, panelWidth, scaledTotalHeight);
            }
            ctx.clip();
            
            const drawStartY = hasLimitation ? panelStartY : offsetY;
            const drawHeight = hasLimitation ? actualPanelHeight : scaledTotalHeight;
            const panelBottomY = drawStartY + drawHeight;
            
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight) {
                    for (let y = -repeatH; y < drawHeight + repeatH; y += repeatH) {
                        const drawX = panelX + x - (sourceOffsetX * scale);
                        const drawY = drawStartY + y;
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    }
                } else {
                    const drawX = panelX + x - (sourceOffsetX * scale);
                    const drawY = panelBottomY - repeatH;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            }
            
            ctx.restore();
        }
        
        // Second pass: Draw wall area at 100% opacity
        ctx.globalAlpha = 1.0;
        ctx.save();
        ctx.beginPath();
        
        if (hasLimitation) {
            ctx.rect(wallOffsetX, panelStartY, scaledWallWidth, actualPanelHeight);
        } else {
            ctx.rect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
        }
        ctx.clip();
        
        for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
            const panelX = offsetX + (panelIndex * pattern.panelWidth * scale);
            const panelWidth = pattern.panelWidth * scale;
            const sequencePosition = panelIndex % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            const drawStartY = hasLimitation ? panelStartY : offsetY;
            const drawHeight = hasLimitation ? actualPanelHeight : scaledTotalHeight;
            const panelBottomY = drawStartY + drawHeight;
            
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight) {
                    for (let y = -repeatH; y < drawHeight + repeatH; y += repeatH) {
                        const drawX = panelX + x - (sourceOffsetX * scale);
                        const drawY = drawStartY + y;
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    }
                } else {
                    const drawX = panelX + x - (sourceOffsetX * scale);
                    const drawY = panelBottomY - repeatH;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            }
        }
        
        ctx.restore();
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
    
    // Draw ONLY panel dimension labels - NO WALL DIMENSIONS
    drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                              scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    // Draw panel labels WITHOUT BOXES - call our clean function
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

// Draw all dimension labels for complete view - PANEL DIMENSIONS ONLY
function drawCompleteDimensionLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                   scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // ONLY PANEL DIMENSIONS - ABSOLUTELY NO WALL DIMENSIONS HERE
    const panelWidthFeet = Math.floor(pattern.panelWidth / 12);
    const panelWidthInches = pattern.panelWidth % 12;
    const panelWidthDisplay = panelWidthInches > 0 ? 
        `${panelWidthFeet}'-${panelWidthInches}"` : `${panelWidthFeet}'-0"`;
    
    // Individual panel width annotation (higher up)
    if (calculations.panelsNeeded > 0) {
        const panelStartX = offsetX;
        const panelEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 50;  // MOVED HIGHER
        
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
        
        ctx.fillText(`Panel: ${panelWidthDisplay}`, (panelStartX + panelEndX) / 2, labelY - 8);
    }
    
    // Total panels width annotation (even higher)
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = calculations.totalWidth % 12;
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'-0"`;
    
    const totalLabelY = offsetY - 80;  // MOVED EVEN HIGHER
    
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
    
    ctx.fillText(`Total Panels: ${totalWidthDisplay}`, offsetX + scaledTotalWidth / 2, totalLabelY - 8);
    
    // Panel height annotation - EXACTLY MATCH WALL'S OFFSET DISTANCE
    // Wall dimensions are at: wallOffsetX - 30
    // Panel dimensions should be at: offsetX - 30 
    // But we need to ensure the VISUAL distance is the same
    
    // Calculate the exact same relative offset as the wall uses
    const wallHeightOffset = 30;  // This is the distance wall height uses from wall edge
    const panelHeightLineX = offsetX - wallHeightOffset;  // Use EXACT same offset value
    const panelHeightTextX = panelHeightLineX - 15;  // Use EXACT same text spacing
    
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
    if (pattern.saleType === 'yard' && calculations.panelLengthInches !== undefined) {
        const inches = calculations.panelLengthInches;
        heightDisplay = inches > 0 ? 
            `Panel: ${calculations.panelLength}'-${inches}"` : `Panel: ${calculations.panelLength}'-0"`;
    } else {
        heightDisplay = `Panel: ${calculations.panelLength}'-0"`;
    }
    
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
    
    // ABSOLUTELY NO WALL DIMENSIONS HERE - THEY'RE MOVED TO SECTION 2 ONLY
}

// Draw panel labels (A/B/C sequence) - ABSOLUTELY NO BOXES OR BORDERS
function drawPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    // ONLY draw labels if we have a panel sequence
    if (pattern.saleType === 'panel' && pattern.sequenceLength > 1) {
        // Set font and style
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        // Draw each label as PLAIN TEXT ONLY
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const centerX = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const labelText = pattern.panelSequence[sequencePosition];
            
            // Position above panels with clear spacing
            const textY = offsetY - 25;
            
            // ONLY draw text - NO fillRect, NO strokeRect, NO background, NO border
            ctx.fillText(labelText, centerX, textY);
        }
    }
}

// Draw Wall Only View - COMPLETELY REWRITTEN WITH LEFT SIDE HEIGHT
function drawWallOnlyView(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale) {
    const { pattern, wallWidth, wallHeight, calculations, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    
    // Draw the pattern first
    if (imageLoaded && patternImage) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // Clip to wall area
        ctx.beginPath();
        ctx.rect(Math.floor(wallOffsetX), Math.floor(wallOffsetY), Math.ceil(scaledWallWidth), Math.ceil(scaledWallHeight));
        ctx.clip();
        
        // Use same coordinates as complete view for consistency
        const leftMargin = 120;
        const maxWidth = 1400 - leftMargin - 120;
        const scaledTotalWidth = calculations.totalWidth * scale;
        const completeViewOffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
        const completeViewWallOffsetX = completeViewOffsetX + (scaledTotalWidth - (wallWidth * scale)) / 2;
        
        // Calculate transformation
        const xTransform = wallOffsetX - completeViewWallOffsetX;
        
        const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
            (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
        const repeatH = pattern.repeatHeight * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeatWidth / pattern.sequenceLength;
        
        for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
            const completeViewPanelX = completeViewOffsetX + (panelIndex * pattern.panelWidth * scale);
            const panelX = completeViewPanelX + xTransform;
            const sequencePosition = panelIndex % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            for (let x = -repeatW; x < pattern.panelWidth * scale + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight) {
                    for (let y = -repeatH; y < scaledWallHeight + repeatH; y += repeatH) {
                        const drawX = Math.floor(panelX + x - (sourceOffsetX * scale));
                        const drawY = Math.floor(wallOffsetY + y);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                } else {
                    const drawX = Math.floor(panelX + x - (sourceOffsetX * scale));
                    const drawY = Math.floor(wallOffsetY + scaledWallHeight - repeatH);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                }
            }
        }
        
        ctx.restore();
        ctx.imageSmoothingEnabled = true;
    }
    
    // Draw uncovered area if needed
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    if (hasLimitation) {
        const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const coveredHeight = actualPanelLengthToUse * 12 * scale;
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
    
    // Add section label
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Final Result', wallOffsetX + scaledWallWidth / 2, wallOffsetY - 15);
    
    // WALL DIMENSIONS - COMPLETELY REWRITTEN
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial, sans-serif';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Format the dimension text
    const wallWidthText = wallWidthInches > 0 ? 
        `Wall: ${wallWidthFeet}'-${wallWidthInches}"` : `Wall: ${wallWidthFeet}'-0"`;
    const wallHeightText = wallHeightInches > 0 ? 
        `Wall: ${wallHeightFeet}'-${wallHeightInches}"` : `Wall: ${wallHeightFeet}'-0"`;
    
    // 1. WALL WIDTH (bottom of wall)
    const widthLineY = wallOffsetY + scaledWallHeight + 30;
    const widthTextY = widthLineY + 15;
    
    // Draw width dimension line
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY);
    ctx.stroke();
    
    // Draw width end marks
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLineY - 5);
    ctx.lineTo(wallOffsetX, widthLineY + 5);
    ctx.moveTo(wallOffsetX + scaledWallWidth, widthLineY - 5);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLineY + 5);
    ctx.stroke();
    
    // Draw width text
    ctx.textAlign = 'center';
    ctx.fillText(wallWidthText, wallOffsetX + scaledWallWidth / 2, widthTextY);
    
    // 2. WALL HEIGHT (LEFT SIDE OF WALL) - USE SAME OFFSET AS PANELS
    const wallHeightOffset = 30;  // SAME VALUE AS PANELS USE
    const heightLineX = wallOffsetX - wallHeightOffset;  // Use consistent offset
    const heightTextX = heightLineX - 15;   // Use consistent text spacing
    
    // Draw height dimension line
    ctx.beginPath();
    ctx.moveTo(heightLineX, wallOffsetY);
    ctx.lineTo(heightLineX, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    // Draw height end marks
    ctx.beginPath();
    ctx.moveTo(heightLineX - 5, wallOffsetY);
    ctx.lineTo(heightLineX + 5, wallOffsetY);
    ctx.moveTo(heightLineX - 5, wallOffsetY + scaledWallHeight);
    ctx.lineTo(heightLineX + 5, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    // Draw height text (rotated)
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
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Use the same layout logic as the main preview
    const leftMargin = 80;
    const rightMargin = 80;
    const topMargin = 100;
    const bottomMargin = 100;
    const sectionGap = 40;
    
    const maxWidth = canvasWidth - leftMargin - rightMargin;
    const maxHeight = canvasHeight - topMargin - bottomMargin;
    
    const wallOnlyHeight = wallHeight;
    const completeViewHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = completeViewHeight + wallOnlyHeight + sectionGap;
    
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const actualContentHeight = (completeViewHeight * scale) + (wallOnlyHeight * scale) + sectionGap;
    let currentY = topMargin + (maxHeight - actualContentHeight) / 2;
    
    const offsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    // Section 1: Complete view
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = currentY + ((completeViewHeight * scale) - scaledWallHeight) / 2;
    
    drawCompleteViewWithAnnotations(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, 
                                   scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    currentY += completeViewHeight * scale + sectionGap;
    
    // Section 2: Wall only
    const wallOnlyOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    drawWallOnlyView(ctx, wallOnlyOffsetX, currentY, scaledWallWidth, scaledWallHeight, scale);
}

// Make generatePreview globally accessible
window.generatePreview = generatePreview;
