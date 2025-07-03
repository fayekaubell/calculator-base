// Quote Form Handling Module

// Show quote form
function showQuoteForm() {
    if (!CONFIG.quotes.enabled) {
        alert('Quote requests are currently disabled');
        return;
    }
    
    document.getElementById('quoteForm').style.display = 'block';
    document.getElementById('quoteForm').scrollIntoView({ behavior: 'smooth' });
}

// Submit quote form
async function submitQuote() {
    if (!CONFIG.quotes.enabled) {
        alert('Quote requests are currently disabled');
        return;
    }
    
    // Clear any existing error messages
    document.getElementById('nameError').style.display = 'none';
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('previewError').style.display = 'none';
    document.getElementById('captchaError').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    const name = document.getElementById('clientName').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const business = document.getElementById('businessName').value.trim();
    const notes = document.getElementById('additionalNotes').value.trim();
    const newsletter = document.getElementById('newsletterSubscribe').checked;
    
    let hasErrors = false;
    
    // Validate name
    if (CONFIG.quotes.fields.name.required && !name) {
        document.getElementById('nameError').style.display = 'block';
        hasErrors = true;
    }
    
    // Validate email
    if (CONFIG.quotes.fields.email.required && !email) {
        document.getElementById('emailError').style.display = 'block';
        document.getElementById('emailError').innerHTML = '<em>Please fill in your email address</em>';
        hasErrors = true;
    } else if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('emailError').style.display = 'block';
            document.getElementById('emailError').innerHTML = '<em>Please enter a valid email address</em>';
            hasErrors = true;
        }
    }
    
    // Validate captcha if enabled
    if (CONFIG.quotes.requireCaptcha && CONFIG.google.recaptchaSiteKey) {
        const captchaResponse = grecaptcha.getResponse();
        if (!captchaResponse) {
            document.getElementById('captchaError').style.display = 'block';
            hasErrors = true;
        }
    }
    
    // Validate preview exists
    if (!currentPreview) {
        document.getElementById('previewError').style.display = 'block';
        hasErrors = true;
    }
    
    // If there are errors, don't proceed
    if (hasErrors) {
        return;
    }
    
    // Show submitting message
    document.getElementById('submittingMessage').style.display = 'block';
    
    // Prepare data for logging
    const { pattern, wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches, calculations } = currentPreview;
    let yardagePerPanel, totalYardage;
    
    if (calculations.saleType === 'yard') {
        totalYardage = calculations.totalYardage;
    } else {
        yardagePerPanel = Math.round(calculations.panelLength / 3);
        totalYardage = calculations.panelsNeeded * yardagePerPanel;
    }
    
    const formattedWidth = wallWidthInches > 0 ? 
        `${wallWidthFeet}'${wallWidthInches}"` : `${wallWidthFeet}'`;
    const formattedHeight = wallHeightInches > 0 ? 
        `${wallHeightFeet}'${wallHeightInches}"` : `${wallHeightFeet}'`;
    
    // Generate quote filename using the stored preview number
    const previewNumber = currentPreview.previewNumber || '20001';
    const patternName = pattern.name.replace(/[^a-zA-Z0-9]/g, '-');
    const pdfFilename = `${CONFIG.business.name.replace(/\s+/g, '')}-${patternName}-${previewNumber}-QUOTE-REQUEST.pdf`;
    
    // Log the quote submission
    if (CONFIG.google.sheetsUrl) {
        logQuoteSubmission(
            formattedWidth,
            formattedHeight,
            pattern.name,
            totalYardage,
            pdfFilename,
            previewNumber,
            name,
            email,
            business,
            notes,
            newsletter
        );
    }
    
    // Generate PDF for quote submission if enabled
    if (CONFIG.pdf.features.autoSendToGoogleDrive && CONFIG.google.sheetsUrl) {
        console.log('📄 Generating PDF for quote submission...');
        try {
            let canvasImageData;
            try {
                canvasImageData = await generateHighQualityCanvasImage();
            } catch (canvasError) {
                console.warn('⚠️ Canvas generation failed for quote PDF:', canvasError);
                canvasImageData = null;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [310, 240] // Smaller size for quote PDFs
            });
            
            const pageWidth = 310;
            const pageHeight = 240;
            const margin = 6.35;
            const contentWidth = pageWidth - (margin * 2);
            const currentDate = new Date().toLocaleDateString();
            
            let overagePanels, overageTotalYardage;
            if (calculations.saleType === 'yard') {
                overageTotalYardage = Math.ceil(totalYardage * 1.2);
            } else {
                overagePanels = Math.ceil(calculations.panelsNeeded * 1.2);
                overageTotalYardage = overagePanels * yardagePerPanel;
            }
            
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
            
            // Send quote PDF to Google Drive
            console.log('☁️ Sending quote PDF to Google Drive...');
            const pdfDataURL = doc.output('dataurlstring');
            await sendPDFToGoogleDrive(pdfDataURL, pdfFilename);
            
        } catch (error) {
            console.warn('⚠️ Failed to generate/send quote PDF to Google Drive:', error);
        }
    }
    
    // Log quote data for debugging
    console.log('📋 Quote request data:', {
        name,
        email,
        business,
        notes,
        pattern: pattern.name,
        sku: pattern.sku,
        wallDimensions: `${formattedWidth} × ${formattedHeight}`,
        panelsNeeded: calculations.panelsNeeded,
        panelLength: calculations.panelLength,
        totalYardage: totalYardage,
        previewNumber: previewNumber,
        pdfFilename: pdfFilename,
        timestamp: new Date().toISOString()
    });
    
    // Hide submitting message
    document.getElementById('submittingMessage').style.display = 'none';
    
    // Show success message and replace submit button with reset button
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('submitButton').style.display = 'none';
    document.getElementById('resetButton').style.display = 'inline-block';
}

// Reset quote form
function resetQuoteForm() {
    // Clear all form fields
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('businessName').value = '';
    document.getElementById('additionalNotes').value = '';
    document.getElementById('newsletterSubscribe').checked = false;
    
    // Reset captcha if enabled
    if (CONFIG.quotes.requireCaptcha && CONFIG.google.recaptchaSiteKey && typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }
    
    // Hide all messages and reset button, show submit button
    document.getElementById('nameError').style.display = 'none';
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('previewError').style.display = 'none';
    document.getElementById('captchaError').style.display = 'none';
    document.getElementById('submittingMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('resetButton').style.display = 'none';
    document.getElementById('submitButton').style.display = 'inline-block';
}

// Logging function for quote submissions
function logQuoteSubmission(wallWidth, wallHeight, pattern, totalYardage, pdfFilename, previewNumber, name, emailAddress, businessName, additionalNotes, newsletter) {
    if (!CONFIG.google.sheetsUrl) {
        console.log('📊 Quote submission logging disabled');
        return;
    }
    
    const formData = new FormData();
    formData.append('logType', 'submission');
    formData.append('wallWidth', wallWidth);
    formData.append('wallHeight', wallHeight);
    formData.append('pattern', pattern);
    formData.append('totalYardage', totalYardage);
    formData.append('pdfFilename', pdfFilename || '');
    formData.append('previewNumber', previewNumber || '');
    formData.append('userAgent', navigator.userAgent);
    formData.append('name', name);
    formData.append('emailAddress', emailAddress);
    formData.append('businessName', businessName || '');
    formData.append('additionalNotes', additionalNotes || '');
    formData.append('newsletter', newsletter || 'false');
    
    if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.google.sheetsUrl, formData);
        console.log('📊 Quote submission logged via sendBeacon');
    } else {
        console.log('sendBeacon not supported, quote submission logging skipped');
    }
}
