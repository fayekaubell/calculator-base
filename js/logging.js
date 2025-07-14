// Logging Module - Google Sheets Integration for Wallpaper Calculator
// Handles all data logging to Google Sheets via webhook

class CalculatorLogger {
    constructor() {
        this.config = window.CONFIG?.logging || {};
        this.enabled = this.config.enabled || false;
        this.webhookUrl = this.config.webhookUrl || '';
        this.retryAttempts = this.config.retryAttempts || 3;
        this.retryDelay = this.config.retryDelay || 1000;
        
        // Privacy settings
        this.enablePreviewLogging = this.config.enablePreviewLogging !== false; // Default true
        this.enablePDFLogging = this.config.enablePDFLogging !== false; // Default true  
        this.enableQuoteLogging = this.config.enableQuoteLogging !== false; // Default true
        
        this.previewNumber = this.generatePreviewNumber();
        
        this.init();
    }
    
    init() {
        if (!this.enabled) {
            console.log('📊 Calculator logging is disabled');
            return;
        }
        
        if (!this.webhookUrl) {
            console.warn('⚠️ Logging enabled but no webhook URL configured');
            return;
        }
        
        console.log('📊 Calculator logging initialized:', {
            webhookUrl: this.webhookUrl ? 'Configured' : 'Missing',
            previewLogging: this.enablePreviewLogging,
            pdfLogging: this.enablePDFLogging,
            quoteLogging: this.enableQuoteLogging,
            previewNumber: this.previewNumber
        });
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for preview generation
        document.addEventListener('previewGenerated', (event) => {
            if (this.enablePreviewLogging) {
                this.logGeneratePreview(event.detail || {});
            }
        });
        
        // Listen for PDF downloads
        document.addEventListener('pdfDownloaded', (event) => {
            if (this.enablePDFLogging) {
                this.logDownloadPDF(event.detail || {});
            }
        });
        
        // Listen for quote submissions
        document.addEventListener('quoteSubmitted', (event) => {
            if (this.enableQuoteLogging) {
                this.logSubmitQuote(event.detail || {});
            }
        });
        
        console.log('📊 Logging event listeners attached');
    }
    
    generatePreviewNumber() {
        // Generate a unique 5-digit preview number
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return (timestamp.slice(-2) + random).padStart(5, '0');
    }
    
    getCurrentTimestamp() {
        return new Date().toISOString();
    }
    
    getUserAgent() {
        if (!this.config.includeUserAgent) return '';
        return navigator.userAgent || '';
    }
    
    getWallDimensions() {
        if (!window.currentPreview) return { width: '', height: '' };
        
        const { wallWidthFeet, wallWidthInches, wallHeightFeet, wallHeightInches } = window.currentPreview;
        
        const widthStr = wallWidthInches > 0 ? 
            `${wallWidthFeet}' ${wallWidthInches}"` : `${wallWidthFeet}' 0"`;
        const heightStr = wallHeightInches > 0 ? 
            `${wallHeightFeet}' ${wallHeightInches}"` : `${wallHeightFeet}' 0"`;
            
        return {
            width: widthStr,
            height: heightStr
        };
    }
    
    getPatternInfo() {
        if (!window.currentPreview?.pattern) return { name: '', sku: '', display: '' };
        
        const { pattern } = window.currentPreview;
        const display = pattern.sku ? `${pattern.name} / ${pattern.sku}` : pattern.name;
        
        return {
            name: pattern.name || '',
            sku: pattern.sku || '',
            display: display
        };
    }
    
    getTotalYardage() {
        if (!window.currentPreview?.calculations) return '';
        
        const { calculations } = window.currentPreview;
        
        if (calculations.saleType === 'yard') {
            return `${calculations.totalYardage} yards`;
        } else {
            // Panel-based calculation
            const yardagePerPanel = Math.round(calculations.panelLength / 3);
            const totalYardage = calculations.panelsNeeded * yardagePerPanel;
            return `${totalYardage} yards`;
        }
    }
    
