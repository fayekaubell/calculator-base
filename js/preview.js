// Canvas Preview Generation Module

// Generate preview function
async function generatePreview() {
    try {
        console.log('🎨 Resetting preview state completely...');
        currentPreview = null;
        patternImage = null;
        imageLoaded = false;
        
        document.getElementById('previewSection').style.display = 'none';
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
        
        const previewTitle = document.getElementById('previewTitle');
        if (previewTitle) {
            previewTitle.textContent = `${pattern.name}: ${pattern.sku || 'N/A'}: ${formattedWidth}w x ${formattedHeight}h Wall`;
        }
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        const previewSection = document.getElementById('previewSection');
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
        
        const loadingOverlay = document.getElementById('loadingOverlay');
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
        const loadingOverlay = document.getElementById('loadingOverlay');
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

// Draw preview on canvas
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale
    const leftMargin = 60;
    const rightMargin = 30;
    const maxWidth = canvas.width - leftMargin - rightMargin;
    const maxHeight = canvas.height - 80;
    
    const sectionGap1 = 30;
    const sectionGap2 = 25;
    const dimensionSpace = 60;
    
    // Determine content dimensions
    const effectiveHeight = calculations.totalHeight;
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = (effectiveHeight + section2VisualHeight + wallHeight) + sectionGap1 + sectionGap2 + dimensionSpace;
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const actualContentHeight = (effectiveHeight * scale) + (section2VisualHeight * scale) + (scaledWallHeight) + sectionGap1 + sectionGap2 + dimensionSpace;
    let currentY = (canvas.height - actualContentHeight) / 2 + (dimensionSpace * 0.7);
    
    const offsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
    
    // Section 1: Panel layout
    drawSection1_PanelLayout(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale);
    drawArrowsBetweenSections(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale, sectionGap1);
    
    currentY += effectiveHeight * scale + sectionGap1;
    
    // Section 2: Complete view with wall overlay
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = currentY + ((section2VisualHeight * scale) - scaledWallHeight) / 2;
    drawSection2_CompleteView(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    currentY += section2VisualHeight * scale + sectionGap2;
    
    // Section 3: Wall only
    const wallOnlyOffsetX = leftMargin + (maxWidth - scaledWallWidth) / 2;
    drawSection3_WallOnly(ctx, wallOnlyOffsetX, currentY, scaledWallWidth, scaledWallHeight, scale);
}

// Draw Section 1: Panel Layout
function drawSection1_PanelLayout(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Draw pattern if image is loaded
    if (imageLoaded && patternImage) {
        const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
            (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
        const repeatH = pattern.repeatHeight * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeatWidth / pattern.sequenceLength;
        
        for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
            const panelX = offsetX + (panelIndex * pattern.panelWidth * scale);
            const panelWidth = pattern.panelWidth * scale;
            const sequencePosition = panelIndex % pattern.sequenceLength;
            const sourceOffsetX = sequencePosition * offsetPerPanel;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(panelX, offsetY, panelWidth, scaledTotalHeight);
            ctx.clip();
            
            const panelBottomY = offsetY + scaledTotalHeight;
            
            // Draw pattern tiles
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight) {
                    // Normal repeating pattern
                    for (let y = -repeatH; y < scaledTotalHeight + repeatH; y += repeatH) {
                        const drawX = panelX + x - (sourceOffsetX * scale);
                        const drawY = offsetY + y;
                        ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                    }
                } else {
                    // Non-repeating pattern - anchor to bottom
                    const drawX = panelX + x - (sourceOffsetX * scale);
                    const drawY = panelBottomY - repeatH;
                    ctx.drawImage(patternImage, drawX, drawY, repeatW, repeatH);
                }
            }
            
            ctx.restore();
        }
    }
    
    // Draw panel outlines and labels
    drawPanelOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, true);
}

// Draw Section 2: Complete View
function drawSection2_CompleteView(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Calculate panel coverage
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
    
    // Draw outlines
    drawSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
}

