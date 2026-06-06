# Google Sheets Setup Guide

## 1. Create the Google Sheet

1. Go to https://sheets.new
2. Create these sheets (tabs) with the exact names:

### Sheet: `settings`

| key             | value                             |
| --------------- | --------------------------------- |
| restaurantName  | Club des Pins                     |
| whatsappNumber  | 213555725285                      |
| phoneNumber     | +213555725285                     |
| address         | Club des Pins, Algiers, Algeria   |
| openingHours    | 11:00 - 23:00                     |
| defaultLanguage | fr                                |
| instagram       | https://instagram.com/clubdespins |
| facebook        | https://facebook.com/clubdespins  |

### Sheet: `categories`

| id  | name_fr       | name_ar     | name_en       |
| --- | ------------- | ----------- | ------------- |
| 1   | Sandwiches    | السندويتشات | Sandwiches    |
| 2   | Burgers       | البرغر      | Burgers       |
| 3   | Pizzas        | البيتزا     | Pizzas        |
| 4   | Tacos         | التاكوس     | Tacos         |
| 5   | Viennoiseries | الفينوايسري | Viennoiseries |
| 6   | Desserts      | الحلويات    | Desserts      |
| 7   | Boissons      | المشروبات   | Drinks        |

### Sheet: `menu`

| id  | category | name_fr      | name_ar      | name_en       | description_fr                       | description_ar              | description_en                        | price | image                           | available | ingredients_fr                 | ingredients_ar         | ingredients_en                 | promo_price | is_promo | stock |
| --- | -------- | ------------ | ------------ | ------------- | ------------------------------------ | --------------------------- | ------------------------------------- | ----- | ------------------------------- | --------- | ------------------------------ | ---------------------- | ------------------------------ | ----------- | -------- | ----- |
| 1   | Tacos    | Tacos Poulet | تاكوس الدجاج | Chicken Tacos | Poulet grillé avec fromage et frites | دجاج مشوي مع الجبن والبطاطا | Grilled chicken with cheese and fries | 900   | https://images.unsplash.com/... | TRUE      | Poulet grillé, fromage, frites | دجاج مشوي, جبنة, بطاطا | Grilled chicken, cheese, fries | 700         | TRUE     | 25    |
| ... | ...      | ...          | ...          | ...           | ...                                  | ...                         | ...                                   | ...   | ...                             | ...       | ...                            | ...                    | ...                            | ...         | ...      | ...   |

### Sheet: `packs`

| id  | name_fr         | name_ar         | name_en     | description_fr            | description_ar      | description_en          | price | image                           | items                                                | available |
| --- | --------------- | --------------- | ----------- | ------------------------- | ------------------- | ----------------------- | ----- | ------------------------------- | ---------------------------------------------------- | --------- |
| 1   | Menu Économique | العرض الاقتصادي | Budget Meal | 2 Sandwiches + 2 Boissons | 2 سندويتش + 2 مشروب | 2 Sandwiches + 2 Drinks | 1800  | https://images.unsplash.com/... | Tacos Poulet, Sandwich Club, Jus d'Orange, Coca-Cola | TRUE      |

### Sheet: `promos`

| id  | title_fr        | title_ar   | title_en     | description_fr          | description_ar         | description_en    | image       | type       | value | active |
| --- | --------------- | ---------- | ------------ | ----------------------- | ---------------------- | ----------------- | ----------- | ---------- | ----- | ------ |
| 1   | Promo Printemps | عرض الربيع | Spring Offer | -20% sur tous les Tacos | 20% خصم على كل التاكوس | 20% off all Tacos | https://... | percentage | 20    | TRUE   |

### Sheet: `translations`

| key     | fr                                      | ar                             | en                              |
| ------- | --------------------------------------- | ------------------------------ | ------------------------------- |
| welcome | Bienvenue chez Restaurant Club des Pins | مرحبا بكم في مطعم نادي الصنوبر | Welcome to Pine Club Restaurant |
| ...     | ...                                     | ...                            | ...                             |

## 2. Publish the Sheet

1. Go to **File → Share → Publish to web**
2. Choose **"Entire Document"** and **"Web page"**
3. Click **Publish**
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/{THIS_IS_YOUR_SHEET_ID}/edit`

## 3. Configure the App

In `data/settings.json`, update:

```json
{
  "googleSheetsEnabled": true,
  "googleSheetsId": "YOUR_SHEET_ID_HERE",
  ...
}
```

The app will automatically load data from Google Sheets.
If fetching fails, it falls back to the local `menu.json`.

## How it works

The app uses the Google Visualization API (no backend needed):

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={NAME}
```

- Data is cached in `localStorage` for performance
- Click the **🔄 Sync** button to refresh from Google Sheets
- Inventory, promos, and packs update in real-time after sync
