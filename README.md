# Abbosov Avenue — sayt

Erkaklar kiyimi butiki (Toshkent, Iftixor 1A) uchun statik sayt. Build kerak emas — `index.html` ni istalgan hostingga (GitHub Pages, cPanel) yuklang.

## Tuzilma
- `index.html` — sahifa
- `css/style.css` — dizayn (minimal: ko'mir, qog'oz-kulrang, latun)
- `js/data.js` — **sozlamalar va katalog** (telefon, Telegram, narxlar, mahsulotlar)
- `js/i18n.js` — RU / UZ matnlar
- `js/app.js` — mantiq: katalog, savat, garderob konstruktori, yozilish, vakansiya, reels
- `js/ring3d.js` — 3D lookbook (Three.js CDN orqali; WebGL bo'lmasa oddiy lenta)
- `img/` — brendning Instagram'idagi suratlar (`*.jpg` 1500px, `*-sm.jpg` 640px)
- `media/` — Instagram reels videolari (mp4, 720p)

## Formalar
`js/data.js` dagi `ORDER_ENDPOINT` bo'sh bo'lsa: buyurtma matni nusxalanadi va Telegram ochiladi.
URL berilsa (Google Apps Script, Telegram-bot backend) — JSON `POST` qilinadi:
`{ kind: "order" | "fitting" | "job" | "stylist", lang, text, name, phone, ... }`.
Bot tokenini hech qachon frontendga yozmang.

## Topshirishdan oldin
- `<meta name="robots" content="noindex">` va footer'dagi "Концепт-дизайн" yozuvini olib tashlang
- `price: null` bo'lgan mahsulotlar narxini brenddan oling (Instagram'da yozilmagan)
- Poyabzal o'lchamlari (40–45) va o'lcham jadvali (`guide.cloth`) taxminiy — brend bilan tekshiring
- Media brendning Instagram'idan olingan — saytni ommaga chiqarishdan oldin brend roziligi kerak
