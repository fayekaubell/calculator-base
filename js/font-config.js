// Font Configuration System for Wallpaper Calculator
// This file handles dynamic font configuration via URL parameters

// Font configuration system
class FontConfig {
    constructor() {
        this.defaultFonts = {
            heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        };
        
        this.fontPresets = {
            'default': {
                heading: this.defaultFonts.heading,
                body: this.defaultFonts.body,
                ui: this.defaultFonts.ui
            },
            'clarendon-helvetica': {
                heading: '"Monotype New Clarendon", Clarendon, "Clarendon LT STD", "Bookman Old Style", Georgia, serif',
                body: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
                ui: 'Helvetica, "Helvetica Neue", Arial, sans-serif'
            },
            'modern': {
                heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            },
            'classic': {
                heading: '"Playfair Display", Georgia, "Times New Roman", serif',
                body: '"Source Sans Pro", Arial, sans-serif',
                ui: '"Source Sans Pro", Arial, sans-serif'
            },
            'corporate': {
                heading: 'Montserrat, "Helvetica Neue", Arial, sans-serif',
                body: '"Open Sans", Arial, sans-serif',
                ui: '"Open Sans", Arial, sans-serif'
            },
            'minimal': {
                heading: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                body: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                ui: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
            },
            'serif': {
                heading: 'Georgia, "Times New Roman", Times, serif',
                body: 'Georgia, "Times New Roman", Times, serif',
                ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            },
            'sans-serif': {
                heading: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                body: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                ui: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing font configuration system...');
        
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        let fonts = {};
        
        // Check for preset first
        const preset = urlParams.get('preset');
        if (preset && this.fontPresets[preset]) {
            fonts = { ...this.fontPresets[preset] };
            console.log(`🎨 Applied font preset: ${preset}`);
        } else {
            // Use default fonts as base
            fonts = { ...this.defaultFonts };
        }
        
        // Override with individual font parameters
        const headingFont = urlParams.get('heading') || urlParams.get('headingFont');
        const bodyFont = urlParams.get('body') || urlParams.get('bodyFont');
        const uiFont = urlParams.get('ui') || urlParams.get('uiFont');
        
        if (headingFont) {
            fonts.heading = decodeURIComponent(headingFont);
            console.log(`🎨 Custom heading font: ${fonts.heading}`);
        }
        
        if (bodyFont) {
            fonts.body = decodeURIComponent(bodyFont);
            console.log(`🎨 Custom body font: ${fonts.body}`);
        }
        
        if (uiFont) {
            fonts.ui = decodeURIComponent(uiFont);
            console.log(`🎨 Custom UI font: ${fonts.ui}`);
        }
        
        // Apply fonts to page
        this.applyFonts(fonts);
        
        // Store current configuration
        this.currentFonts = fonts;
        
        // Log applied configuration
        console.log('🎨 Font configuration applied:', fonts);
    }
    
    applyFonts(fonts) {
        // Create or update the font style element
        let fontStyleElement = document.getElementById('dynamic-font-styles');
        if (!fontStyleElement) {
            fontStyleElement = document.createElement('style');
            fontStyleElement.id = 'dynamic-font-styles';
            document.head.appendChild(fontStyleElement);
        }
        
        // Generate CSS with the specified fonts
        const css = `
            /* Dynamic Font Configuration */
            
            /* Headings */
            h1, h2, h3, h4, h5, h6,
            .page-title h1,
            .title-container h2,
            .preview-info h3,
            .measuring-guide summary h3,
            .form-group h3 {
                font-family: ${fonts.heading} !important;
            }
            
            /* Body text */
            body,
            p,
            .guide-content p,
            .order-line,
            .disclaimer p,
            .loading-message,
            .error-message {
                font-family: ${fonts.body} !important;
            }
            
            /* UI elements */
            .btn,
            input,
            select,
            .form-group select,
            .form-group input,
            .dimension-input span {
                font-family: ${fonts.ui} !important;
            }
            
            /* Ensure proper font weights are maintained */
            h1, h2, h3, h4, h5, h6 {
                font-weight: 700 !important; /* Bold weight for Monotype New Clarendon */
            }
            
            .btn {
                font-weight: 600;
            }
            
            .dimension-input span {
                font-weight: 600;
            }
            
            /* Page title specific styling */
            .page-title h1 {
                font-weight: 700 !important; /* Bold for Monotype New Clarendon */
                letter-spacing: -0.025em;
            }
            
            .page-title p {
                font-weight: 400;
            }
            
            /* Form labels */
            .form-group h3 {
                font-weight: 700 !important; /* Bold for Monotype New Clarendon */
                font-size: 1.1em;
            }
            
            /* Preview section titles */
            .title-container h2 {
                font-weight: 700 !important; /* Bold for Monotype New Clarendon */
                font-size: 1.5em;
            }
            
            .preview-info h3 {
                font-weight: 700 !important; /* Bold for Monotype New Clarendon */
                font-size: 1.2em;
            }
            
            /* Measuring guide headers */
            .measuring-guide summary h3 {
                font-weight: 700 !important; /* Bold for Monotype New Clarendon */
            }
            
            /* Ensure readability */
            body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
        `;
        
        fontStyleElement.textContent = css;
        
        console.log('✅ Font styles applied to page');
    }
    
    // Method to get current font configuration
    getCurrentFonts() {
        return this.currentFonts || this.defaultFonts;
    }
    
    // Method to list available presets
    getAvailablePresets() {
        return Object.keys(this.fontPresets);
    }
    
    // Method to get preset details
    getPresetDetails(presetName) {
        return this.fontPresets[presetName] || null;
    }
    
    // Method to update fonts dynamically (for testing)
    updateFonts(newFonts) {
        const fonts = { ...this.currentFonts, ...newFonts };
        this.applyFonts(fonts);
        this.currentFonts = fonts;
        console.log('🎨 Fonts updated dynamically:', fonts);
    }
}

// Initialize font configuration when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize font configuration before other calculator initialization
    window.fontConfig = new FontConfig();
    
    console.log('🎨 Font configuration system initialized');
    console.log('📝 Available presets:', window.fontConfig.getAvailablePresets().join(', '));
    
    // Debug: Log current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hasParams = Array.from(urlParams.keys()).length > 0;
    if (hasParams) {
        console.log('🔍 URL parameters detected:', Object.fromEntries(urlParams));
    } else {
        console.log('🔍 No URL parameters detected, using default fonts');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontConfig;
} else {
    window.FontConfig = FontConfig;
}

// Debug function for testing (available in console)
window.testFont = function(preset) {
    if (window.fontConfig && window.fontConfig.fontPresets[preset]) {
        window.fontConfig.updateFonts(window.fontConfig.fontPresets[preset]);
        console.log(`🧪 Test applied preset: ${preset}`);
    } else {
        console.log('🧪 Available presets:', window.fontConfig.getAvailablePresets().join(', '));
    }
};
