// PDF Generation Module

// Download PDF function
async function downloadPDF() {
    console.log('📑 PDF Download requested...');
    
    if (!currentPreview) {
        alert('Please generate a preview first');
        return;
    }
    
    if (!CONFIG.pdf.features.downloadEnabled) {
        alert('PDF download is currently disabled');
        return;
    }
    
    try {
        console.log('🚀 Starting PDF generation...');
        
        const downloadButton = event.target;
        const originalButtonText = downloadButton.textContent;
        downloadButton.textContent = 'Generating PDF...';
        downloadButton.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const { pattern, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches, calculations } = currentPreview;
        
        if (!pattern || !calculations) {
            throw new Error('Missing preview data');
        }
        
        // Generate filename using the stored preview number
        const previewNumber = currentPreview.previewNumber || '20001';
        const patternName = pattern.name.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `${CONFIG.business.name.replace(/\s+/g, '')}-${patternName}-${previewNumber}.pdf`;
        
        // Log PDF download attempt
        let yardagePerPanel, totalYardage, overagePanels, overageTotalYardage;
        
        if (calculations.saleType === 'yard') {
            totalYardage = calculations.totalYardage;
            overageTotalYardage = Math.ceil(totalYardage * 1.2);
        } else {
            yardagePerPanel = Math.round(calculations.panelLength / 3);
            totalYardage = calculations.panelsNeeded * yardagePerPanel;
            overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
            overageTotalYardage = overagePanels * yardagePerPanel;
        }
        
        const formattedWidth = wallWidthInches > 0 ? 
            `${wallWidthFeet}'${wallWidthInches}"` : `${wallWidthFeet}'`;
        const formattedHeight = wallHeightInches > 0 ? 
            `${wallHeightFeet}'${wallHeightInches}"` : `${wallHeightFeet}'`;
        
        // Log PDF download if enabled
        if (CONFIG.google.sheetsUrl) {
            logPDFDownload(
                formattedWidth,
                formattedHeight,
                pattern.name,
                totalYardage,
                filename,
                previewNumber
            );
        }
        
        let canvasImageData;
        try {
            console.log('🖼️ Generating canvas image...');
            canvasImageData = await generateHighQualityCanvasImage();
            console.log('✅ Canvas image generated successfully');
        } catch (canvasError) {
            console.warn('⚠️ Canvas generation failed, continuing without image:', canvasError);
            canvasImageData = null;
        }
        
        console.log('📄 Creating PDF document...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [CONFIG.pdf.pageSize.width, CONFIG.pdf.pageSize.height]
        });
        
        const pageWidth = CONFIG.pdf.pageSize.width;
        const pageHeight = CONFIG.pdf.pageSize.height;
        const margin = 6.35;
        const contentWidth = pageWidth - (margin * 2);
        const currentDate = new Date().toLocaleDateString();
        
        console.log('📋 Creating PDF layout...');
        await createPDFLayout(doc, {
            pageWidth,
            pageHeight,
            margin,
            contentWidth,
            pattern,
            formattedWidth,
            formattedHeight,
            calculations,
            yardagePerPanel,
            totalYardage,
            overagePanels,
            overageTotalYardage,
            previewNumber,
            currentDate,
            canvasImageData
        });
        
        console.log('💾 Saving PDF:', filename);
        doc.save(filename);
        
        // Send PDF to Google Drive if enabled
        if (CONFIG.pdf.features.autoSendToGoogleDrive && CONFIG.google.sheetsUrl) {
            console.log('☁️ Sending PDF to Google Drive...');
            try {
                const pdfDataURL = doc.output('dataurlstring');
                await sendPDFToGoogleDrive(pdfDataURL, filename);
            } catch (driveError) {
                console.warn('⚠️ Failed to send PDF to Google Drive:', driveError);
            }
        }
        
        console.log('✅ PDF generated and downloaded successfully!');
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF. Please try generating a new preview first, then download again.');
    } finally {
        setTimeout(() => {
            const downloadButton = document.querySelector('.btn-secondary');
            if (downloadButton) {
                downloadButton.textContent = 'Download PDF';
                downloadButton.disabled = false;
            }
        }, 500);
    }
}

