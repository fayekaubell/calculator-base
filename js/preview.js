// Enhanced Canvas Preview Generation Module - 2-Section Layout

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
        drawEnhancedPreview();
        
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
            canvas.onclick = openEnhancedCanvasModal;
        } else {
            canvas.style.cursor = 'default';
            canvas.onclick = null;
        }
        
        console.log('✅ Enhanced preview generation complete');
        
    } catch (error) {
        console.error('❌ Error in generatePreview:', error);
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        alert('An error occurred: ' + error.message);
    }
}

// Update preview info display (unchanged)
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

// Enhanced 2-section preview drawing
function drawEnhancedPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    // Clear canvas with subtle gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f9fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate enhanced layout
    const margins = { left: 80, right: 40, top: 100, bottom: 80 };
    const sectionGap = 60;
    const maxWidth = canvas.width - margins.left - margins.right;
    const maxHeight = canvas.height - margins.top - margins.bottom;
    
    // Calculate dimensions for both sections
    const effectiveHeight = calculations.totalHeight;
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = effectiveHeight + section2VisualHeight + sectionGap;
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const actualContentHeight = scaledTotalHeight + Math.max(scaledTotalHeight, scaledWallHeight) + sectionGap;
    let currentY = margins.top + (maxHeight - actualContentHeight) / 2;
    
    const offsetX = margins.left + (maxWidth - scaledTotalWidth) / 2;
    
    // Draw section labels
    drawSectionLabel(ctx, offsetX, currentY - 30, scaledTotalWidth, 'PANEL LAYOUT & DIMENSIONS', '#2c3e50');
    
    // Section 1: Enhanced Panel Layout with dimensions and labels
    drawEnhancedSection1(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale);
    
    // Transition arrow
    drawEnhancedTransitionArrow(ctx, offsetX, currentY + scaledTotalHeight, scaledTotalWidth, sectionGap);
    
    currentY += scaledTotalHeight + sectionGap;
    
    // Draw second section label
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallCenterX = wallOffsetX + scaledWallWidth / 2;
    drawSectionLabel(ctx, wallCenterX - scaledWallWidth / 2, currentY - 30, scaledWallWidth, 'WALL COVERAGE VIEW', '#2c3e50');
    
    // Section 2: Enhanced wall view
    const wallOffsetY = currentY + (Math.max(scaledTotalHeight, scaledWallHeight) - scaledWallHeight) / 2;
    drawEnhancedSection2(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, 
                        scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
}

// Enhanced Section 1: Panel Layout with integrated dimensions and labels
function drawEnhancedSection1(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Draw pattern with enhanced quality
    if (imageLoaded && patternImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
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
            
            // Draw pattern tiles with improved positioning
            for (let x = -repeatW; x < panelWidth + repeatW; x += repeatW) {
                if (pattern.hasRepeatHeight) {
                    for (let y = -repeatH; y < scaledTotalHeight + repeatH; y += repeatH) {
                        const drawX = panelX + x - (sourceOffsetX * scale);
                        const drawY = offsetY + y;
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
    }
    
    // Enhanced panel outlines with better styling
    drawEnhancedPanelOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
    
    // Integrated dimension labels
    drawIntegratedDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
    
    // Enhanced panel labels
    drawEnhancedPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale);
}

// Enhanced Section 2: Wall coverage view
function drawEnhancedSection2(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                             scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Calculate panel coverage
    const actualPanelLengthToUse = calculations.exceedsAvailableLength ? 
        calculations.actualPanelLength : calculations.panelLength;
    const panelCoverageHeight = actualPanelLengthToUse * 12 * scale;
    const panelStartY = wallOffsetY + Math.max(0, scaledWallHeight - panelCoverageHeight);
    const actualPanelHeight = Math.min(panelCoverageHeight, scaledWallHeight);
    
    const hasLimitation = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    
    // Draw pattern with improved rendering
    if (imageLoaded && patternImage) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const repeatW = pattern.saleType === 'yard' ? pattern.repeatWidth * scale :
            (pattern.sequenceLength === 1 ? pattern.panelWidth * scale : pattern.repeatWidth * scale);
        const repeatH = pattern.repeatHeight * scale;
        const offsetPerPanel = pattern.sequenceLength === 1 ? 0 : pattern.repeatWidth / pattern.sequenceLength;
        
        // Draw background pattern at reduced opacity
        ctx.globalAlpha = 0.3;
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
        
        // Draw wall area at full opacity with enhanced clipping
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
    
    // Draw uncovered area with enhanced styling
    if (hasLimitation) {
        const uncoveredAreaHeight = scaledWallHeight - actualPanelHeight;
        if (uncoveredAreaHeight > 0) {
            // Create pattern for uncovered area
            const gradient = ctx.createLinearGradient(wallOffsetX, wallOffsetY, wallOffsetX, wallOffsetY + uncoveredAreaHeight);
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0.4)');
            ctx.fillStyle = gradient;
            ctx.fillRect(wallOffsetX, wallOffsetY, scaledWallWidth, uncoveredAreaHeight);
            
            // Add diagonal stripes to indicate uncovered area
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            for (let i = 0; i < scaledWallWidth + uncoveredAreaHeight; i += 15) {
                ctx.beginPath();
                ctx.moveTo(wallOffsetX + i, wallOffsetY);
                ctx.lineTo(wallOffsetX + i - uncoveredAreaHeight, wallOffsetY + uncoveredAreaHeight);
                ctx.stroke();
            }
        }
    }
    
    // Enhanced outlines and labels
    drawEnhancedSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
}

// Enhanced helper functions
function drawSectionLabel(ctx, x, y, width, text, color = '#2c3e50') {
    ctx.fillStyle = color;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y);
}

function drawEnhancedPanelOutlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Main panel outlines with enhanced styling
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    
    // Enhanced dashed lines between panels
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 6]);
    for (let i = 1; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + scaledTotalHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawEnhancedPanelLabels(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    if (pattern.saleType === 'panel' && pattern.sequenceLength > 1) {
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < calculations.panelsNeeded; i++) {
            const x = offsetX + (i * pattern.panelWidth + pattern.panelWidth / 2) * scale;
            const sequencePosition = i % pattern.sequenceLength;
            const label = pattern.panelSequence[sequencePosition];
            
            // Enhanced label background
            const textWidth = ctx.measureText(label).width;
            const padding = 8;
            
            ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
            ctx.fillRect(x - textWidth/2 - padding, offsetY + 15, textWidth + padding * 2, 28);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, x, offsetY + 35);
        }
    }
}

function drawIntegratedDimensions(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, scale) {
    const { pattern, calculations } = currentPreview;
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    
    // Individual panel width (if multiple panels)
    if (calculations.panelsNeeded > 1) {
        const panelWidthFeet = Math.floor(pattern.panelWidth / 12);
        const panelWidthInches = pattern.panelWidth % 12;
        const panelWidthDisplay = panelWidthInches > 0 ? 
            `${panelWidthFeet}'-${panelWidthInches}"` : `${panelWidthFeet}'-0"`;
        
        const panelStartX = offsetX;
        const panelEndX = offsetX + (pattern.panelWidth * scale);
        const labelY = offsetY - 50;
        
        drawEnhancedDimensionLine(ctx, panelStartX, labelY, panelEndX, labelY, panelWidthDisplay, '#3498db');
    }
    
    // Total width
    const totalWidthFeet = Math.floor(calculations.totalWidth / 12);
    const totalWidthInches = calculations.totalWidth % 12;
    const totalWidthDisplay = totalWidthInches > 0 ? 
        `${totalWidthFeet}'-${totalWidthInches}"` : `${totalWidthFeet}'-0"`;
    
    const totalLabelY = offsetY - 25;
    drawEnhancedDimensionLine(ctx, offsetX, totalLabelY, offsetX + scaledTotalWidth, totalLabelY, totalWidthDisplay, '#e74c3c');
    
    // Height
    const heightLabelX = offsetX - 50;
    
    let heightDisplay;
    if (pattern.saleType === 'yard' && calculations.panelLengthInches !== undefined) {
        const inches = calculations.panelLengthInches;
        heightDisplay = inches > 0 ? 
            `${calculations.panelLength}'-${inches}"` : `${calculations.panelLength}'-0"`;
    } else {
        heightDisplay = `${calculations.panelLength}'-0"`;
    }
    
    drawEnhancedVerticalDimension(ctx, heightLabelX, offsetY, heightLabelX, offsetY + scaledTotalHeight, heightDisplay, '#27ae60');
}

function drawEnhancedDimensionLine(ctx, x1, y, x2, y2, text, color = '#2c3e50') {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrows
    drawEnhancedArrowHead(ctx, x1, y, 'right', color);
    drawEnhancedArrowHead(ctx, x2, y2, 'left', color);
    
    // Draw text with background
    const textWidth = ctx.measureText(text).width;
    const centerX = (x1 + x2) / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(centerX - textWidth/2 - 6, y - 20, textWidth + 12, 16);
    
    ctx.fillStyle = color;
    ctx.fillText(text, centerX, y - 8);
}

