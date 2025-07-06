// Enhanced PDF Generation Module - Clean version without logo
// Requires jsPDF library to be loaded

// PDF generation function with improved layout
async function generatePDF() {
    if (!currentPreview) {
        alert('Please generate a preview first before downloading PDF');
        return;
    }

    try {
        console.log('🎨 Starting enhanced PDF generation...');
        
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

        // Create jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [pdfWidth, pdfHeight]
        });

        // Enhanced layout dimensions
        const canvasMargin = 0.25;
        const textAreaWidth = 3.5; // Reduced from 6 to 3.5 inches for text on right side
        const canvasAreaWidth = pdfWidth - textAreaWidth - (canvasMargin * 3); // Now 20" wide
        const canvasAreaHeight = pdfHeight - (canvasMargin * 2); // 17.5" tall
        
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

        // Add enhanced text content to right side
        await addEnhancedTextContentToPDF(pdf, canvasAreaWidth + canvasMargin * 2, canvasMargin, textAreaWidth - canvasMargin);

        // Generate filename with preview number
        const { pattern } = currentPreview;
        const filename = `Faye-Bell-Wallpaper-Preview-${pattern.sku}-00000.pdf`;

        // Save PDF
        pdf.save(filename);
        
        console.log('✅ Enhanced PDF generated successfully:', filename);

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

// Enhanced text content layout with improved structure
async function addEnhancedTextContentToPDF(pdf, startX, startY, maxWidth) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    let currentY = startY + 0.5;
    const lineHeight = 0.15;
    const sectionSpacing = 0.25;
    const centerX = startX + maxWidth / 2;
    
    // Enhanced title with line breaks and center alignment
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    
    // Three-line title format (centered using coordinates)
    pdf.text(pattern.name, centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    pdf.text(pattern.sku || 'N/A', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    pdf.text(`${formattedWidth}w x ${formattedHeight}h Wall`, centerX, currentY, { align: 'center' });
    currentY += lineHeight + sectionSpacing;
    
    // Product links
    const links = [
        { text: 'Product Tearsheet >', url: pattern.product_tearsheet_url },
        { text: 'Product Page >', url: pattern.product_page_url },
        { text: '360 View >', url: pattern.product_360_url }
    ];
    
    const hasAnyLinks = links.some(link => link.url && link.url.trim());
    
    if (hasAnyLinks) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        
        pdf.text('Product Links', centerX, currentY, { align: 'center' });
        currentY += lineHeight + 0.05;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        links.forEach(link => {
            if (link.url && link.url.trim()) {
                pdf.setTextColor(0, 100, 200);
                pdf.textWithLink(link.text, centerX, currentY, { url: link.url, align: 'center' });
                pdf.setTextColor(0, 0, 0);
                currentY += lineHeight;
            }
        });
        
        currentY += sectionSpacing;
    }
    
    // Pattern Details
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    
    pdf.text('Pattern Details', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
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
        pdf.text(detail, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    });
    
    currentY += sectionSpacing;
    
    // Order quantity as shown
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    
    pdf.text('Order quantity as shown', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    if (calculations.saleType === 'yard') {
        pdf.text(`Total: ${calculations.totalYardage} yards`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    } else {
        const actualPanelLength = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const yardagePerPanel = Math.round(actualPanelLength / 3);
        const totalYardage = calculations.panelsNeeded * yardagePerPanel;
        
        pdf.text(`[x${calculations.panelsNeeded}] ${actualPanelLength}' Panels`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`${yardagePerPanel} yards per panel`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`${totalYardage} total yards`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    currentY += sectionSpacing;
    
    // Order quantity with 20% overage added
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    
    pdf.text('Order quantity with 20% overage added', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    if (calculations.saleType === 'yard') {
        const overageYards = Math.ceil(calculations.totalYardage * 1.2);
        pdf.text(`Total: ${overageYards} yards`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    } else {
        const actualPanelLength = calculations.exceedsAvailableLength ? 
            calculations.actualPanelLength : calculations.panelLength;
        const yardagePerPanel = Math.round(actualPanelLength / 3);
        const overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
        const overageTotalYardage = overagePanels * yardagePerPanel;
        
        pdf.text(`[x${overagePanels}] ${actualPanelLength}' Panels`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`${yardagePerPanel} yards per panel`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
        pdf.text(`${overageTotalYardage} total yards`, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    currentY += sectionSpacing;
    
    // Preview Number
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    
    pdf.text('Preview Number', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('00000', centerX, currentY, { align: 'center' });
    
    currentY += lineHeight + sectionSpacing;
    
    // Date Created
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    
    pdf.text('Date Created', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    pdf.text(today, centerX, currentY, { align: 'center' });
    
    currentY += lineHeight + sectionSpacing;
    
    // Contact Information
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    
    pdf.text('Contact Information', centerX, currentY, { align: 'center' });
    currentY += lineHeight + 0.05;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    const business = CONFIG.business;
    pdf.text(business.name, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
    if (business.website) {
        pdf.text(business.website, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    if (business.email) {
        pdf.text(business.email, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    if (business.location) {
        pdf.text(business.location, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    }
    
    currentY += sectionSpacing;
    
    // Disclaimer
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'italic');
    
    const disclaimer = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = pdf.splitTextToSize(disclaimer, maxWidth);
    disclaimerLines.forEach(line => {
        pdf.text(line, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
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
    
    console.log('✅ Enhanced PDF generation module initialized');
}

// Export functions to global scope
window.pdfAPI = {
    generatePDF,
    addDownloadButton,
    initializePDFGeneration
};
