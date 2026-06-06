# Club des Pins - QR Menu System

A modern, responsive, and multilingual QR Code menu system for restaurants. Built with HTML5, CSS3, Bootstrap 5, and Vanilla JavaScript.

## Features

- **Multilingual Support**: French (default), Arabic, and English with RTL support for Arabic
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **No Backend Required**: 100% frontend, deployable on GitHub Pages or any static host
- **Google Sheets Integration**: Manage menu, promos, packs & inventory from a Google Sheet (no backend)
- **Prominent Call Waiter**: Always-visible floating button with pulse animation (never hidden)
- **Promotions System**: Auto-rotating promo banners with discount badges
- **Packs / Combos**: Special combo deals section with WhatsApp ordering
- **Inventory Management**: Stock tracking with "out of stock" and "low stock" badges
- **Dynamic Menu**: All menu items loaded from JSON or Google Sheets
- **Search & Filter**: Instant search and price range filtering
- **Category Tabs**: Sticky category navigation
- **Product Modals**: Detailed view of each item with promo pricing
- **Shopping Cart**: LocalStorage-based cart with WhatsApp order dispatch
- **QR Code Ready**: Supports table numbers via URL parameters
- **Performance Optimized**: Lightweight and fast loading
- **Sync Button**: One-click data refresh from Google Sheets

## Project Structure

```
├── index.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   └── menu.js
├── data/
│   ├── menu.json
│   └── settings.json
├── assets/
│   ├── logo/
│   ├── products/
│   ├── banners/
│   └── icons/
├── qr/
├── GOOGLE_SHEETS_SETUP.md
└── additional_premium_feature.md
```

## Setup

1. Clone or download this repository
2. Replace the sample images in `assets/products/` with your own product images
3. Update the menu data in `data/menu.json` with your restaurant's items
4. Customize the restaurant name, logo, and colors in the CSS files
5. Deploy to GitHub Pages or any static web host

## Deployment Instructions (GitHub Pages)

1. Push your code to a GitHub repository
2. Go to the repository settings
3. Navigate to the "Pages" section
4. Under "Source", select the `main` branch (or `master`) and the `/root` folder
5. Click "Save"
6. Your site will be published at `https://yourusername.github.io/repository-name/`

## QR Code Generation

To generate QR codes for your tables:

1. Use any free QR code generator (like [QRCode Monkey](https://www.qrcode-monkey.com/) or [QRickit](https://qrickit.com/))
2. The URL format should be: `https://yourusername.github.io/repository-name/?table=X`
   (Replace `yourusername`, `repository-name`, and `X` with your table number)
3. Download the QR code image and print it for your tables

## Google Sheets Integration (Optional)

Manage your entire menu from Google Sheets — no backend needed.

1. Create a Google Sheet with tabs: `settings`, `categories`, `menu`, `packs`, `promos`, `translations`
2. **File → Share → Publish to web** → Publish the entire document
3. Copy your Sheet ID from the URL
4. Update `data/settings.json`:
   ```json
   {
     "googleSheetsEnabled": true,
     "googleSheetsId": "YOUR_SHEET_ID_HERE"
   }
   ```
5. Click the **🔄 Sync** button in the header to load data

See `GOOGLE_SHEETS_SETUP.md` for detailed setup instructions with column templates.

### Data Priority
- If Google Sheets is enabled and data loads successfully → uses Sheet data
- Falls back to local `data/menu.json` if Sheets fail or are disabled
- Data is cached in localStorage for 5 minutes for performance

## Customization

### Changing Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #f5a623;   /* Main color */
    --primary-dark: #d68910;    /* Darker shade */
    --primary-light: #ffc96f;   /* Lighter shade */
    --secondary-color: #2c3e50; /* Text color */
    /* ... */
}
```

### Adding More Languages
1. Add translations to the `translations` object in `data/menu.json`
2. Add a new language option in the language selector in `index.html`
3. The system will automatically handle RTL for Arabic (you can extend this for other RTL languages)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Credits

- Bootstrap 5: https://getbootstrap.com/
- Font Awesome 6: https://fontawesome.com/
- Google Fonts: Poppins and Cairo

## License

MIT License - feel free to use this for any restaurant or food business.

--- 
*Developed with ❤️ for Club des Pins Restaurant*