function drawEnhancedVerticalDimension(ctx, x, y1, x2, y2, text, color = '#2c3e50') {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrows
    drawEnhancedArrowHead(ctx, x, y1, 'down', color);
    drawEnhancedArrowHead(ctx, x2, y2, 'up', color);
    
    // Draw rotated text with background
    ctx.save();
    ctx.translate(x - 25, (y1 + y2) / 2);
    ctx.rotate(-Math.PI/2);
    
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(-textWidth/2 - 6, -8, textWidth + 12, 16);
    
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

function drawEnhancedArrowHead(ctx, x, y, direction, color = '#2c3e50') {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    
    const arrowSize = 8;
    
    ctx.beginPath();
    switch(direction) {
        case 'right':
            ctx.moveTo(x, y);
            ctx.lineTo(x + arrowSize, y - arrowSize/2);
            ctx.lineTo(x + arrowSize, y + arrowSize/2);
            ctx.closePath();
            break;
        case 'left':
            ctx.moveTo(x, y);
            ctx.lineTo(x - arrowSize, y - arrowSize/2);
            ctx.lineTo(x - arrowSize, y + arrowSize/2);
            ctx.closePath();
            break;
        case 'down':
            ctx.moveTo(x, y);
            ctx.lineTo(x - arrowSize/2, y + arrowSize);
            ctx.lineTo(x + arrowSize/2, y + arrowSize);
            ctx.closePath();
            break;
        case 'up':
            ctx.moveTo(x, y);
            ctx.lineTo(x - arrowSize/2, y - arrowSize);
            ctx.lineTo(x + arrowSize/2, y - arrowSize);
            ctx.closePath();
            break;
    }
    ctx.fill();
    ctx.stroke();
}

function drawEnhancedTransitionArrow(ctx, offsetX, startY, width, gap) {
    const { calculations } = currentPreview;
    
    ctx.strokeStyle = '#7f8c8d';
    ctx.fillStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    
    // Draw curved arrows pointing down from each panel to the wall view
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const panelCenterX = offsetX + (i * currentPreview.pattern.panelWidth + currentPreview.pattern.panelWidth / 2) * (width / currentPreview.calculations.totalWidth);
        
        const startArrowY = startY + 15;
        const endArrowY = startY + gap - 15;
        const midY = startY + gap / 2;
        
        // Draw curved line
        ctx.beginPath();
        ctx.moveTo(panelCenterX, startArrowY);
        ctx.quadraticCurveTo(panelCenterX, midY, panelCenterX, endArrowY);
        ctx.stroke();
        
        // Draw arrow head at bottom
        drawEnhancedArrowHead(ctx, panelCenterX, endArrowY, 'down', '#7f8c8d');
    }
    
    // Add text label in the middle
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Applied to wall', offsetX + width / 2, startY + gap / 2 + 5);
}

