# MASTER PROMPT — QR MENU RESTAURANT SYSTEM (PROFESSIONAL VERSION)

You are a Senior Software Architect, Senior Frontend Engineer, Senior UI/UX Designer, Senior Product Designer, and Senior Web Performance Engineer.

Your mission is to build a complete production-ready QR Menu System for a restaurant called:

"Club des Pains Restaurant"

The application must be modern, responsive, professional, lightweight, and deployable for free on GitHub Pages.

## Project Goal

Customers scan a QR Code placed on restaurant tables.

After scanning, the menu opens instantly on their smartphone.

No login is required.

No application installation is required.

The system must work as a static website hosted on GitHub Pages.

## Technical Requirements

Use:

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript (ES6)
- JSON data source

Do NOT use:

- PHP
- Laravel
- Node.js
- Database
- Backend APIs

Everything must be frontend-only.

## Multilingual System (French / Arabic / English)

The application must be fully multilingual.

Supported languages:

1. French (Default Language)
2. Arabic
3. English

### Language Rules

French must be the primary language of the application.

When a customer opens the QR Menu for the first time:

* The interface must automatically load in French.
* All menus, buttons, labels, categories, and messages must initially appear in French.

### Language Switcher

Add a professional language selector in the header.

Display:

* Français 🇫🇷
* العربية 🇩🇿
* English 🇬🇧

The language selector must be:

* Mobile friendly
* Easily accessible
* Professionally designed

### Translation System

All application content must be translatable, including:

* Restaurant information
* Categories
* Product names
* Product descriptions
* Buttons
* Search placeholders
* Filters
* Availability status
* Messages
* Labels
* Error messages

No hardcoded text is allowed.

### JSON Multilingual Structure

All content must support translations using a multilingual JSON structure.

Example:

{
"restaurant": {
"fr": "Club des Pains",
"ar": "نادي الخبز",
"en": "Bread Club"
},
"products": [
{
"id": 1,
"name": {
"fr": "Tacos Poulet",
"ar": "تاكوس الدجاج",
"en": "Chicken Tacos"
},
"description": {
"fr": "Poulet grillé avec fromage et frites",
"ar": "دجاج مشوي مع الجبن والبطاطا",
"en": "Grilled chicken with cheese and fries"
}
}
]
}

### Arabic RTL Support

Arabic language must support:

* RTL (Right-to-Left)
* Arabic typography
* Proper alignment
* RTL navigation
* RTL cards
* RTL modals
* RTL menus

The application must automatically switch between:

* LTR for French and English
* RTL for Arabic

### Language Persistence

Store the selected language in LocalStorage.

When the user returns:

* Automatically restore the previously selected language.

### SEO Multilingual

Implement:

* hreflang tags
* language meta tags
* multilingual structured data

### Translation Quality

Arabic translations must be professional Modern Standard Arabic.

French translations must be native-quality.

English translations must be professional international English.

### Sample Content

Generate all sample menu items in:

* French
* Arabic
* English

for every category and product.

The multilingual system must be scalable and allow adding additional languages in the future without changing the application architecture.

## Project Structure

Create a clean professional structure:

/
├── index.html
├── css/
│ ├── style.css
│ └── responsive.css
├── js/
│ ├── app.js
│ ├── menu.js
│ └── search.js
├── data/
│ └── menu.json
├── assets/
│ ├── logo/
│ ├── products/
│ ├── banners/
│ └── icons/
└── qr/

Code must be modular and organized.

## Design Requirements

Create a premium restaurant experience.

Style inspiration:

- Uber Eats
- Deliveroo
- Talabat
- McDonald's App

Design must include:

- Elegant typography
- Soft shadows
- Rounded corners
- Mobile-first design
- Smooth animations
- Professional spacing
- Modern card layout

The interface must look like a real commercial product.

## Header

Display:

- Restaurant logo
- Restaurant name
- Restaurant slogan
- Opening status
- Search bar

Example:

Club des Pains
Fresh Bread • Sandwiches • Fast Food

## Hero Section

Beautiful banner image.

Display:

- Restaurant name
- Description
- Service information

## Categories

Create category tabs:

- Sandwiches
- Burgers
- Pizzas
- Tacos
- Viennoiseries
- Desserts
- Boissons

Tabs must be sticky while scrolling.

## Product Cards

Each product card must display:

- Product image
- Product name
- Description
- Price
- Category
- Availability badge

Example:

Chicken Tacos

Grilled chicken with cheese and fries.

900 DA

Available

Cards must be modern and visually attractive.

## Product Details Modal

When a customer clicks a product:

Open a beautiful modal displaying:

- Large image
- Description
- Ingredients
- Price
- Availability

## Search Feature

Implement instant search.

Search by:

- Product name
- Category

Results must update live.

## Filters

Allow filtering by:

- Category
- Price range

## Menu Data Source

Store all products inside:

data/menu.json

Example structure:

{
"restaurant": "Club des Pains",
"currency": "DA",
"categories": [
{
"id": 1,
"name": "Sandwiches"
}
],
"products": [
{
"id": 1,
"name": "Chicken Sandwich",
"description": "Fresh bread with grilled chicken",
"price": 750,
"category": "Sandwiches",
"image": "assets/products/chicken.jpg",
"available": true
}
]
}

All menu rendering must be dynamic from JSON.

No hardcoded products.

## QR Code Integration

Support URLs such as:

?table=1
?table=2
?table=3

Example:

https://restaurant.github.io/?table=5

Display:

Table #5

at the top of the menu.

## Performance

Optimize for:

- Mobile devices
- Slow connections
- Low-end Android phones

Requirements:

- Fast loading
- Lazy-loaded images
- Minified assets
- Lightweight code

## SEO

Include:

- Meta tags
- Open Graph tags
- Structured data

## Accessibility

Implement:

- Keyboard navigation
- Proper ARIA labels
- Accessible color contrast

## Sample Content

Generate realistic content for:

- 10 sandwiches
- 10 burgers
- 10 pizzas
- 10 tacos
- 10 desserts
- 10 drinks

Include realistic descriptions and prices in Algerian Dinar (DA).

## Deployment

Provide:

1. Complete source code
2. GitHub Pages deployment instructions
3. Folder structure
4. README.md
5. QR Code generation instructions

## Quality Standards

The final result must:

- Look like a premium restaurant application
- Be production-ready
- Be fully responsive
- Have clean architecture
- Follow modern frontend best practices
- Be maintainable and scalable
- Be suitable for commercial use

Generate all files completely with full code and implementation details.
