# QR Codes

Place your generated QR codes in this directory.

## How to Generate QR Codes

1. Use any QR code generator (like [QRCode Monkey](https://www.qrcode-monkey.com/) or [QRickit](https://qrickit.com/))
2. Generate QR codes for each table with URLs like:
   - https://yourusername.github.io/menu-restaurant/?table=1
   - https://yourusername.github.io/menu-restaurant/?table=2
   - https://yourusername.github.io/menu-restaurant/?table=3
3. Download and print the QR codes
4. Place them on your restaurant tables

The QR menu system will automatically detect the table number from the URL parameter and display it in the header.

## Example
If a customer scans a QR code for table 5, they will be directed to:
`https://yourusername.github.io/menu-restaurant/?table=5`

And they will see "Table #5" displayed at the top of the menu.