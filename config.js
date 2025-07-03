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
    patternsImageFolder: "./data/patterns/",
    // Set to relative path if hosting images locally, or full URL if using external CDN
    imageBaseUrl: "https://raw.githubusercontent.com/fayekaubell/calculator-base/main/data/patterns/"
  },

  // Google Services Integration (optional)
  google: {
    // Google Sheets logging (set to null to disable)
    sheetsUrl: "https://script.google.com/macros/s/AKfycbxqu_gVWH8nqXCaOD_uCgvHyuxli_cqta__XDvfqT9Ue5AgAhvd-X2SCK9MMKEmuSGcmQ/exec",
    
    // reCAPTCHA (set to null to disable)
    recaptchaSiteKey: "6Lcqdm0rAAAAAKunYLEaJDrkn5WXg4Qeu5dCXZTy"
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

  // PDF Settings
  pdf: {
    // PDF page dimensions (landscape orientation)
    pageSize: {
      width: 609.6,   // 24 inches in mm
      height: 457.2   // 18 inches in mm
    },
    
    // Enable/disable PDF features
    features: {
      downloadEnabled: true,
      autoSendToGoogleDrive: true,
      highResolutionImages: true
    }
  },

  // Quote Form Settings
  quotes: {
    enabled: true,
    requireCaptcha: true,
    fields: {
      name: { required: true },
      email: { required: true },
      business: { required: false },
      notes: { required: false },
      newsletter: { required: false }
    }
  },

  // UI Customization
  ui: {
    theme: {
      primaryColor: "#333",
      secondaryColor: "#6c757d",
      errorColor: "#dc3545",
      successColor: "#28a745"
    },
    
    // Text customization
    text: {
      pageTitle: "Wallpaper Preview Calculator",
      pageSubtitle: "Enter wall dimensions to estimate how much you'll need to purchase. Submit results if you'd like to receive a quote. We'll be in touch within one business day. (probably sooner)",
      
      // Measuring guide
      measuringGuide: {
        title: "Measuring Guide",
        standardWalls: "Standard Walls & Connected Walls: Measure total width across all walls and height at the tallest point. Include doors, windows, and other obstacles in your measurements.",
        stairwayWalls: "Stairway Walls: Measure width at the broadest section and height from the first floor to the maximum height.",
        ceilings: "Ceilings: Measure the shorter dimension for width and longer dimension for height.",
        slopedCeilings: "Sloped Ceiling Walls: Measure full width and maximum height.",
        note: "Note: Wallpaper projects can be tricky and we love to help. Please don't hesitate to email us at info@fayebell.com for help with understanding measurements."
      },

      // Disclaimers
      disclaimers: {
        results: "Results take into consideration order minimums and at least 4\" overage. We recommend adding 10-30% overage to prevent installation snafus. We do not recommend purchasing without first confirming with an installer.",
        panelLimit: "Our panels typically do not print longer than 27'. However, problem solving is our specialty so feel free to contact us directly at info@fayebell.com to see if we can come up with a solution.",
        noRepeatHeight: "This pattern does not go to the height your wall dimensions require and will need to be scaled up. Contact us directly at info@fayebell.com to see if we can come up with a solution."
      }
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
