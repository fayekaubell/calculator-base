// CSS Variables Font Configuration System for Wallpaper Calculator
// This system can read CSS variables from URL parameters or detect them from parent window

class CSSVariablesFontConfig {
    constructor() {
        this.defaultVariables = {
            '--font-body-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '--font-body-style': 'normal',
            '--font-body-weight': '400',
            '--font-body-weight-bold': '700',
            '--font-heading-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '--font-heading-style': 'normal',
            '--font-heading-weight': '600',
            '--font-body-scale': '1.0',
            '--font-heading-scale': '1.0'
        };
        
        // Preset configurations matching common website patterns
        this.presets = {
            'default': this.defaultVariables,
            'clarendon-helvetica': {
                '--font-body-family': 'Helvetica, "Helvetica Neue", Arial, sans-serif',
                '--font-body-style': 'normal',
                '--font-body-weight': '400',
                '--font-body-weight-bold': '700',
                '--font-heading-family': '"Monotype New Clarendon", "Clarendon LT STD", Georgia, serif',
                '--font-heading-style': 'normal',
                '--font-heading-weight': '700',
                '--font-body-scale': '1.0',
                '--font-heading-scale': '1.2'
            },
            'modern': {
                '--font-body-family': 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                '--font-body-style': 'normal',
                '--font-body-weight': '400',
                '--font-body-weight-bold': '700',
                '--font-heading-family': 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                '--font-heading-style': 'normal',
                '--font-heading-weight': '600',
                '--font-body-scale': '1.0',
                '--font-heading-scale': '1.1'
            },
            'corporate': {
                '--font-body-family': '"Open Sans", Arial, sans-serif',
                '--font-body-style': 'normal',
                '--font-body-weight': '400',
                '--font-body-weight-bold': '700',
                '--font-heading-family': 'Montserrat, "Helvetica Neue", Arial, sans-serif',
                '--font-heading-style': 'normal',
                '--font-heading-weight': '600',
                '--font-body-scale': '1.0',
                '--font-heading-scale': '1.15'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing CSS Variables Font Configuration...');
        
        let cssVariables = {};
        
        // Method 1: Try to read from URL parameters first
        cssVariables = this.readFromURLParameters();
        
        // Method 2: Try to read from parent window (if in iframe)
        if (Object.keys(cssVariables).length === 0) {
            cssVariables = this.readFromParentWindow();
        }
        
        // Method 3: Use defaults if nothing found
        if (Object.keys(cssVariables).length === 0) {
            cssVariables = { ...this.defaultVariables };
            console.log('🎨 Using default font variables');
        }
        
        // Apply the CSS variables
        this.applyCSSVariables(cssVariables);
        
        // Store current configuration
        this.currentVariables = cssVariables;
        
        console.log('🎨 CSS Variables applied:', cssVariables);
    }
    
    readFromURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const variables = {};
        
        // Check for preset first
        const preset = urlParams.get('preset') || urlParams.get('fontPreset');
        if (preset && this.presets[preset]) {
            Object.assign(variables, this.presets[preset]);
            console.log(`🎨 Applied CSS variables preset: ${preset}`);
            return variables;
        }
        
        // Check for individual CSS variable parameters
        const paramMapping = {
            'fontBodyFamily': '--font-body-family',
            'fontBodyStyle': '--font-body-style',
            'fontBodyWeight': '--font-body-weight',
            'fontBodyWeightBold': '--font-body-weight-bold',
            'fontHeadingFamily': '--font-heading-family',
            'fontHeadingStyle': '--font-heading-style',
            'fontHeadingWeight': '--font-heading-weight',
            'fontBodyScale': '--font-body-scale',
            'fontHeadingScale': '--font-heading-scale',
            
            // Alternative parameter names
            'bodyFamily': '--font-body-family',
            'headingFamily': '--font-heading-family',
            'bodyWeight': '--font-body-weight',
            'headingWeight': '--font-heading-weight'
        };
        
        for (const [param, cssVar] of Object.entries(paramMapping)) {
            const value = urlParams.get(param);
            if (value) {
                variables[cssVar] = decodeURIComponent(value);
                console.log(`🎨 CSS variable from URL: ${cssVar} = ${variables[cssVar]}`);
            }
        }
        
        return variables;
    }
    
    readFromParentWindow() {
        const variables = {};
        
        try {
            // Check if we're in an iframe
            if (window !== window.parent) {
                console.log('🔍 Attempting to read CSS variables from parent window...');
                
                // Try to access parent window's computed styles
                const parentRoot = window.parent.document.documentElement;
                const parentStyles = window.parent.getComputedStyle(parentRoot);
                
                // Read the CSS variables we care about
                const cssVarNames = Object.keys(this.defaultVariables);
                
                for (const cssVar of cssVarNames) {
                    const value = parentStyles.getPropertyValue(cssVar);
                    if (value && value.trim()) {
                        variables[cssVar] = value.trim();
                        console.log(`🎨 Inherited from parent: ${cssVar} = ${value.trim()}`);
                    }
                }
                
                if (Object.keys(variables).length > 0) {
                    console.log('✅ Successfully inherited CSS variables from parent');
                }
            }
        } catch (error) {
            console.log('⚠️ Cannot access parent window (CORS restriction):', error.message);
            console.log('💡 Use URL parameters instead for cross-origin embedding');
        }
        
        return variables;
    }
    
    applyCSSVariables(variables) {
        // Set CSS variables on the root element
        const root = document.documentElement;
        
        for (const [cssVar, value] of Object.entries(variables)) {
            root.style.setProperty(cssVar, value);
        }
        
        // Create or update the font style element that uses these variables
        let fontStyleElement = document.getElementById('css-variables-font-styles');
        if (!fontStyleElement) {
            fontStyleElement = document.createElement('style');
            fontStyleElement.id = 'css-variables-font-styles';
            document.head.appendChild(fontStyleElement);
        }
        
        // Generate CSS that uses the CSS variables
        const css = `
            /* CSS Variables Font Configuration */
            
            /* Set up the CSS variables if not already set */
            :root {
                --font-body-family: ${variables['--font-body-family'] || this.defaultVariables['--font-body-family']};
                --font-body-style: ${variables['--font-body-style'] || this.defaultVariables['--font-body-style']};
                --font-body-weight: ${variables['--font-body-weight'] || this.defaultVariables['--font-body-weight']};
                --font-body-weight-bold: ${variables['--font-body-weight-bold'] || this.defaultVariables['--font-body-weight-bold']};
                --font-heading-family: ${variables['--font-heading-family'] || this.defaultVariables['--font-heading-family']};
                --font-heading-style: ${variables['--font-heading-style'] || this.defaultVariables['--font-heading-style']};
                --font-heading-weight: ${variables['--font-heading-weight'] || this.defaultVariables['--font-heading-weight']};
                --font-body-scale: ${variables['--font-body-scale'] || this.defaultVariables['--font-body-scale']};
                --font-heading-scale: ${variables['--font-heading-scale'] || this.defaultVariables['--font-heading-scale']};
            }
            
            /* Apply fonts using CSS variables */
            
            /* Headings */
            h1, h2, h3, h4, h5, h6,
            .page-title h1,
            .title-container h2,
            .preview-info h3,
            .measuring-guide summary h3,
            .form-group h3 {
                font-family: var(--font-heading-family) !important;
                font-style: var(--font-heading-style) !important;
                font-weight: var(--font-heading-weight) !important;
            }
            
            /* Body text */
            body,
            p,
            .guide-content p,
            .order-line,
            .disclaimer p,
            .loading-message,
            .error-message {
                font-family: var(--font-body-family) !important;
                font-style: var(--font-body-style) !important;
                font-weight: var(--font-body-weight) !important;
            }
            
            /* UI elements - use body font */
            .btn,
            input,
            select,
            .form-group select,
            .form-group input,
            .dimension-input span {
                font-family: var(--font-body-family) !important;
                font-style: var(--font-body-style) !important;
                font-weight: var(--font-body-weight) !important;
            }
            
            /* Bold elements */
            strong,
            .order-line strong,
            .btn {
                font-weight: var(--font-body-weight-bold) !important;
            }
            
            /* Apply scaling if specified */
            body {
                font-size: calc(1rem * var(--font-body-scale));
            }
            
            h1, h2, h3, h4, h5, h6 {
                font-size: calc(1em * var(--font-heading-scale));
            }
            
            /* Specific size adjustments for calculator */
            .page-title h1 {
                font-size: calc(2rem * var(--font-heading-scale));
                letter-spacing: -0.025em;
                line-height: 1.2;
            }
            
            .form-group h3 {
                font-size: calc(1.1rem * var(--font-heading-scale));
                margin-bottom: 15px;
            }
            
            .title-container h2 {
                font-size: calc(1.5rem * var(--font-heading-scale));
                line-height: 1.3;
            }
            
            .preview-info h3 {
                font-size: calc(1.2rem * var(--font-heading-scale));
            }
            
            /* Ensure readability */
            body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                line-height: 1.6;
            }
            
            /* Button specific styling */
            .btn {
                font-weight: var(--font-body-weight-bold);
                letter-spacing: 0.05em;
            }
        `;
        
        fontStyleElement.textContent = css;
        console.log('✅ CSS Variables font styles applied');
    }
    
    // Method to get current CSS variables
    getCurrentVariables() {
        return this.currentVariables || this.defaultVariables;
    }
    
    // Method to update variables dynamically
    updateVariables(newVariables) {
        const variables = { ...this.currentVariables, ...newVariables };
        this.applyCSSVariables(variables);
        this.currentVariables = variables;
        console.log('🎨 CSS Variables updated:', variables);
    }
    
    // Method to get available presets
    getAvailablePresets() {
        return Object.keys(this.presets);
    }
    
    // Method to apply a preset
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.applyCSSVariables(this.presets[presetName]);
            this.currentVariables = { ...this.presets[presetName] };
            console.log(`🎨 Applied preset: ${presetName}`);
            return true;
        }
        return false;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.cssVariablesFontConfig = new CSSVariablesFontConfig();
    console.log('🎨 CSS Variables Font Configuration initialized');
    
    // Debug function for console testing
    window.testCSSPreset = function(preset) {
        return window.cssVariablesFontConfig.applyPreset(preset);
    };
    
    // Debug function to show current variables
    window.showCurrentFonts = function() {
        console.table(window.cssVariablesFontConfig.getCurrentVariables());
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesFontConfig;
} else {
    window.CSSVariablesFontConfig = CSSVariablesFontConfig;
}