    async logGeneratePreview(eventData = {}) {
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            const logData = {
                action: 'generate_preview',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                previewNumber: this.previewNumber,
                userAgent: this.getUserAgent(),
                
                // Additional data for debugging (not sent to sheet)
                _metadata: {
                    url: window.location.href,
                    eventData: eventData
                }
            };
            
            await this.sendToWebhook(logData);
            console.log('📊 Preview generation logged:', logData.previewNumber);
            
        } catch (error) {
            console.error('❌ Failed to log preview generation:', error);
        }
    }
    
    async logDownloadPDF(eventData = {}) {
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            // Generate PDF filename
            const pdfFilename = eventData.filename || this.generatePDFFilename();
            
            const logData = {
                action: 'download_pdf',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                pdfFilename: pdfFilename,
                previewNumber: this.previewNumber,
                userAgent: this.getUserAgent(),
                
                _metadata: {
                    url: window.location.href,
                    eventData: eventData
                }
            };
            
            await this.sendToWebhook(logData);
            console.log('📊 PDF download logged:', pdfFilename);
            
        } catch (error) {
            console.error('❌ Failed to log PDF download:', error);
        }
    }
    
    async logSubmitQuote(eventData = {}) {
        try {
            const wallDimensions = this.getWallDimensions();
            const patternInfo = this.getPatternInfo();
            const totalYardage = this.getTotalYardage();
            
            // Get customer information from form or event data
            const customerName = eventData.fullName || document.getElementById('fullName')?.value || '';
            const customerEmail = eventData.emailAddress || document.getElementById('emailAddress')?.value || '';
            const customerBusiness = eventData.businessName || document.getElementById('businessName')?.value || '';
            const additionalNotes = eventData.additionalNotes || document.getElementById('additionalNotes')?.value || '';
            const newsletter = eventData.newsletter !== undefined ? eventData.newsletter : 
                              (document.getElementById('newsletterSignup')?.checked || false);
            
            const pdfFilename = eventData.pdfFilename || this.generatePDFFilename();
            
            const logData = {
                action: 'submit_quote',
                timestamp: this.getCurrentTimestamp(),
                wallWidth: wallDimensions.width,
                wallHeight: wallDimensions.height,
                patternSelected: patternInfo.display,
                totalYardage: totalYardage,
                pdfFilename: pdfFilename,
                previewNumber: this.previewNumber,
                userAgent: this.getUserAgent(),
                customerName: customerName,
                customerEmail: customerEmail,
                customerBusiness: customerBusiness,
                additionalNotes: additionalNotes,
                newsletter: newsletter,
                
                _metadata: {
                    url: window.location.href,
                    eventData: eventData
                }
            };
            
            await this.sendToWebhook(logData);
            console.log('📊 Quote submission logged:', customerEmail);
            
        } catch (error) {
            console.error('❌ Failed to log quote submission:', error);
        }
    }
    
    generatePDFFilename() {
        if (!window.currentPreview?.pattern) return 'wallpaper-preview.pdf';
        
        const { pattern } = window.currentPreview;
        const sku = pattern.sku || 'unknown';
        return `Faye-Bell-Wallpaper-Preview-${sku}-${this.previewNumber}.pdf`;
    }
    
    async sendToWebhook(data) {
        if (!this.webhookUrl) {
            console.warn('⚠️ No webhook URL configured, skipping log');
            return;
        }
        
        let attempt = 0;
        let lastError;
        
        while (attempt < this.retryAttempts) {
            try {
                console.log(`📤 Sending to webhook (attempt ${attempt + 1}):`, {
                    action: data.action,
                    previewNumber: data.previewNumber,
                    timestamp: data.timestamp
                });
                
                const response = await fetch(this.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                    mode: 'no-cors' // Required for Google Apps Script webhooks
                });
                
                // Note: With no-cors mode, we can't read the response
                // But if fetch doesn't throw, the request was sent successfully
                console.log('✅ Data sent to webhook successfully');
                return;
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                console.warn(`⚠️ Webhook attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    console.log(`🔄 Retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }
        
        // All retries failed
        console.error(`❌ Failed to send to webhook after ${this.retryAttempts} attempts:`, lastError);
        throw new Error(`Webhook logging failed: ${lastError.message}`);
    }
    
    // Public methods for manual logging
    async manualLogPreview() {
        if (!this.enablePreviewLogging) return;
        await this.logGeneratePreview();
    }
    
    async manualLogPDF(filename = '') {
        if (!this.enablePDFLogging) return;
        await this.logDownloadPDF({ filename });
    }
    
    async manualLogQuote(formData = {}) {
        if (!this.enableQuoteLogging) return;
        await this.logSubmitQuote(formData);
    }
    
    // Utility methods
    getPreviewNumber() {
        return this.previewNumber;
    }
    
    generateNewPreviewNumber() {
        this.previewNumber = this.generatePreviewNumber();
        return this.previewNumber;
    }
    
    isEnabled() {
        return this.enabled && !!this.webhookUrl;
    }
    
    getConfig() {
        return {
            enabled: this.enabled,
            hasWebhookUrl: !!this.webhookUrl,
            previewLogging: this.enablePreviewLogging,
            pdfLogging: this.enablePDFLogging,
            quoteLogging: this.enableQuoteLogging,
            previewNumber: this.previewNumber
        };
    }
}

// Event dispatchers - these functions trigger the logging events
// Called from other modules when actions occur

function dispatchPreviewGenerated(eventData = {}) {
    const event = new CustomEvent('previewGenerated', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 Preview generated event dispatched');
}

function dispatchPDFDownloaded(eventData = {}) {
    const event = new CustomEvent('pdfDownloaded', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 PDF downloaded event dispatched');
}

function dispatchQuoteSubmitted(eventData = {}) {
    const event = new CustomEvent('quoteSubmitted', {
        detail: eventData
    });
    document.dispatchEvent(event);
    console.log('📊 Quote submitted event dispatched');
}

// Initialize logging system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.calculatorLogger = new CalculatorLogger();
    
    // Export event dispatchers globally
    window.dispatchPreviewGenerated = dispatchPreviewGenerated;
    window.dispatchPDFDownloaded = dispatchPDFDownloaded;
    window.dispatchQuoteSubmitted = dispatchQuoteSubmitted;
    
    console.log('📊 Calculator logging system initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculatorLogger, dispatchPreviewGenerated, dispatchPDFDownloaded, dispatchQuoteSubmitted };
} else {
    window.CalculatorLogger = CalculatorLogger;
}