// Draw Section 3: Wall Only
function drawSection3_WallOnly(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight, scale) {
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    if (imageLoaded && patternImage) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // Clip to wall area
        ctx.beginPath();
        ctx.rect(Math.floor(wallOffsetX), Math.floor(wallOffsetY), Math.ceil(scaledWallWidth), Math.ceil(scaledWallHeight));
        ctx.clip();
        
        // Use same coordinates as Section 2
        const leftMargin = 60;
        const maxWidth = 1400 - leftMargin - 30;
        const scaledTotalWidth = calculations.totalWidth * scale;
        const section2OffsetX = leftMargin + (maxWidth - scaledTotalWidth) / 2;
        const section2WallOffsetX = section2OffsetX + (scaledTotalWidth - (wallWidth * scale)) / 2;
        
        // Calculate transformation
        const xTransform = wallOffsetX - section2WallOffsetX;
        const yTransform = wallOffsetY - wallOffsetY; // This will be 0 for section 3
        
        const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
        
        const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
            (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
        const repeatH = pattern.repeatHeight * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeatWidth / pattern.sequenceLength;
        
        for (let panelIndex = 0; panelIndex < calculations.panelsNeeded; panelIndex++) {
            const section2PanelX = section2OffsetX + (panelIndex * pattern.panelWidth * scale);
            const panelX = section2PanelX + xTransform;
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
    
    // Draw wall outline and dimensions
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    drawWallDimensions(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
}

// Helper functions for drawing outlines and dimensions
function drawPanelOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, showDimensions) {
    const { pattern, calculations } = currentPreview;
    
    // Panel outlines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([8, 8]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Panel labels (A/B/C etc.)
    if (pattern.saleType === 'panel' && pattern.sequenceLength > 1) {
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const x = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const label = pattern.panelSequence[sequencePosition];
            
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x - textWidth/2 - 6, offsetY - 20, textWidth + 12, 16);
            
            ctx.fillStyle = '#333';
            ctx.fillText(panelWidthDisplay, (panelStartX + panelEndX) / 2, labelY - 6);
    }
    
    // Total width
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = calculations.totalWidth % 12;
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'-0"`;
    
    const totalLabelY = offsetY - 50;
    
    ctx.beginPath();
    ctx.moveTo(offsetX, totalLabelY);
    ctx.lineTo(offsetX + scaledTotalWidth, totalLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, offsetX, totalLabelY, 'right');
    drawArrowHead(ctx, offsetX + scaledTotalWidth, totalLabelY, 'left');
    
    ctx.fillText(totalWidthDisplay, offsetX + scaledTotalWidth / 2, totalLabelY - 6);
    
    // Height
    const heightLabelX = offsetX - 25;
    
    ctx.beginPath();
    ctx.moveTo(heightLabelX, offsetY);
    ctx.lineTo(heightLabelX, offsetY + scaledTotalHeight);
    ctx.stroke();
    
    drawArrowHead(ctx, heightLabelX, offsetY, 'down');
    drawArrowHead(ctx, heightLabelX, offsetY + scaledTotalHeight, 'up');
    
    ctx.save();
    ctx.translate(heightLabelX - 10, offsetY + scaledTotalHeight / 2);
    ctx.rotate(-Math.PI/2);
    
    // Display strip length properly for yard patterns
    let heightDisplay;
    if (pattern.saleType === 'yard' && calculations.panelLengthInches !== undefined) {
        const inches = calculations.panelLengthInches;
        heightDisplay = inches > 0 ? 
            `${calculations.panelLength}'-${inches}"` : `${calculations.panelLength}'-0"`;
    } else {
        heightDisplay = `${calculations.panelLength}'-0"`;
    }
    
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

function drawWallDimensions(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight) {
    const { wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    const widthDisplay = wallWidthInches > 0 ? 
        `${wallWidthFeet}'-${wallWidthInches}"` : `${wallWidthFeet}'-0"`;
    const heightDisplay = wallHeightInches > 0 ? 
        `${wallHeightFeet}'-${wallHeightInches}"` : `${wallHeightFeet}'-0"`;
    
    // Width dimension
    const widthLabelY = wallOffsetY + scaledWallHeight + 20;
    
    ctx.beginPath();
    ctx.moveTo(wallOffsetX, widthLabelY);
    ctx.lineTo(wallOffsetX + scaledWallWidth, widthLabelY);
    ctx.stroke();
    
    drawArrowHead(ctx, wallOffsetX, widthLabelY, 'right');
    drawArrowHead(ctx, wallOffsetX + scaledWallWidth, widthLabelY, 'left');
    
    ctx.fillText(widthDisplay, wallOffsetX + scaledWallWidth / 2, widthLabelY + 12);
    
    // Height dimension
    const heightLabelX = wallOffsetX - 20;
    
    ctx.beginPath();
    ctx.moveTo(heightLabelX, wallOffsetY);
    ctx.lineTo(heightLabelX, wallOffsetY + scaledWallHeight);
    ctx.stroke();
    
    drawArrowHead(ctx, heightLabelX, wallOffsetY, 'down');
    drawArrowHead(ctx, heightLabelX, wallOffsetY + scaledWallHeight, 'up');
    
    ctx.save();
    ctx.translate(heightLabelX - 10, wallOffsetY + scaledWallHeight / 2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(heightDisplay, 0, 0);
    ctx.restore();
}

function drawArrowHead(ctx, x, y, direction) {
    ctx.beginPath();
    switch(direction) {
        case 'right':
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y + 6);
            break;
        case 'left':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y + 6);
            break;
        case 'down':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y + 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y + 6);
            break;
        case 'up':
            ctx.moveTo(x, y);
            ctx.lineTo(x - 6, y - 6);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 6, y - 6);
            break;
    }
    ctx.stroke();
}

