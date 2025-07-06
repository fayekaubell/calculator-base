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
      pageTitle: "Wallpaper Preview Calculator",
      pageSubtitle: "Enter wall dimensions to see how much wallpaper you'll need.",
      
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
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
