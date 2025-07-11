// Configuration for Wallpaper Calculator
// Modify these settings to customize for your business

const CONFIG = {
  // Business Information
  business: {
    name: "Faye Bell",
    website: "www.fayebell.com",
    email: "info@fayebell.com",
    location: "Atlanta, GA",
    logoUrl: "https://cdn.shopify.com/s/files/1/0571/8700/8610/files/Logo_Final2_Black_826e9cd0-43d1-4791-b5ca-72895a34d743.png?v=1724601480"
  },

  // Data Sources
  data: {
    patternsCSV: "./data/patterns.csv",
    // Set to relative path if hosting images locally, or full URL if using external CDN
    imageBaseUrl: "https://fayekaubell.github.io/calculator-base/data/patterns/"
  },

  // Calculator Settings
  calculator: {
    // Default pattern settings
    defaults: {
      panelWidth: 54,           // inches
      availableLengths: [9, 12, 15], // feet
      minOverage: 4,            // inches
      rollWidth: 54,            // inches for yard patterns
      minYardOrder: 3           // minimum yard order
    },

    // Panel height limits
    limits: {
      maxPanelHeight: 27,       // feet - warn if exceeding
      showLimitWarning: true
    }
  },

  // UI Customization
  ui: {
    // Text customization
    text: {
      pageTitle: "",  // Empty - website's page title will be used
      pageSubtitle: "Enter wall dimensions to estimate how much you'll need to purchase. Submit results if you'd like to receive a quote. We'll be in touch within one business day. (probably sooner)",
      
      // Measuring guide
      measuringGuide: {
        standardWalls: "Measure total width across all walls and height at the tallest point. Include doors, windows, and other obstacles in your measurements.",
        stairwayWalls: "Measure width at the broadest section and height from the first floor to the maximum height.",
        ceilings: "Measure the shorter dimension for width and longer dimension for height.",
        slopedCeilings: "Measure full width and maximum height.",
        note: "Note: Wallpaper projects can be tricky and we love to help. Please don't hesitate to contact us at info@fayebell.com for help with understanding measurements."
      },

      // Disclaimers
      disclaimers: {
        results: "Results take into consideration order minimums and at least 4\" overage. We recommend adding 10-30% overage to prevent installation snafus.",
        panelLimit: "Our panels typically do not print longer than 27'. However, problem solving is our specialty so feel free to contact us directly at info@fayebell.com to see if we can come up with a solution.",
        noRepeatHeight: "This pattern does not go to the height your wall dimensions require and will need to be scaled up. Contact us directly at info@fayebell.com to see if we can come up with a solution."
      }
    }
  },

  // Font & Color Styling Configuration
  // These can be overridden via URL parameters or parent window CSS variables
  styling: {
    // Default styling preset
    defaultPreset: "faye-bell-brand",

    // Available presets for different websites/brands
    presets: {
      "faye-bell-brand": {
        name: "Faye Bell Brand Colors",
        description: "Official Faye Bell website styling with Clarendon headings and Helvetica body",
        
        // Font variables
        fonts: {
          headingFamily: '"Monotype New Clarendon", "Clarendon LT STD", Georgia, serif',
          headingWeight: '700',
          headingStyle: 'normal',
          headingScale: '1.2',
          
          bodyFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
          bodyWeight: '400',
          bodyWeightBold: '700',
          bodyStyle: 'normal',
          bodyScale: '1.0'
        },

        // Color variables
        colors: {
          background: '#FFFFFF',
          text: '#4B4B4B',
          buttonBackground: '#F9F9F9',
          buttonText: '#4B4B4B',
          buttonOutline: '#000000',
          shadow: '#414141',
          border: '#E9ECEF',
          accent: '#6C757D'
        }
      },

      "default": {
        name: "Clean Default",
        description: "Clean, modern default styling",
        
        fonts: {
          headingFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          headingWeight: '600',
          headingStyle: 'normal',
          headingScale: '1.0',
          
          bodyFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          bodyWeight: '400',
          bodyWeightBold: '700',
          bodyStyle: 'normal',
          bodyScale: '1.0'
        },

        colors: {
          background: '#FFFFFF',
          text: '#333333',
          buttonBackground: '#F8F9FA',
          buttonText: '#333333',
          buttonOutline: '#DEE2E6',
          shadow: '#6C757D',
          border: '#E9ECEF',
          accent: '#007BFF'
        }
      },

      "modern-dark": {
        name: "Modern Dark",
        description: "Dark theme with modern fonts",
        
        fonts: {
          headingFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          headingWeight: '600',
          headingStyle: 'normal',
          headingScale: '1.1',
          
          bodyFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          bodyWeight: '400',
          bodyWeightBold: '600',
          bodyStyle: 'normal',
          bodyScale: '1.0'
        },

        colors: {
          background: '#1A1A1A',
          text: '#E5E5E5',
          buttonBackground: '#333333',
          buttonText: '#FFFFFF',
          buttonOutline: '#555555',
          shadow: '#000000',
          border: '#404040',
          accent: '#3B82F6'
        }
      },

      "corporate": {
        name: "Corporate",
        description: "Professional corporate styling",
        
        fonts: {
          headingFamily: 'Montserrat, "Helvetica Neue", Arial, sans-serif',
          headingWeight: '600',
          headingStyle: 'normal',
          headingScale: '1.15',
          
          bodyFamily: '"Open Sans", Arial, sans-serif',
          bodyWeight: '400',
          bodyWeightBold: '700',
          bodyStyle: 'normal',
          bodyScale: '1.0'
        },

        colors: {
          background: '#FFFFFF',
          text: '#2C3E50',
          buttonBackground: '#34495E',
          buttonText: '#FFFFFF',
          buttonOutline: '#2C3E50',
          shadow: '#7F8C8D',
          border: '#BDC3C7',
          accent: '#3498DB'
        }
      }
    },

    // Advanced styling options
    advanced: {
      // Enable/disable specific features
      enableFontScaling: true,
      enableColorInheritance: true,
      enableURLParameters: true,
      enableParentWindowInheritance: true,
      
      // Performance options
      useFontDisplay: 'swap', // For web fonts
      
      // Custom CSS injection point
      customCSS: ""
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