function drawArrowsBetweenSections(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale, gap = 25) {
    const { pattern, calculations } = currentPreview;
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 1.0;
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const panelCenterX = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
        
        const middleY = offsetY + scaledTotalHeight + (gap / 2);
        const startY = middleY - 6;
        const endY = middleY + 6;
        
        ctx.beginPath();
        ctx.moveTo(panelCenterX, startY);
        ctx.lineTo(panelCenterX, endY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(panelCenterX, endY);
        ctx.lineTo(panelCenterX - 6, endY - 6);
        ctx.moveTo(panelCenterX, endY);
        ctx.lineTo(panelCenterX + 6, endY - 6);
        ctx.stroke();
    }
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
    
    const maxWidth = canvasWidth - 120;
    const totalAvailableHeight = canvasHeight - 200;
    
    // Use the same spacing logic as the main preview
    const effectiveHeight = calculations.totalHeight;
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = effectiveHeight + section2VisualHeight + wallHeight + 90;
    
    const widthScale = maxWidth / calculations.totalWidth;
    const heightScale = totalAvailableHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const dimensionSpaceAbove = 100;
    const dimensionSpaceBelow = 50;
    const actualContentHeight = dimensionSpaceAbove + (effectiveHeight * scale) + (section2VisualHeight * scale) + (scaledWallHeight) + 90 + dimensionSpaceBelow;
    let currentY = (canvasHeight - actualContentHeight) / 2 + dimensionSpaceAbove;
    
    const offsetX = (canvasWidth - scaledTotalWidth) / 2;
    
    drawSection1_PanelLayout(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale);
    drawArrowsBetweenSections(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale);
    
    currentY += effectiveHeight * scale + 50;
    
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallOffsetY = currentY + ((section2VisualHeight * scale) - scaledWallHeight) / 2;
    drawSection2_CompleteView(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
    
    currentY += section2VisualHeight * scale + 40;
    
    const wallOnlyOffsetX = (canvasWidth - scaledWallWidth) / 2;
    drawSection3_WallOnly(ctx, wallOnlyOffsetX, currentY, scaledWallWidth, scaledWallHeight, scale);
}(label, x, offsetY - 8);
        }
    }
    
    if (showDimensions) {
        drawPanelDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
    }
}

function drawSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Wall outline
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    // Panel outlines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Dashed lines between panels
    ctx.setLineDash([8, 8]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawPanelDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Individual panel width
    const panelWidthFeet = Math.floor(pattern.panelWidth / 12);
    const panelWidthInches = pattern.panelWidth % 12;
    const panelWidthDisplay = panelWidthInches > 0 ? 
        `${panelWidthFeet}'-${panelWidthInches}"` : `${panelWidthFeet}'-0"`;
    
    if (calculations.panelsNeeded > 0) {
        const panelStartX = offsetX;
        const panelEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 30;
        
        ctx.beginPath();
        ctx.moveTo(panelStartX, labelY);
        ctx.lineTo(panelEndX, labelY);
        ctx.stroke();
        
        drawArrowHead(ctx, panelStartX, labelY, 'right');
        drawArrowHead(ctx, panelEndX, labelY, 'left');
        
        ctx.fillText