function drawEnhancedSection2Outlines(ctx, offsetX, offsetY, scaledTotalWidth, scaledTotalHeight, 
                                     scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale) {
    const { pattern, calculations } = currentPreview;
    
    // Enhanced wall outline with shadow effect
    ctx.save();
    
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeRect(wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
    
    ctx.restore();
    
    // Panel coverage outlines (subtle)
    ctx.strokeStyle = 'rgba(127, 140, 141, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);
    
    for (let i = 0; i < calculations.panelsNeeded; i++) {
        const x = offsetX + (i * pattern.panelWidth * scale);
        const width = pattern.panelWidth * scale;
        ctx.strokeRect(x, offsetY, width, scaledTotalHeight);
    }
    ctx.setLineDash([]);
    
    // Wall dimensions
    drawWallDimensionsEnhanced(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight);
}

function drawWallDimensionsEnhanced(ctx, wallOffsetX, wallOffsetY, scaledWallWidth, scaledWallHeight) {
    const { wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = currentPreview;
    
    const widthDisplay = wallWidthInches > 0 ? 
        `${wallWidthFeet}'-${wallWidthInches}"` : `${wallWidthFeet}'-0"`;
    const heightDisplay = wallHeightInches > 0 ? 
        `${wallHeightFeet}'-${wallHeightInches}"` : `${wallHeightFeet}'-0"`;
    
    // Width dimension (bottom)
    const widthLabelY = wallOffsetY + scaledWallHeight + 35;
    drawEnhancedDimensionLine(ctx, wallOffsetX, widthLabelY, wallOffsetX + scaledWallWidth, widthLabelY, 
                             `WALL WIDTH: ${widthDisplay}`, '#e74c3c');
    
    // Height dimension (right side)
    const heightLabelX = wallOffsetX + scaledWallWidth + 35;
    drawEnhancedVerticalDimension(ctx, heightLabelX, wallOffsetY, heightLabelX, wallOffsetY + scaledWallHeight, 
                                 `WALL HEIGHT: ${heightDisplay}`, '#e74c3c');
}

// Enhanced modal functionality
function openEnhancedCanvasModal() {
    const canvas = document.getElementById('previewCanvas');
    
    if (!currentPreview) {
        console.error('No current preview data available for high-res rendering');
        return;
    }
    
    console.log('Creating enhanced high-res modal...');
    
    const modal = document.createElement('div');
    modal.className = 'canvas-modal-enhanced';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-btn';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'modal-canvas-container';
    
    const largeCanvas = document.createElement('canvas');
    
    const hiResScale = 2;
    const baseScale = 3;
    largeCanvas.width = canvas.width * hiResScale * baseScale;
    largeCanvas.height = canvas.height * hiResScale * baseScale;
    
    const displayWidth = Math.min(window.innerWidth * 0.9, 1600);
    const canvasAspectRatio = canvas.width / canvas.height;
    const displayHeight = displayWidth / canvasAspectRatio;
    
    largeCanvas.style.width = displayWidth + 'px';
    largeCanvas.style.height = displayHeight + 'px';
    largeCanvas.className = 'modal-canvas';
    
    const largeCtx = largeCanvas.getContext('2d');
    
    largeCtx.imageSmoothingEnabled = true;
    largeCtx.imageSmoothingQuality = 'high';
    largeCtx.scale(hiResScale * baseScale, hiResScale * baseScale);
    
    // Draw enhanced high-res preview
    renderEnhancedHighQualityPreview(largeCtx, canvas.width, canvas.height);
    
    canvasContainer.appendChild(largeCanvas);
    modal.appendChild(closeButton);
    modal.appendChild(canvasContainer);
    
    // Enhanced modal event handlers
    modal.onclick = (e) => {
        if (e.target === modal || e.target === canvasContainer) {
            document.body.removeChild(modal);
        }
    };
    
    // Add keyboard support
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);
    
    document.body.appendChild(modal);
    
    // Add entrance animation
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
}

function renderEnhancedHighQualityPreview(ctx, canvasWidth, canvasHeight) {
    // Use the same enhanced drawing logic but with higher quality settings
    const originalCurrentPreview = currentPreview;
    
    // Temporarily scale up for high-res rendering
    const tempCanvas = { width: canvasWidth, height: canvasHeight };
    
    // Clear with enhanced gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f2f5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Enhanced rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';
    
    // Call the same enhanced drawing function
    const { pattern, wallWidth, wallHeight, calculations } = currentPreview;
    
    const margins = { left: 80, right: 40, top: 100, bottom: 80 };
    const sectionGap = 60;
    const maxWidth = canvasWidth - margins.left - margins.right;
    const maxHeight = canvasHeight - margins.top - margins.bottom;
    
    const effectiveHeight = calculations.totalHeight;
    const section2VisualHeight = Math.max(calculations.totalHeight, wallHeight);
    const totalContentHeight = effectiveHeight + section2VisualHeight + sectionGap;
    const effectiveWidth = Math.max(calculations.totalWidth, wallWidth);
    
    const widthScale = maxWidth / effectiveWidth;
    const heightScale = maxHeight / totalContentHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const scaledTotalWidth = calculations.totalWidth * scale;
    const scaledTotalHeight = calculations.totalHeight * scale;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    
    const actualContentHeight = scaledTotalHeight + Math.max(scaledTotalHeight, scaledWallHeight) + sectionGap;
    let currentY = margins.top + (maxHeight - actualContentHeight) / 2;
    
    const offsetX = margins.left + (maxWidth - scaledTotalWidth) / 2;
    
    // Draw with enhanced quality
    drawSectionLabel(ctx, offsetX, currentY - 30, scaledTotalWidth, 'PANEL LAYOUT & DIMENSIONS', '#2c3e50');
    drawEnhancedSection1(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, scale);
    drawEnhancedTransitionArrow(ctx, offsetX, currentY + scaledTotalHeight, scaledTotalWidth, sectionGap);
    
    currentY += scaledTotalHeight + sectionGap;
    
    const wallOffsetX = offsetX + (scaledTotalWidth - scaledWallWidth) / 2;
    const wallCenterX = wallOffsetX + scaledWallWidth / 2;
    drawSectionLabel(ctx, wallCenterX - scaledWallWidth / 2, currentY - 30, scaledWallWidth, 'WALL COVERAGE VIEW', '#2c3e50');
    
    const wallOffsetY = currentY + (Math.max(scaledTotalHeight, scaledWallHeight) - scaledWallHeight) / 2;
    drawEnhancedSection2(ctx, offsetX, currentY, scaledTotalWidth, scaledTotalHeight, 
                        scaledWallWidth, scaledWallHeight, wallOffsetX, wallOffsetY, scale);
}

// Update the main function reference for backward compatibility
window.generatePreview = generatePreview;
window.drawPreview = drawEnhancedPreview;
