// Quote Form Module - Handle quote form display and interactions
// Creates side-by-side buttons and expandable quote form

// Initialize quote form functionality
function initializeQuoteForm() {
    console.log('📋 Initializing quote form functionality...');
    
    // Set up event listeners for form interactions
    setupQuoteFormEventListeners();
    
    console.log('✅ Quote form functionality initialized');
}

// Set up event listeners for quote form
function setupQuoteFormEventListeners() {
    // Listen for when buttons are added to set up click handlers
    document.addEventListener('buttonsAdded', function() {
        const submitQuoteBtn = document.getElementById('submitQuoteForPreviewBtn');
        if (submitQuoteBtn) {
            submitQuoteBtn.addEventListener('click', toggleQuoteForm);
        }
    });
    
    // Listen for quote form submit button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'submitQuoteBtn') {
            handleQuoteSubmission();
        }
    });
    
    // Auto-resize trigger when form expands/collapses
    document.addEventListener('quoteFormToggled', function() {
        setTimeout(() => {
            if (window.autoResize) window.autoResize.updateHeight();
        }, 500); // Wait for animation to complete
    });
}

// Add both Download PDF and Submit Quote buttons side by side
function addDownloadAndQuoteButtons() {
    const buttonContainer = document.getElementById('buttonContainer');
    if (!buttonContainer) {
        console.error('Button container not found');
        return;
    }
    
    // Check if buttons already exist
    if (buttonContainer.querySelector('#downloadPdfBtn') || buttonContainer.querySelector('#submitQuoteForPreviewBtn')) {
        console.log('Buttons already exist, skipping creation');
        return;
    }
    
    // Clear any existing content
    buttonContainer.innerHTML = '';
    
    // Create Download PDF button
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadPdfBtn';
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download PDF';
    downloadBtn.onclick = generatePDF;
    
    // Create Submit Quote button
    const quoteBtn = document.createElement('button');
    quoteBtn.id = 'submitQuoteForPreviewBtn';
    quoteBtn.className = 'btn btn-primary';
    quoteBtn.textContent = 'Submit for Quote';
    quoteBtn.onclick = toggleQuoteForm;
    
    // Add buttons to container
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(quoteBtn);
    
    // Show the button container
    buttonContainer.style.display = 'flex';
    
    // Dispatch event to notify that buttons have been added
    document.dispatchEvent(new CustomEvent('buttonsAdded'));
    
    console.log('✅ Download PDF and Submit Quote buttons added');
}

// Toggle quote form visibility with smooth animation
function toggleQuoteForm() {
    const quoteFormContainer = document.getElementById('quoteFormContainer');
    const submitQuoteBtn = document.getElementById('submitQuoteForPreviewBtn');
    
    if (!quoteFormContainer || !submitQuoteBtn) {
        console.error('Quote form elements not found');
        return;
    }
    
    const isCurrentlyVisible = quoteFormContainer.classList.contains('show');
    
    if (isCurrentlyVisible) {
        // Hide the form
        quoteFormContainer.classList.remove('show');
        submitQuoteBtn.textContent = 'Submit for Quote';
        console.log('📋 Quote form hidden');
    } else {
        // Show the form
        quoteFormContainer.style.display = 'block';
        
        // Small delay to ensure display change takes effect before animation
        setTimeout(() => {
            quoteFormContainer.classList.add('show');
            submitQuoteBtn.textContent = 'Hide Quote Form';
            
            // Scroll the form into view smoothly
            setTimeout(() => {
                quoteFormContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 200);
            
            console.log('📋 Quote form shown');
        }, 50);
    }
    
    // Dispatch event for auto-resize system
    document.dispatchEvent(new CustomEvent('quoteFormToggled'));
}

// Handle quote form submission (placeholder for now)
function handleQuoteSubmission() {
    const form = document.querySelector('.quote-form');
    if (!form) {
        console.error('Quote form not found');
        return;
    }
    
    // Get form data
    const formData = {
        fullName: document.getElementById('fullName')?.value || '',
        emailAddress: document.getElementById('emailAddress')?.value || '',
        businessName: document.getElementById('businessName')?.value || '',
        additionalNotes: document.getElementById('additionalNotes')?.value || '',
        newsletterSignup: document.getElementById('newsletterSignup')?.checked || false,
        
        // Include preview data if available
        previewData: currentPreview ? {
            patternName: currentPreview.pattern.name,
            patternSku: currentPreview.pattern.sku,
            wallDimensions: `${currentPreview.formattedWidth}w x ${currentPreview.formattedHeight}h`,
            calculations: currentPreview.calculations
        } : null
    };
    
    // Basic validation
    if (!formData.fullName.trim()) {
        alert('Please enter your full name');
        document.getElementById('fullName')?.focus();
        return;
    }
    
    if (!formData.emailAddress.trim()) {
        alert('Please enter your email address');
        document.getElementById('emailAddress')?.focus();
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
        alert('Please enter a valid email address');
        document.getElementById('emailAddress')?.focus();
        return;
    }
    
    console.log('📋 Quote form submitted with data:', formData);
    
    // Placeholder for actual submission logic
    alert('Quote form submitted successfully! (This is a placeholder - actual submission functionality to be implemented)');
    
    // Optional: Reset form after successful submission
    // resetQuoteForm();
}

// Reset quote form to initial state
function resetQuoteForm() {
    const form = document.querySelector('.quote-form');
    if (!form) return;
    
    // Reset all form fields
    document.getElementById('fullName').value = '';
    document.getElementById('emailAddress').value = '';
    document.getElementById('businessName').value = '';
    document.getElementById('additionalNotes').value = '';
    document.getElementById('newsletterSignup').checked = false;
    
    // Hide the form
    const quoteFormContainer = document.getElementById('quoteFormContainer');
    const submitQuoteBtn = document.getElementById('submitQuoteForPreviewBtn');
    
    if (quoteFormContainer && submitQuoteBtn) {
        quoteFormContainer.classList.remove('show');
        submitQuoteBtn.textContent = 'Submit for Quote';
        
        setTimeout(() => {
            quoteFormContainer.style.display = 'none';
        }, 400); // Wait for animation to complete
    }
    
    // Trigger auto-resize
    setTimeout(() => {
        if (window.autoResize) window.autoResize.updateHeight();
    }, 500);
    
    console.log('📋 Quote form reset');
}

// Validate form fields in real-time
function setupFormValidation() {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('emailAddress');
    
    if (fullNameInput) {
        fullNameInput.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
                this.classList.add('invalid');
            }
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(this.value.trim())) {
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
                this.classList.add('invalid');
            }
        });
    }
}

// Modified PDF generation reset function to also reset quote form
function resetCalculatorWithQuoteForm() {
    // Call the original reset function
    if (typeof resetCalculator === 'function') {
        resetCalculator();
    }
    
    // Also reset the quote form
    resetQuoteForm();
    
    // Hide button container
    const buttonContainer = document.getElementById('buttonContainer');
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
        buttonContainer.innerHTML = '';
    }
}

// Export functions to global scope
window.quoteFormAPI = {
    initializeQuoteForm,
    addDownloadAndQuoteButtons,
    toggleQuoteForm,
    handleQuoteSubmission,
    resetQuoteForm,
    setupFormValidation,
    resetCalculatorWithQuoteForm
};

// Override the global addDownloadButton function to use our new function
window.addDownloadButton = addDownloadAndQuoteButtons;
