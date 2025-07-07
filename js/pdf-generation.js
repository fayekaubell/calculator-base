// Enhanced text content layout with vertical centering
async function addEnhancedTextContentToPDF(pdf, startX, startY, maxWidth) {
    const { pattern, calculations, formattedWidth, formattedHeight } = currentPreview;
    const lineHeight = 0.15;
    const sectionSpacing = 0.25;
    const centerX = startX + maxWidth / 2;
    const availableHeight = 17.5; // Total available height in inches
    
    // First pass: Calculate total content height
    let totalContentHeight = 0;
    
    // Enhanced title (3 lines)
    totalContentHeight += (lineHeight * 3) + (0.05 * 2) + sectionSpacing;
    
    // Product links section
    const links = [
        { text: 'Product Tearsheet >', url: pattern.product_tearsheet_url },
        { text: 'Product Page >', url: pattern.product_page_url },
        { text: '360 View >', url: pattern.product_360_url }
    ];
    
    const hasAnyLinks = links.some(link => link.url && link.url.trim());
    if (hasAnyLinks) {
        // Section header + spacing
        totalContentHeight += lineHeight + 0.05;
        // Count actual links
        const linkCount = links.filter(link => link.url && link.url.trim()).length;
        totalContentHeight += (lineHeight * linkCount) + sectionSpacing;
    }
    
    // Pattern Details section (header + 5 detail lines + spacing)
    totalContentHeight += lineHeight + 0.05 + (lineHeight * 5) + sectionSpacing;
    
    // Order quantity as shown section
    totalContentHeight += lineHeight + 0.05; // header
    if (calculations.saleType === 'yard') {
        totalContentHeight += lineHeight; // 1 line for yards
    } else {
        totalContentHeight += lineHeight * 3; // 3 lines for panels
    }
    totalContentHeight += sectionSpacing;
    
    // Order quantity with overage section
    totalContentHeight += lineHeight + 0.05; // header
    if (calculations.saleType === 'yard') {
        totalContentHeight += lineHeight; // 1 line for yards
    } else {
        totalContentHeight += lineHeight * 3; // 3 lines for panels
    }
    totalContentHeight += sectionSpacing;
    
    // Preview Number section
    totalContentHeight += lineHeight + 0.05 + lineHeight + sectionSpacing;
    
    // Date Created section
    totalContentHeight += lineHeight + 0.05 + lineHeight + sectionSpacing;
    
    // Contact Information section
    const business = CONFIG.business;
    let contactLines = 1; // business name
    if (business.website) contactLines++;
    if (business.email) contactLines++;
    if (business.location) contactLines++;
    totalContentHeight += lineHeight + 0.05 + (lineHeight * contactLines) + sectionSpacing;
    
    // Disclaimer section
    const disclaimer = CONFIG.ui.text.disclaimers.results;
    const disclaimerLines = pdf.splitTextToSize(disclaimer, maxWidth);
    totalContentHeight += lineHeight * disclaimerLines.length;
    
    // Logo section (if available)
    const logoImg = await loadLogoForPDF();
    if (logoImg) {
        totalContentHeight += sectionSpacing + 0.75; // spacing + max logo height
    }
    
    // Calculate starting Y position for vertical centering
    const startingY = startY + (availableHeight - totalContentHeight) / 2;
    
    // Ensure content doesn't start above the top margin
    let currentY = Math.max(startingY, startY + 0.5);
    
    // If content is too tall, start from top
    if (totalContentHeight > availableHeight) {
        currentY = startY + 0.5;
        console.warn('PDF content height exceeds available space, starting from top');
    }
    
    // Second pass: Render content at calculated positions
    
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
    
    disclaimerLines.forEach(line => {
        pdf.text(line, centerX, currentY, { align: 'center' });
        currentY += lineHeight;
    });
    
    // Add logo below disclaimer
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
        
        console.log(`✅ Logo added to PDF: ${logoWidth}" x ${logoHeight}" at position (${logoX}", ${currentY}")`);
    }
}