// Create PDF layout
async function createPDFLayout(doc, data) {
    const {
        pageWidth, pageHeight, margin, contentWidth, pattern,
        formattedWidth, formattedHeight, calculations, yardagePerPanel, totalYardage,
        overagePanels, overageTotalYardage, previewNumber, currentDate, canvasImageData
    } = data;
    
    // Standardized spacing using 4mm baseline grid
    const baseSpacing = 4;
    const smallSpacing = baseSpacing;
    const mediumSpacing = baseSpacing * 2;
    const largeSpacing = baseSpacing * 3;
    
    const rightBorder = 6;
    const availableWidth = pageWidth - (margin * 2) - rightBorder;
    const absoluteSidebarWidth = 109.25;
    const previewWidth = availableWidth - absoluteSidebarWidth - smallSpacing;
    
    // Calculate sidebar positioning
    const canvasEndX = margin + previewWidth;
    const sidebarAreaStart = canvasEndX + smallSpacing;
    const sidebarAreaEnd = pageWidth - margin - rightBorder - 20;
    const sidebarAreaWidth = sidebarAreaEnd - sidebarAreaStart;
    const sidebarX = sidebarAreaStart + (sidebarAreaWidth - absoluteSidebarWidth) / 2 - 30 + 15.24;
    const previewX = margin;
    const previewY = margin;
    const previewHeight = pageHeight - (margin * 2);
    
    // Calculate content height for vertical centering
    let estimatedContentHeight = 0;
    
    // Logo height
    let logoHeight = 12;
    estimatedContentHeight += logoHeight + mediumSpacing;
    
    // Title height
    const titleText = `${pattern.name}: ${pattern.sku || 'N/A'}: ${formattedWidth}w x ${formattedHeight}h Wall`;
    const tempTitleLines = doc.splitTextToSize(titleText, absoluteSidebarWidth - smallSpacing);
    estimatedContentHeight += (tempTitleLines.length * smallSpacing) + mediumSpacing;
    
    // Product description if present
    if (pattern.productDescription && pattern.productDescription.trim()) {
        const tempProductDescLines = doc.splitTextToSize(pattern.productDescription, absoluteSidebarWidth - smallSpacing);
        estimatedContentHeight += (tempProductDescLines.length * smallSpacing) + mediumSpacing;
    }
    
    // Disclaimer if present
    const hasLimitations = calculations.exceedsLimit || calculations.exceedsAvailableLength;
    if (hasLimitations) {
        let disclaimerText = '';
        if (calculations.exceedsAvailableLength) {
            disclaimerText = CONFIG.ui.text.disclaimers.noRepeatHeight;
        } else if (calculations.exceedsLimit) {
            disclaimerText = CONFIG.ui.text.disclaimers.panelLimit;
        }
        const tempDisclaimerLines = doc.splitTextToSize(disclaimerText, absoluteSidebarWidth - smallSpacing);
        estimatedContentHeight += (tempDisclaimerLines.length * smallSpacing) + mediumSpacing;
    }
    
    // Order sections
    if (calculations.saleType === 'yard') {
        estimatedContentHeight += smallSpacing + smallSpacing + mediumSpacing;
        estimatedContentHeight += smallSpacing + smallSpacing + mediumSpacing;
    } else {
        estimatedContentHeight += smallSpacing + (3 * smallSpacing) + mediumSpacing;
        estimatedContentHeight += smallSpacing + (3 * smallSpacing) + mediumSpacing;
    }
    
    // Preview number and date sections
    estimatedContentHeight += smallSpacing + smallSpacing + mediumSpacing;
    estimatedContentHeight += smallSpacing + smallSpacing + mediumSpacing;
    
    // Bottom disclaimer
    const bottomDisclaimerText = CONFIG.ui.text.disclaimers.results;
    const tempBottomDisclaimerLines = doc.splitTextToSize(bottomDisclaimerText, absoluteSidebarWidth - smallSpacing);
    estimatedContentHeight += (tempBottomDisclaimerLines.length * smallSpacing) + mediumSpacing;
    
    // Footer
    estimatedContentHeight += 10;
    estimatedContentHeight += 20; // Buffer
    
    // Calculate starting Y for vertical centering
    const availableHeight = pageHeight - (margin * 2);
    const perfectCenteringOffset = (availableHeight - estimatedContentHeight) / 2;
    const contentStartY = margin + perfectCenteringOffset + 25 + 6.35;
    
    // Start sidebar content
    let sidebarY = contentStartY;
    
    // Logo
    if (CONFIG.business.logoUrl) {
        try {
            const logoImg = await loadImage(CONFIG.business.logoUrl);
            const logoWidth = 20;
            logoHeight = logoWidth * (logoImg.height / logoImg.width);
            const logoX = sidebarX + (absoluteSidebarWidth / 2) - (logoWidth / 2);
            doc.addImage(logoImg, 'PNG', logoX, sidebarY, logoWidth, logoHeight);
        } catch (error) {
            console.warn('Could not load logo:', error);
        }
    }
    
    sidebarY += logoHeight + mediumSpacing;
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    
    const titleLines = doc.splitTextToSize(titleText, absoluteSidebarWidth - smallSpacing);
    
    titleLines.forEach((line, index) => {
        doc.text(line, sidebarX + (absoluteSidebarWidth / 2), sidebarY + (index * smallSpacing), { align: 'center' });
    });
    
    sidebarY += (titleLines.length * smallSpacing) + mediumSpacing;
    
    // Product description
    if (pattern.productDescription && pattern.productDescription.trim()) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const productDescLines = doc.splitTextToSize(pattern.productDescription, absoluteSidebarWidth - smallSpacing);
        
        productDescLines.forEach((line, index) => {
            doc.text(line, sidebarX + (absoluteSidebarWidth / 2), sidebarY + (index * smallSpacing), { align: 'center' });
        });
        
        sidebarY += (productDescLines.length * smallSpacing) + mediumSpacing;
    }
    
    // Disclaimer if needed
    if (hasLimitations) {
        let disclaimerText = '';
        
        if (calculations.exceedsAvailableLength) {
            disclaimerText = CONFIG.ui.text.disclaimers.noRepeatHeight;
        } else if (calculations.exceedsLimit) {
            disclaimerText = CONFIG.ui.text.disclaimers.panelLimit;
        }
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(220, 53, 69);
        
        const disclaimerLines = doc.splitTextToSize(disclaimerText, absoluteSidebarWidth - smallSpacing);
        
        disclaimerLines.forEach((line, index) => {
            doc.text(line, sidebarX + (absoluteSidebarWidth / 2), sidebarY + (index * smallSpacing), { align: 'center' });
        });
        
        sidebarY += (disclaimerLines.length * smallSpacing) + mediumSpacing;
        doc.setTextColor(0, 0, 0);
    }
    
    // Order quantity sections
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    doc.text('Order quantity as shown:', sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += smallSpacing;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (calculations.saleType === 'yard') {
        doc.text(`Total yardage: ${calculations.totalYardage} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += mediumSpacing;
    } else {
        doc.text(`[x${calculations.panelsNeeded}] ${calculations.panelLength}' Panels`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += smallSpacing;
        doc.text(`Yardage per a panel: ${yardagePerPanel} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += smallSpacing;
        doc.text(`Total yardage: ${totalYardage} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += mediumSpacing;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Order quantity with 20% overage added:', sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += smallSpacing;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    if (calculations.saleType === 'yard') {
        const overageTotalYardage = Math.ceil(calculations.totalYardage * 1.2);
        doc.text(`Total yardage: ${overageTotalYardage} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += mediumSpacing;
    } else {
        doc.text(`[x${overagePanels}] ${calculations.panelLength}' Panels`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += smallSpacing;
        doc.text(`Yardage per a panel: ${yardagePerPanel} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += smallSpacing;
        doc.text(`Total yardage: ${overageTotalYardage} yds`, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
        sidebarY += mediumSpacing;
    }
    
    // Preview number and date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Preview Number:', sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += smallSpacing;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(previewNumber.toString(), sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += mediumSpacing;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Date:', sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += smallSpacing;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(currentDate, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    sidebarY += mediumSpacing;
    
    // Bottom disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const disclaimerLines = doc.splitTextToSize(bottomDisclaimerText, absoluteSidebarWidth - smallSpacing);
    
    disclaimerLines.forEach((line, index) => {
        doc.text(line, sidebarX + (absoluteSidebarWidth / 2), sidebarY + (index * smallSpacing), { align: 'center' });
    });
    
    sidebarY += (disclaimerLines.length * smallSpacing) + mediumSpacing;
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const footerText = `${CONFIG.business.website} • ${CONFIG.business.email} • ${CONFIG.business.location}`;
    doc.text(footerText, sidebarX + (absoluteSidebarWidth / 2), sidebarY, { align: 'center' });
    
    // Large canvas preview
    if (canvasImageData) {
        const originalAspectRatio = 1400 / 1600;
        
        let imgWidth = previewWidth;
        let imgHeight = previewHeight;
        
        // Maintain aspect ratio
        if (imgWidth / originalAspectRatio > imgHeight) {
            imgWidth = imgHeight * originalAspectRatio;
        } else {
            imgHeight = imgWidth / originalAspectRatio;
        }
        
        // Center within the preview area
        const imgX = previewX + (previewWidth - imgWidth) / 2;
        const imgY = previewY + (previewHeight - imgHeight) / 2;
        
        doc.addImage(canvasImageData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    }
}

// Generate high quality canvas image for PDF
async function generateHighQualityCanvasImage() {
    return new Promise(async (resolve) => {
        try {
            console.log('Generating high-quality canvas image...');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const scale = 3;
            canvas.width = 1400 * scale;
            canvas.height = 1600 * scale;
            
            ctx.scale(scale, scale);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1400, 1600);
            
            if (currentPreview.pattern.imageUrl && (!patternImage || !imageLoaded)) {
                console.log('Reloading pattern image for PDF...');
                try {
                    await preloadPatternImage(currentPreview.pattern);
                } catch (imageError) {
                    console.warn('Failed to reload pattern image:', imageError);
                }
            }
            
            renderHighQualityPreview(ctx, 1400, 1600);
            
            try {
                const imageData = canvas.toDataURL('image/jpeg', 0.95);
                console.log('Successfully generated canvas image data');
                resolve(imageData);
            } catch (corsError) {
                console.warn('CORS error when exporting canvas, using fallback');
                const fallbackCanvas = createFallbackCanvas();
                resolve(fallbackCanvas.toDataURL('image/jpeg', 0.95));
            }
            
        } catch (error) {
            console.error('Error generating canvas:', error);
            console.log('Using fallback canvas due to error');
            const fallbackCanvas = createFallbackCanvas();
            resolve(fallbackCanvas.toDataURL('image/jpeg', 0.95));
        }
    });
}

// Create fallback canvas when pattern image fails
function createFallbackCanvas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1400;
    canvas.height = 800;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    const { pattern, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches, calculations } = currentPreview;
    
    let y = 80;
    ctx.fillText(pattern.name, canvas.width / 2, y);
    
    y += 80;
    ctx.font = '36px Arial';
    if (pattern.sku) {
        ctx.fillText(`SKU: ${pattern.sku}`, canvas.width / 2, y);
        y += 60;
    }
    
    const widthDisplay = wallWidthInches > 0 ? `${wallWidthFeet}' ${wallWidthInches}"` : `${wallWidthFeet}' 0"`;
    const heightDisplay = wallHeightInches > 0 ? `${wallHeightFeet}' ${wallHeightInches}"` : `${wallHeightFeet}' 0"`;
    
    ctx.fillText(`Wall: ${widthDisplay} × ${heightDisplay}`, canvas.width / 2, y);
    
    y += 60;
    ctx.fillText(`${calculations.panelsNeeded} panels × ${calculations.panelLength}' each`, canvas.width / 2, y);
    
    return canvas;
}

// Helper function to load images
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Logging functions (optional)
function logPDFDownload(wallWidth, wallHeight, pattern, totalYardage, pdfFilename, previewNumber) {
    if (!CONFIG.google.sheetsUrl) {
        console.log('📊 PDF logging disabled');
        return;
    }
    
    const formData = new FormData();
    formData.append('logType', 'download');
    formData.append('wallWidth', wallWidth);
    formData.append('wallHeight', wallHeight);
    formData.append('pattern', pattern);
    formData.append('totalYardage', totalYardage);
    formData.append('pdfFilename', pdfFilename);
    formData.append('previewNumber', previewNumber);
    formData.append('userAgent', navigator.userAgent);
    
    if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.google.sheetsUrl, formData);
        console.log('📊 PDF download logged via sendBeacon');
    } else {
        console.log('sendBeacon not supported, PDF logging skipped');
    }
}

function sendPDFToGoogleDrive(pdfDataURL, filename) {
    if (!CONFIG.google.sheetsUrl) {
        console.log('☁️ Google Drive upload disabled');
        return Promise.resolve();
    }
    
    const formData = new FormData();
    formData.append('logType', 'storePDF');
    formData.append('pdfData', pdfDataURL);
    formData.append('filename', filename);
    
    return fetch(CONFIG.google.sheetsUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(result => {
        console.log('☁️ PDF sent to Google Drive:', result);
        return result;
    })
    .catch(error => {
        console.error('❌ Error sending PDF to Google Drive:', error);
        throw error;
    });
}
