# Deployment Instructions

## GitHub Pages Deployment

1. **Create a GitHub Repository**
   - Create a new repository on GitHub (e.g., `menu-restaurant`)
   - Push all files from this directory to the repository's main branch

2. **Enable GitHub Pages**
   - Go to your repository settings on GitHub
   - Click on "Pages" in the left sidebar
   - Under "Source", select the `main` branch (or `master`) and the `/root` folder
   - Click "Save"
   - GitHub will provide your site URL (usually `https://haithemkoriche.github.io/menu-restaurant/`)

3. **Customize the URL**
   - Edit the canonical URL in `index.html` line 14-15:
     ```html
     <link
       rel="canonical"
       href="https://haithemkoriche.github.io/menu-restaurant/"
     />
     ```
   - Update the hreflang links (lines 27-40) with your actual URL
   - Update the Open Graph image URL if you add a hero banner
   - Update the schema.org URL in the JSON-LD script (line 67)
   - Update the telephone number in the JSON-LD script (line 68)

4. **Add Your Assets**
   - Replace placeholder images in:
     - `assets/logo/` - Add your restaurant logo
     - `assets/products/` - Add product images (name them as referenced in menu.json)
     - `assets/banners/` - Add a hero banner image (update reference in index.html line 19)
     - `assets/icons/` - Add any custom icons

5. **Update Menu Data**
   - Edit `data/menu.json` with your actual menu items, prices, descriptions, etc.
   - Ensure image paths are correct (e.g., "assets/products/your-image.jpg")
   - Add or remove categories and products as needed

6. **Test Locally (Optional)**
   - Open `index.html` in a browser to test functionality
   - Use browser developer tools to test responsive design
   - Test language switching and table number functionality

## QR Code Generation

1. **Determine Your Base URL**
   - After deployment, your site will be at: `https://haithemkoriche.github.io/menu-restaurant/`

2. **Generate QR Codes for Each Table**
   - Use a QR code generator (like [QRCode Monkey](https://www.qrcode-monkey.com/) or [QRickit](https://qrickit.com/))
   - Create URLs with table parameters:
     - Table 1: `https://haithemkoriche.github.io/menu-restaurant/?table=1`
     - Table 2: `https://haithemkoriche.github.io/menu-restaurant/?table=2`
     - Table 3: `https://haithemkoriche.github.io/menu-restaurant/?table=3`
   - Continue for as many tables as you have

3. **Download and Print**
   - Download the QR code images in high resolution (PNG or SVG recommended)
   - Print them at appropriate size for your tables (minimum 2x2 cm recommended)
   - Consider laminating for durability
   - Place one QR code on each table

## Maintenance

- **Updating Menu Items**
  1. Edit `data/menu.json`
  2. Commit and push changes to GitHub
  3. GitHub Pages will automatically update (usually within seconds)

- **Updating Text/Translations**
  1. Edit the translations in `data/menu.json`
  2. Push changes to GitHub

- **Updating Styles**
  1. Edit `css/style.css` or `css/responsive.css`
  2. Push changes to GitHub

## Troubleshooting

- **Images Not Loading**
  - Check that image files exist in the correct directories
  - Verify file names match exactly (case-sensitive)
  - Check browser console for 404 errors

- **Language Not Switching**
  - Check browser console for JavaScript errors
  - Ensure localStorage is accessible (not blocked by privacy settings)
  - Verify that the menu.json file is loading correctly

- **Layout Issues on Mobile**
  - Test with browser developer tools (toggle device toolbar)
  - Check that responsive.css is being loaded
  - Verify viewport meta tag is present in index.html

- **QR Code Not Showing Table Number**
  - Verify the URL contains `?table=X` parameter
  - Check that the tableBadge element is being displayed in app.js
  - Ensure JavaScript is executing properly

For additional help, consult the README.md file or contact support.
