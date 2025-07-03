# Wallpaper Calculator

A standalone wallpaper calculator that can be easily hosted on GitHub Pages and embedded as an iframe on any website. This calculator helps users estimate wallpaper requirements based on wall dimensions and generates visual previews with PDF downloads.

## Features

- **Pattern Selection**: Load wallpaper patterns from CSV data
- **Wall Measurement**: Input wall dimensions in feet and inches
- **Visual Preview**: Generate 3-section canvas previews showing panel layouts
- **PDF Generation**: Create downloadable PDFs with calculations and previews
- **Quote Forms**: Optional quote request system with email notifications
- **Responsive Design**: Works on desktop and mobile devices
- **Configurable**: Easy to customize for different businesses

## Quick Start

### 1. Fork or Download this Repository

```bash
git clone https://github.com/fayekaubell/calculator-base.git
cd calculator-base
```

### 2. Configure Your Settings

Edit `config.js` to customize for your business:

```javascript
const CONFIG = {
  business: {
    name: "Your Business Name",
    website: "www.yourbusiness.com",
    email: "info@yourbusiness.com",
    location: "Your City, State",
    logoUrl: "https://your-logo-url.com/logo.png"
  },
  // ... other settings
};
```

### 3. Add Your Pattern Data

Replace `data/patterns.csv` with your wallpaper patterns. Required columns:
- `pattern_name`: Display name
- `sku`: Product SKU
- `sale_type`: "panel" or "yard"
- `repeat_width_inches`: Pattern repeat width
- `repeat_height_inches`: Pattern repeat height (or "none")
- `material_width_inches`: Material width
- `panel_sequence`: Panel sequence (e.g., "AB", "ABC")
- `available_lengths_feet`: Available lengths (e.g., "9,12,15")
- `pattern_match`: Pattern match type
- `min_yard_order`: Minimum yard order (for yard patterns)
- `repeat_url`: URL to pattern image

### 4. Add Pattern Images

Place pattern images in the `data/patterns/` folder. Images should be named to match your SKUs (e.g., `pattern-001.jpg`).

### 5. Host on GitHub Pages

1. Push your repository to GitHub
2. Go to repository Settings > Pages
3. Select "Deploy from a branch" and choose "main"
4. Your calculator will be available at `https://yourusername.github.io/calculator-base/`

### 6. Embed on Your Website

Use an iframe to embed the calculator:

```html
<iframe 
  src="https://yourusername.github.io/calculator-base/" 
  width="100%" 
  height="800px" 
  frameborder="0">
</iframe>
```

## Configuration Options

### Business Information
Configure your business details in `config.js`:

```javascript
business: {
  name: "Your Business Name",
  website: "www.yourbusiness.com", 
  email: "info@yourbusiness.com",
  location: "Your City, State",
  logoUrl: "https://your-logo-url.com/logo.png"
}
```

### Data Sources
Set up your pattern data source:

```javascript
data: {
  patternsCSV: "./data/patterns.csv",
  imageBaseUrl: "https://your-cdn.com/images/"
}
```

### Google Services (Optional)
Enable Google Sheets logging and reCAPTCHA:

```javascript
google: {
  sheetsUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  recaptchaSiteKey: "your-recaptcha-site-key"
}
```

### Calculator Settings
Customize calculation defaults:

```javascript
calculator: {
  defaults: {
    panelWidth: 54,           // Default panel width in inches
    availableLengths: [9, 12, 15], // Default available lengths
    minOverage: 4,            // Minimum overage in inches
    rollWidth: 54,            // Roll width for yard patterns
    minYardOrder: 3           // Minimum yard order
  },
  limits: {
    maxPanelHeight: 27,       // Maximum panel height in feet
    showLimitWarning: true
  }
}
```

### PDF Settings
Configure PDF generation:

```javascript
pdf: {
  pageSize: {
    width: 609.6,   // 24 inches in mm
    height: 457.2   // 18 inches in mm
  },
  features: {
    downloadEnabled: true,
    autoSendToGoogleDrive: true,
    highResolutionImages: true
  }
}
```

### Quote Forms
Set up quote request forms:

```javascript
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
}
```

## Pattern Data Format

Your `patterns.csv` file should include these columns:

| Column | Description | Example |
|--------|-------------|---------|
| pattern_name | Display name | "Botanical Damask" |
| sku | Product SKU | "BOT-001" |
| sale_type | "panel" or "yard" | "panel" |
| repeat_width_inches | Pattern repeat width | 108 |
| repeat_height_inches | Pattern repeat height or "none" | 144 |
| material_width_inches | Material width | 54 |
| panel_sequence | Panel sequence | "AB" |
| available_lengths_feet | Available lengths | "9,12,15" |
| pattern_match | Pattern match type | "straight" |
| min_yard_order | Minimum yard order | 3 |
| repeat_url | Pattern image URL | "https://..." |

## Google Sheets Integration (Optional)

To enable usage logging and quote notifications:

1. **Create a Google Apps Script**:
   - Go to https://script.google.com
   - Create a new project
   - Replace the code with the provided Google Apps Script
   - Deploy as a web app

2. **Set up Google Sheets**:
   - Create a Google Sheet for logging
   - Update the script with your sheet ID

3. **Configure reCAPTCHA**:
   - Get reCAPTCHA keys from https://www.google.com/recaptcha/
   - Add your site key to the configuration

## File Structure

```
calculator-base/
├── index.html              # Main calculator page
├── config.js              # Configuration settings
├── data/
│   ├── patterns.csv       # Pattern data
│   └── patterns/          # Pattern images
├── js/
│   ├── calculator.js      # Main calculator logic
│   ├── preview.js         # Canvas preview generation
│   ├── pdf.js            # PDF generation
│   └── forms.js           # Quote form handling
├── css/
│   └── styles.css         # All styles
└── README.md              # This documentation
```

## Customization

### Styling
Edit `css/styles.css` to customize the appearance. The calculator uses CSS custom properties for easy theming.

### Text Content
Update text content in the `config.js` file under `ui.text` settings.

### Adding New Features
The modular structure makes it easy to add new features:
- Add new calculation types in `calculator.js`
- Add new preview sections in `preview.js`
- Add new PDF layouts in `pdf.js`
- Add new form fields in `forms.js`

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- jsPDF for PDF generation
- PapaParse for CSV parsing
- Google reCAPTCHA (optional)

## License

MIT License - feel free to use and modify for your business needs.

## Support

For issues or questions:
1. Check the GitHub Issues
2. Review the configuration options
3. Test with the demo data first
4. Ensure all required CSV columns are present

## Examples

### Basic Embed
```html
<iframe 
  src="https://yourusername.github.io/calculator-base/" 
  width="100%" 
  height="800px" 
  frameborder="0">
</iframe>
```

### Responsive Embed
```html
<div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
  <iframe 
    src="https://yourusername.github.io/calculator-base/" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0">
  </iframe>
</div>
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Panel and yard pattern support
- Visual preview generation
- PDF export functionality
- Quote form system
- Google Sheets integration
- Responsive design
