// PDF Generation Module - High-resolution 18"x24" PDF export at 300 DPI
// Requires jsPDF library to be loaded

// PDF generation function
async function generatePDF() {
    if (!currentPreview) {
        alert('Please generate a preview first before downloading PDF');
        return;
    }

    try {
        console.log('🎨 Starting PDF generation...');
        
        // Show loading state
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Generating PDF...';
        }

        // PDF dimensions at 300 DPI
        const pdfWidth = 24; // inches (landscape)
        const pdfHeight = 18; // inches
        const dpi = 300;
        const pdfWidthPx = pdfWidth * dpi; // 7200px
        const pdfHeightPx = pdfHeight * dpi; // 5400px

        // Create jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [pdfWidth, pdfHeight]
        });

        // Canvas area dimensions (left side with 0.25" margins)
        const canvasMargin = 0.25;
        const textAreaWidth = 6; // inches for text on right side
        const canvasAreaWidth = pdfWidth - textAreaWidth - (canvasMargin * 3); // 17.25"
        const canvasAreaHeight = pdfHeight - (canvasMargin * 2); // 17.5"
        
        // Generate high-resolution canvas
        const canvasDataUrl = await generateHighResCanvas(canvasAreaWidth * dpi, canvasAreaHeight * dpi);
        
        if (canvasDataUrl) {
            // Add canvas to PDF
            pdf.addImage(
                canvasDataUrl, 
                'PNG', 
                canvasMargin, 
                canvasMargin, 
                canvasAreaWidth, 
                canvasAreaHeight,
                undefined,
                'FAST'
            );
        }

        // Add text content to right side
        await addTextContentToPDF(pdf, canvasAreaWidth + canvasMargin * 2, canvasMargin, textAreaWidth - canvasMargin);

        // Generate filename
        const { pattern } = currentPreview;
        const filename = `Faye-Bell-Wallpaper-Preview-${pattern.sku}-00000.pdf`;

        // Save PDF
        pdf.save(filename);
        
        console.log('✅ PDF generated successfully:', filename);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    } finally {
        // Restore button state
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download PDF';
        }
    }
}

// Generate high-resolution canvas for PDF
async function generateHighResCanvas(targetWidth, targetHeight) {
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
            
            // Render the preview using existing functions
            renderHighQualityPreviewForPDF(hiResCtx, originalCanvas.width, originalCanvas.height);
            
            hiResCtx.restore();
            
            // Convert to data URL
            const dataUrl = hiResCanvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
            
        } catch (error) {
            console.error('Error generating high-res canvas:', error);
            resolve(null);
        }
    });
}

// Render high-quality preview specifically for PDF
function renderHighQualityPreviewForPDF(ctx, canvasWidth, canvasHeight) {
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
        
        // Draw both sections
        drawCompleteViewWithOverlay(ctx, referenceCoords);
        drawWallOnlyView(ctx, referenceCoords);
        
    } finally {
        // Restore original function
        document.getElementById = originalGetElementById;
    }
}

