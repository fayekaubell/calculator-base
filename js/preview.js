// Preview Module - Main orchestration with new tab high-res view
// Canvas drawing functions in canvas-drawing.js
// High-res generation reuses existing PDF generation code

// Generate preview function - main coordination logic
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
        
        // Validation
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
        
        // Set up currentPreview object for use by other modules
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
        
        // Update the preview info section
        updatePreviewInfo();
        
        // Draw the canvas preview (function now in canvas-drawing.js)
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
        
        // Add click handler for canvas high-res view in new tab
        const canvas = document.getElementById('previewCanvas');
        canvas.style.cursor = 'zoom-in';
        canvas.onclick = openHighResInNewTab;
        canvas.title = 'Click to open high-resolution view in new tab';
        
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

// Update preview info display - handles the order quantities section
function updatePreviewInfo() {
    const { calculations } = currentPreview;
    
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
        
        // Hide panel-specific lines for yard patterns
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
        
        // Show panel-specific lines for panel patterns
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

// NEW: Open high-resolution preview in new tab using existing PDF generation code
async function openHighResInNewTab() {
    if (!currentPreview) {
        console.error('No current preview data available for high-res rendering');
        alert('Please generate a preview first');
        return;
    }
    
    try {
        console.log('🔍 Generating high-resolution preview for new tab...');
        
        // Show loading cursor
        const canvas = document.getElementById('previewCanvas');
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'wait';
        canvas.title = 'Generating high-resolution view...';
        
        // Generate high-resolution canvas using existing PDF generation code
        // Ultra high resolution: 4K+ for maximum sharpness and detail
        const targetWidth = 4800;  // 600 DPI equivalent for 8" width - much sharper
        const targetHeight = 3600; // 600 DPI equivalent for 6" height - much sharper
        
        console.log('📐 Generating canvas at:', targetWidth, 'x', targetHeight);
        
        // Reuse the existing generateHighResCanvas function from PDF generation
        const canvasDataUrl = await generateHighResCanvasForViewing(targetWidth, targetHeight);
        
        if (!canvasDataUrl) {
            throw new Error('Failed to generate high-resolution canvas');
        }
        
        // Create the content for the new tab
        const { pattern, formattedWidth, formattedHeight } = currentPreview;
        const title = `${pattern.name} - ${pattern.sku} - ${formattedWidth}w x ${formattedHeight}h`;
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #1a1a1a;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 20px;
            overflow-x: auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            max-width: 90vw;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            line-height: 1.3;
            word-break: break-word;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 30px;
        }
        
        .image-container {
            max-width: 95vw;
            max-height: 80vh;
            overflow: auto;
            border: 2px solid #333;
            border-radius: 8px;
            background: white;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        .preview-image {
            display: block;
            max-width: 100%;
            height: auto;
            cursor: zoom-in;
        }
        
        .preview-image.zoomed {
            cursor: zoom-out;
            max-width: none;
            width: auto;
            height: auto;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            opacity: 0.6;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 20px;
            }
            
            .btn {
                width: 200px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${pattern.name}</h1>
        <p>${pattern.sku || 'N/A'} • ${formattedWidth}w x ${formattedHeight}h Wall</p>
    </div>
    
    <div class="image-container">
        <img id="previewImage" class="preview-image" src="${canvasDataUrl}" alt="High-resolution wallpaper preview">
    </div>
    
    <div class="footer">
        <p>Generated by ${CONFIG.business.name} Wallpaper Calculator</p>
        <p>Right-click image to save • Click image to zoom • Z = zoom, D = download, Escape = close</p>
    </div>
    
    <script>
        let isZoomed = false;
        
        function toggleZoom() {
            const img = document.getElementById('previewImage');
            const container = img.parentElement;
            
            if (isZoomed) {
                img.classList.remove('zoomed');
                container.style.overflow = 'auto';
                isZoomed = false;
            } else {
                img.classList.add('zoomed');
                container.style.overflow = 'scroll';
                isZoomed = true;
            }
        }
        
        function downloadImage() {
            const link = document.createElement('a');
            link.download = '${pattern.sku || 'wallpaper'}-preview-${Date.now()}.png';
            link.href = '${canvasDataUrl}';
            link.click();
        }
        
        // Click image to zoom
        document.getElementById('previewImage').onclick = toggleZoom;
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.close();
            } else if (e.key === 'z' || e.key === 'Z') {
                toggleZoom();
            } else if (e.key === 'd' || e.key === 'D') {
                downloadImage();
            }
        });
        
        console.log('High-resolution wallpaper preview loaded');
        console.log('Keyboard shortcuts: Z = zoom, D = download, Escape = close');
    </script>
</body>
</html>`;
        
        // Open in new tab
        const newTab = window.open('', '_blank');
        if (!newTab) {
            // Popup blocked - fallback to download
            console.warn('Popup blocked, offering download instead');
            const link = document.createElement('a');
            link.download = `${pattern.sku || 'wallpaper'}-preview-${Date.now()}.png`;
            link.href = canvasDataUrl;
            link.click();
            
            alert('Popup blocked. High-resolution image has been downloaded instead.');
        } else {
            newTab.document.write(htmlContent);
            newTab.document.close();
            console.log('✅ High-resolution preview opened in new tab');
        }
        
        // Restore canvas cursor and title
        canvas.style.cursor = originalCursor;
        canvas.title = 'Click to open high-resolution view in new tab';
        
    } catch (error) {
        console.error('❌ Error generating high-res preview:', error);
        
        // Restore canvas cursor
        const canvas = document.getElementById('previewCanvas');
        canvas.style.cursor = 'zoom-in';
        canvas.title = 'Click to open high-resolution view in new tab';
        
        alert('Error generating high-resolution preview: ' + error.message);
    }
}

// Generate high-resolution canvas specifically for viewing (adapted from PDF generation)
async function generateHighResCanvasForViewing(targetWidth, targetHeight) {
    return new Promise((resolve) => {
        try {
            // Create high-resolution canvas
            const hiResCanvas = document.createElement('canvas');
            hiResCanvas.width = targetWidth;
            hiResCanvas.height = targetHeight;
            const hiResCtx = hiResCanvas.getContext('2d');
            
            // Enable high-quality rendering
            hiResCtx.imageSmoothingEnabled = true;
            hiResCtx.imageSmoothingQuality = 'high';
            
            // Calculate scale factor
            const originalCanvas = document.getElementById('previewCanvas');
            const scaleX = targetWidth / originalCanvas.width;
            const scaleY = targetHeight / originalCanvas.height;
            
            // Use the smaller scale to maintain aspect ratio
            const scale = Math.min(scaleX, scaleY);
            
            // Calculate centered position
            const scaledWidth = originalCanvas.width * scale;
            const scaledHeight = originalCanvas.height * scale;
            const offsetX = (targetWidth - scaledWidth) / 2;
            const offsetY = (targetHeight - scaledHeight) / 2;
            
            // Fill background
            hiResCtx.fillStyle = '#ffffff';
            hiResCtx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Scale and render
            hiResCtx.save();
            hiResCtx.translate(offsetX, offsetY);
            hiResCtx.scale(scale, scale);
            
            // Render the preview using existing high-quality rendering from PDF module
            renderHighQualityPreviewForViewing(hiResCtx, originalCanvas.width, originalCanvas.height);
            
            hiResCtx.restore();
            
            // Convert to data URL with high quality
            const dataUrl = hiResCanvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
            
        } catch (error) {
            console.error('Error generating high-res canvas for viewing:', error);
            resolve(null);
        }
    });
}

// Render high-quality preview for viewing (reuses PDF rendering logic)
function renderHighQualityPreviewForViewing(ctx, canvasWidth, canvasHeight) {
    if (!currentPreview) return;
    
    // Temporarily override canvas reference for coordinate calculations
    const tempCanvas = { width: canvasWidth, height: canvasHeight };
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        if (id === 'previewCanvas') return tempCanvas;
        return originalGetElementById.call(document, id);
    };
    
    try {
        // Calculate reference coordinates
        const referenceCoords = calculateReferenceCoordinates();
        
        // Draw both sections using existing canvas drawing functions
        drawCompleteViewWithOverlay(ctx, referenceCoords);
        drawWallOnlyView(ctx, referenceCoords);
        
    } finally {
        // Restore original function
        document.getElementById = originalGetElementById;
    }
}

// Make generatePreview globally accessible
window.generatePreview = generatePreview;
