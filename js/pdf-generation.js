// Enhanced PDF Generation Module - Uses sequential preview numbers from Google Sheets
// Requires jsPDF library to be loaded
// UPDATED: Improved text formatting with centered alignment and consistent sizing
// UPDATED: Added product links after pattern name in PDF

// PDF generation function with sequential preview numbers
async function generatePDF() {
    if (!currentPreview) {
        alert('Please generate a preview first before downloading PDF');
        return;
    }

    const downloadBtn = document.getElementById('downloadPdfBtn');
    
    try {
        console.log('🎨 Starting enhanced PDF generation with sequential numbering...');
        
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

        // Enhanced layout dimensions - maintain 0.5" right margin
        const canvasMargin = 0.25;
        const textAreaWidth = 3.5; // Increased to maintain 0.5" margin on right (was 3.25)
        const canvasAreaWidth = pdfWidth - textAreaWidth - (canvasMargin * 2); // Adjusted
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
        await addEnhancedTextContentToPDF(pdf, canvasAreaWidth + canvasMargin, canvasMargin, textAreaWidth, canvasAreaHeight);

        // UPDATED: Generate filename with sequential preview number
        const { pattern } = currentPreview;
        const sequentialNumber = getSequentialPreviewNumber();
        const filename = `Faye-Bell-Wallpaper-Preview-${pattern.sku}-${sequentialNumber}.pdf`;

        // LOGGING: Dispatch logging event for PDF download
        if (typeof window.dispatchPDFDownloaded === 'function') {
            setTimeout(() => {
                window.dispatchPDFDownloaded({
                    filename: filename,
                    patternName: pattern.name,
                    patternSku: pattern.sku,
                    wallDimensions: `${currentPreview.formattedWidth} x ${currentPreview.formattedHeight}`,
                    sequentialNumber: sequentialNumber,
                    generated: true,
                    timestamp: new Date().toISOString()
                });
            }, 100);
        }

        console.log('💾 Saving PDF with sequential numbering:', filename);
        // Save PDF
        pdf.save(filename);
        
        console.log('✅ Enhanced PDF generated successfully with sequential number:', filename);

        // Show success state with reset functionality
        updateDownloadButtonState(downloadBtn, 'success');

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
        
        // Show error state
        updateDownloadButtonState(downloadBtn, 'error');
    }
}
