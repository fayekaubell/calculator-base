// Enhanced PDF Generation Module - Vertically centered layout with logo and download progress
// Requires jsPDF library to be loaded

// PDF generation function with improved layout and button feedback
async function generatePDF() {
    if (!currentPreview) {
        alert('Please generate a preview first before downloading PDF');
        return;
    }

    const downloadBtn = document.getElementById('downloadPdfBtn');
    
    try {
        console.log('🎨 Starting enhanced PDF generation...');
        
        // Show processing state immediately
        updateDownloadButtonState(downloadBtn, 'processing');
        
        // Force a small delay to ensure the processing state is visible
        await new Promise(resolve => setTimeout(resolve, 100));

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
        const textAreaWidth = 3.25; // Right side text area
        const canvasAreaWidth = pdfWidth - textAreaWidth - (canvasMargin * 3); // 20" wide
        const canvasAreaHeight = pdfHeight - (canvasMargin * 2); // 17.5" tall
        
        // Generate high-resolution canvas with processing feedback
        console.log('🖼️ Generating high-resolution canvas...');
        const canvasDataUrl = await generateHighResCanvas(canvasAreaWidth * dpi, canvasAreaHeight * dpi);
        
        if (canvasDataUrl) {
            console.log('📄 Adding canvas to PDF...');
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

        console.log('📝 Adding text content to PDF...');
        // Add enhanced text content to right side with vertical centering
        await addEnhancedTextContentToPDF(pdf, canvasAreaWidth + canvasMargin * 2, canvasMargin, textAreaWidth - canvasMargin, canvasAreaHeight);

        // Generate filename with preview number
        const { pattern } = currentPreview;
        const filename = `Faye-Bell-Wallpaper-Preview-${pattern.sku}-00000.pdf`;

        console.log('💾 Saving PDF...');
        // Save PDF
        pdf.save(filename);
        
        console.log('✅ Enhanced PDF generated successfully:', filename);

        // Show success state (permanently)
        updateDownloadButtonState(downloadBtn, 'success');

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
        
        // Show error state
        updateDownloadButtonState(downloadBtn, 'error');
    }
}

// Update download button state with different messages and styles
function updateDownloadButtonState(button, state) {
    if (!button) return;
    
    // Remove any existing state classes
    button.classList.remove('btn-processing', 'btn-success', 'btn-error');
    
    switch (state) {
        case 'processing':
            button.disabled = true;
            button.textContent = 'Processing download...';
            button.classList.add('btn-processing');
            break;
            
        case 'success':
            button.disabled = true;
            button.textContent = 'Successfully downloaded';
            button.classList.add('btn-success');
            
            // NO TIMEOUT - stays in success state permanently
            break;
            
        case 'error':
            button.disabled = false;
            button.textContent = 'Download failed - Try again';
            button.classList.add('btn-error');
            
            // Reset to normal state after 5 seconds for errors
            setTimeout(() => {
                updateDownloadButtonState(button, 'ready');
            }, 5000);
            break;
            
        case 'ready':
        default:
            button.disabled = false;
            button.textContent = 'Download PDF';
            break;
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

// Load logo image for PDF
async function loadLogoForPDF() {
    return new Promise((resolve) => {
        const logoUrl = CONFIG.business.logoUrl;
        
        if (!logoUrl || !logoUrl.trim()) {
            console.log('No logo URL configured, skipping logo');
            resolve(null);
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log('✅ Logo loaded successfully for PDF');
            resolve(img);
        };
        
        img.onerror = function() {
            console.warn('⚠️ Failed to load logo for PDF, continuing without logo');
            resolve(null);
        };
        
        img.src = logoUrl;
    });
}

// Calculate total content height for vertical centering
function calculateTotalContentHeight(pdf, maxWidth) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    
    const lineHeight = 0.15;
    const sectionSpacing = 0.25;
    let totalHeight = 0;
    
    // Title section (3 lines + spacing)
    totalHeight += (lineHeight * 3) + (0.05 * 2) + sectionSpacing;
    
    // Product links section
    const links = [
        { text: 'Product Tearsheet >', url: pattern.product_tearsheet_url },
        { text: 'Product Page >', url: pattern.product_page_url },
        { text: '360 View >', url: pattern.product_360_url }
    ];
    
    const hasAnyLinks = links.some(link => link.url && link.url.trim());
    
    if (hasAnyLinks) {
        // Header + spacing
        totalHeight += lineHeight + 0.05;
        // Links
        const activeLinks = links.filter(link => link.url && link.url.trim());
        totalHeight += lineHeight * activeLinks.length;
        totalHeight += sectionSpacing;
    }
    
    // Pattern Details section
    totalHeight += lineHeight + 0.05; // Header
    totalHeight += lineHeight * 5; // 5 detail lines
    totalHeight += sectionSpacing;
    
    // Order quantity as shown
    totalHeight += lineHeight + 0.05; // Header
    if (calculations.saleType === 'yard') {
        totalHeight += lineHeight; // 1 line
    } else {
        totalHeight += lineHeight * 3; // 3 lines
    }
    totalHeight += sectionSpacing;
    
    // Order quantity with overage
    totalHeight += lineHeight + 0.05; // Header
    if (calculations.saleType === 'yard') {
        totalHeight += lineHeight; // 1 line
    } else {
        totalHeight += lineHeight * 3; // 3 lines
    }
    totalHeight += sectionSpacing;
    
    // Preview Number
    totalHeight += lineHeight + 0.05; // Header
    totalHeight += lineHeight; // Number
    totalHeight += sectionSpacing;
    
    // Date Created
    totalHeight += lineHeight + 0.05; // Header
    totalHeight += lineHeight; // Date
    totalHeight += sectionSpacing;
    
    // Contact Information
    totalHeight += lineHeight + 0.05; // Header
    const business = CONFIG.business;
    let contactLines = 1; // Business name
    if (business.website) contactLines++;
    if (business.email) contactLines++;
    if (business.location) contactLines++;
    totalHeight += lineHeight * contactLines;
    totalHeight += sectionSpacing;
    
    // Disclaimer
    const disclaimer = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = pdf.splitTextToSize(disclaimer, maxWidth);
    totalHeight += lineHeight * disclaimerLines.length;
    
    // Logo space
    totalHeight += sectionSpacing; // Space before logo
    totalHeight += 0.75; // Max logo height
    
    return totalHeight;
}

// Enhanced text content layout with vertical centering and logo
async function addEnhancedTextContentToPDF(pdf, startX, startY, maxWidth, availableHeight) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    
    // Calculate total content height
    const totalContentHeight = calculateTotalContentHeight(pdf, maxWidth);
    
    // Calculate starting Y position for vertical centering
    const centeringOffset = (availableHeight - totalContentHeight) / 2;
    let currentY = startY + Math.max(0.5, centeringOffset); // Minimum 0.5" from top
    
    const lineHeight = 0.15;
    const sectionSpacing = 0.25;
    const centerX = startX + maxWidth / 2;
    
    console.log(`📄 PDF Layout: Total content height: ${totalContentHeight.toFixed(2)}", Available: ${availableHeight.toFixed(2)}", Centering offset: ${centeringOffset.toFixed(2)}"`);
    
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
    
    // Helper function to format inches as feet and inches
    const formatDimension = (inches) => {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return remainingInches > 0 ? `${feet}'${remainingInches}"` : `${feet}'0"`;
    };
    
    const patternDetails = [
        `Name: ${pattern.name}`,
        `SKU: ${pattern.sku || 'N/A'}`,
        `Type: ${pattern.saleType === 'yard' ? 'Yard Pattern' : 'Panel Pattern'}`,
        `Repeat: ${formatDimension(pattern.repeatWidth)}w ${pattern.hasRepeatHeight ? 'x ' + formatDimension(pattern.repeatHeight) + 'h' : '/ No vertical repeat'}`,
        `Panel Width: ${formatDimension(pattern.panelWidth)}`
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
    
    // Add logo below disclaimer
    try {
        const logoImg = await loadLogoForPDF();
        if (logoImg) {
            currentY += sectionSpacing; // Add space before logo
            
            // Logo sizing constraints
            const maxLogoWidth = 1.5; // inches
            const maxLogoHeight = 0.75; // inches
            
            // Calculate actual logo dimensions while maintaining aspect ratio
            const logoAspectRatio = logoImg.width / logoImg.height;
            let logoWidth = maxLogoWidth;
            let logoHeight = logoWidth / logoAspectRatio;
            
            // If height exceeds max, constrain by height instead
            if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = logoHeight * logoAspectRatio;
            }
            
            // Center the logo horizontally
            const logoX = centerX - (logoWidth / 2);
            
            // Add the logo
            pdf.addImage(
                logoImg,
                'PNG', // jsPDF will auto-detect format
                logoX,
                currentY,
                logoWidth,
                logoHeight,
                undefined,
                'FAST'
            );
            
            console.log(`✅ Logo added to PDF: ${logoWidth.toFixed(2)}" x ${logoHeight.toFixed(2)}" at position (${logoX.toFixed(2)}", ${currentY.toFixed(2)}")`);
        }
    } catch (error) {
        console.warn('⚠️ Could not add logo to PDF:', error);
        // Continue without logo - don't break PDF generation
    }
}

// Add download button to the UI with enhanced state management
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
    
    console.log('✅ Enhanced PDF generation module with download progress feedback initialized');
}

// Export functions to global scope
window.pdfAPI = {
    generatePDF,
    addDownloadButton,
    initializePDFGeneration,
    updateDownloadButtonState
};