// Add text content to PDF
async function addTextContentToPDF(pdf, startX, startY, maxWidth) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    let currentY = startY + 0.5;
    const lineHeight = 0.2;
    const sectionSpacing = 0.3;
    
    // Title (same as preview)
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    const title = `${pattern.name}: ${pattern.sku || 'N/A'}: ${formattedWidth}w x ${formattedHeight}h Wall`;
    const titleLines = pdf.splitTextToSize(title, maxWidth);
    pdf.text(titleLines, startX, currentY);
    currentY += titleLines.length * lineHeight + sectionSpacing;
    
    // Product links (if available)
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    const links = [
        { text: 'Product Tearsheet >', url: pattern.product_tearsheet_url },
        { text: 'Product Page >', url: pattern.product_page_url },
        { text: '360 View >', url: pattern.product_360_url }
    ];
    
    links.forEach(link => {
        if (link.url && link.url.trim()) {
            pdf.setTextColor(0, 0, 0);
            pdf.text(link.text, startX, currentY, { underline: true });
            currentY += lineHeight + 0.1;
        }
    });
    
    if (links.some(link => link.url && link.url.trim())) {
        currentY += sectionSpacing;
    }
    
    // Pattern Details
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Pattern Details', startX, currentY);
    currentY += lineHeight + 0.1;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    const patternDetails = [
        `Name: ${pattern.name}`,
        `SKU: ${pattern.sku || 'N/A'}`,
        `Type: ${pattern.saleType === 'yard' ? 'Yard Pattern' : 'Panel Pattern'}`,
        `Repeat: ${pattern.repeatWidth}" x ${pattern.hasRepeatHeight ? pattern.repeatHeight + '"' : 'No Repeat'}`,
        `Panel Width: ${pattern.panelWidth}"`
    ];
    
    patternDetails.forEach(detail => {
        pdf.text(detail, startX, currentY);
        currentY += lineHeight;
    });
    currentY += sectionSpacing;
    
    // Wall Dimensions
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Wall Dimensions', startX, currentY);
    currentY += lineHeight + 0.1;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Width: ${formattedWidth}`, startX, currentY);
    currentY += lineHeight;
    pdf.text(`Height: ${formattedHeight}`, startX, currentY);
    currentY += sectionSpacing + lineHeight;
    
    // Order Quantities
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Order Quantities', startX, currentY);
    currentY += lineHeight + 0.1;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    if (calculations.saleType === 'yard') {
        pdf.text('As Calculated:', startX, currentY);
        currentY += lineHeight;
        pdf.text(`Total: ${calculations.totalYardage} yards`, startX + 0.2, currentY);
        currentY += lineHeight + 0.1;
        
        pdf.text('With 20% Overage:', startX, currentY);
        currentY += lineHeight;
        const overageYards = Math.ceil(calculations.totalYardage * 1.2);
        pdf.text(`Total: ${overageYards} yards`, startX + 0.2, currentY);
    } else {
        const actualPanelLength = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const yardagePerPanel = Math.round(actualPanelLength / 3);
        const totalYardage = calculations.panelsNeeded * yardagePerPanel;
        
        pdf.text('As Calculated:', startX, currentY);
        currentY += lineHeight;
        pdf.text(`[x${calculations.panelsNeeded}] ${actualPanelLength}' Panels`, startX + 0.2, currentY);
        currentY += lineHeight;
        pdf.text(`${yardagePerPanel} yards per panel`, startX + 0.2, currentY);
        currentY += lineHeight;
        pdf.text(`${totalYardage} total yards`, startX + 0.2, currentY);
        currentY += lineHeight + 0.1;
        
        const overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
        const overageTotalYardage = overagePanels * yardagePerPanel;
        
        pdf.text('With 20% Overage:', startX, currentY);
        currentY += lineHeight;
        pdf.text(`[x${overagePanels}] ${actualPanelLength}' Panels`, startX + 0.2, currentY);
        currentY += lineHeight;
        pdf.text(`${yardagePerPanel} yards per panel`, startX + 0.2, currentY);
        currentY += lineHeight;
        pdf.text(`${overageTotalYardage} total yards`, startX + 0.2, currentY);
    }
    
    currentY += sectionSpacing + lineHeight;
    
    // Business Info
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Contact Information', startX, currentY);
    currentY += lineHeight + 0.1;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const business = CONFIG.business;
    pdf.text(business.name, startX, currentY);
    currentY += lineHeight;
    if (business.website) {
        pdf.text(business.website, startX, currentY);
        currentY += lineHeight;
    }
    if (business.email) {
        pdf.text(business.email, startX, currentY);
        currentY += lineHeight;
    }
    if (business.location) {
        pdf.text(business.location, startX, currentY);
        currentY += lineHeight;
    }
    
    currentY += sectionSpacing;
    
    // Disclaimer
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'italic');
    const disclaimer = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = pdf.splitTextToSize(disclaimer, maxWidth);
    pdf.text(disclaimerLines, startX, currentY);
    currentY += disclaimerLines.length * (lineHeight * 0.8) + sectionSpacing;
    
    // Logo at bottom
    if (CONFIG.business.logoUrl) {
        try {
            await addLogoToPDF(pdf, startX, currentY, maxWidth);
        } catch (error) {
            console.warn('Could not add logo to PDF:', error);
        }
    }
}

// Add logo to PDF
async function addLogoToPDF(pdf, x, y, maxWidth) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            try {
                // Calculate logo dimensions
                const maxLogoWidth = Math.min(maxWidth, 2); // Max 2 inches wide
                const maxLogoHeight = 1; // Max 1 inch tall
                
                const aspectRatio = img.width / img.height;
                let logoWidth = maxLogoWidth;
                let logoHeight = logoWidth / aspectRatio;
                
                if (logoHeight > maxLogoHeight) {
                    logoHeight = maxLogoHeight;
                    logoWidth = logoHeight * aspectRatio;
                }
                
                // Add logo to PDF
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const logoDataUrl = canvas.toDataURL('image/png');
                
                pdf.addImage(logoDataUrl, 'PNG', x, y, logoWidth, logoHeight);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load logo'));
        };
        
        img.src = CONFIG.business.logoUrl;
    });
}

// Add download button to the UI
function addDownloadButton() {
    const previewInfo = document.querySelector('.preview-info');
    if (!previewInfo || document.getElementById('downloadPdfBtn')) {
        return; // Button already exists or preview section not found
    }
    
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadPdfBtn';
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download PDF';
    downloadBtn.style.marginTop = '20px';
    downloadBtn.onclick = generatePDF;
    
    previewInfo.appendChild(downloadBtn);
}

// Initialize PDF functionality
function initializePDFGeneration() {
    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded. Please include jsPDF in your HTML.');
        return;
    }
    
    console.log('✅ PDF generation module initialized');
}

// Export functions to global scope
window.pdfAPI = {
    generatePDF,
    addDownloadButton,
    initializePDFGeneration
};
