/* ==========================================================
   ABBOSOV AVENUE — sozlamalar va katalog
   Ma'lumotlar brendning Instagram sahifasidan olingan (2026-11).
   price: null — narx Instagram'da ko'rsatilmagan ("narxini so'rang").
   ========================================================== */

window.AA_CONFIG = {
  phone: "+998 33 017 17 13",
  phoneHref: "tel:+998330171713",
  telegram: "https://t.me/abbosovavenue",       // kanal
  manager: "https://t.me/abbosov_avhelp",       // buyurtmalar uchun menejer
  managerHandle: "@abbosov_avhelp",
  instagram: "https://instagram.com/abbosovavenue",
  hours: { open: 10, close: 22 },
  fittingSlots: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  // Formalarni serverga yuborish (ixtiyoriy): Google Apps Script yoki bot backend URL.
  // Bo'sh bo'lsa — matn nusxalanadi va menejer Telegram'i ochiladi.
  ORDER_ENDPOINT: "",
  currency: { ru: "сум", uz: "so'm" }
};

const CLOTH = ["M", "L", "XL", "2XL", "3XL"];
const SHOES = ["40", "41", "42", "43", "44", "45"];

/* cat: suits | jackets | knit | outer | shoes */
window.AA_PRODUCTS = [
  {
    id: "suit-brown", cat: "suits", img: "img/suit-brown", price: 1790000, isNew: true,
    name: { ru: "Двойка, шоколад", uz: "Ikkilik, shokolad rang" },
    desc: {
      ru: "Пиджак и брюки свободной посадки. Носится с трикотажем вместо сорочки — «в простоте настоящая солидность».",
      uz: "Erkin bichimli pidjak va shim. Ko'ylak o'rniga trikotaj bilan kiyiladi — «soddalikda haqiqiy salobat»."
    },
    sizes: CLOTH
  },
  {
    id: "suit-olive", cat: "suits", img: "img/suit-olive", price: null, isNew: true, video: "media/travel-suit.mp4",
    name: { ru: "Двойка дорожная, олива", uz: "Safar ikkiligi, zaytun rang" },
    desc: {
      ru: "Двойка для командировок: держит форму в дороге, работает и на встрече, и в аэропорту.",
      uz: "Xizmat safari uchun ikkilik: yo'lda shaklini saqlaydi, uchrashuvda ham, aeroportda ham mos."
    },
    sizes: CLOTH
  },
  {
    id: "blazer-navy", cat: "jackets", img: "img/blazer-navy", price: null, video: "media/look-two.mp4",
    name: { ru: "Пиджак без подкладки, тёмно-синий", uz: "Astarsiz pidjak, to'q ko'k" },
    desc: {
      ru: "Мягкое плечо, накладные карманы. С серыми брюками и водолазкой — готовый образ на каждый день.",
      uz: "Yumshoq yelka, ustki cho'ntaklar. Kulrang shim va bodlon bilan — har kungi tayyor obraz."
    },
    sizes: CLOTH
  },
  {
    id: "jacket-beige", cat: "jackets", img: "img/jacket-beige", price: null,
    name: { ru: "Пиджак-рубашка, бежевый", uz: "Pidjak-ko'ylak, bej" },
    desc: {
      ru: "Лёгкий пиджак без лишних деталей — классика, которая долго сохраняет вид.",
      uz: "Ortiqcha detallarsiz yengil pidjak — uzoq vaqt ko'rinishini saqlaydigan klassika."
    },
    sizes: CLOTH
  },
  {
    id: "knit-polo", cat: "knit", img: "img/knit-polo", price: 690000, video: "media/knit.mp4",
    name: { ru: "Свитер-поло, серый меланж", uz: "Polo-sviter, kulrang melanj" },
    desc: {
      ru: "Минималистичный дизайн и фактурный узор. С классическими брюками и с джинсами.",
      uz: "Minimalistik dizayn va o'ziga xos naqsh. Klassik shim va jinsi bilan bemalol uyg'unlashadi."
    },
    sizes: CLOTH
  },
  {
    id: "tee-black", cat: "knit", img: "img/tee-black", price: null,
    name: { ru: "Футболка базовая, чёрная", uz: "Bazaviy futbolka, qora" },
    desc: {
      ru: "Плотный хлопок, ровная посадка по плечу. Основа гардероба под пиджак.",
      uz: "Zich paxta, yelkaga tekis o'tiradi. Pidjak ostiga garderob asosi."
    },
    sizes: CLOTH
  },
  {
    id: "tees-set", cat: "knit", img: "img/tees-rack", price: null, video: "media/wardrobe.mp4",
    name: { ru: "Футболки базовые, пять цветов", uz: "Bazaviy futbolkalar, besh rang" },
    desc: {
      ru: "Тёмно-синий, белый, терракота, графит, бордо. Вещи для качественного повседневного гардероба.",
      uz: "To'q ko'k, oq, terrakota, grafit, bordo. Sifatli kundalik garderob uchun tanlangan kiyimlar."
    },
    sizes: CLOTH
  },
  {
    id: "denim-overshirt", cat: "outer", img: "img/denim-overshirt", price: 2400000, isNew: true, video: "media/fw-denim.mp4",
    name: { ru: "Джинсовая рубашка-куртка F/W ’26", uz: "Jinsi ko'ylak-kurtka F/W ’26" },
    desc: {
      ru: "Новая коллекция осень–зима. Плотный тёмный деним, металлическая фурнитура.",
      uz: "Kuz–qish yangi kolleksiyasi. Zich to'q denim, metall furnitura."
    },
    sizes: ["M", "L", "2XL", "3XL"]
  },
  {
    id: "puffer", cat: "outer", img: "img/puffer", price: null, isNew: true,
    name: { ru: "Пуховик матовый, тёмно-синий", uz: "Pufer kurtka, to'q ko'k" },
    desc: {
      ru: "F/W ’26/27. Короткий, без лишнего объёма — надевается поверх пиджака.",
      uz: "F/W ’26/27. Kalta, ortiqcha hajmsiz — pidjak ustidan kiyiladi."
    },
    sizes: CLOTH
  },
  {
    id: "sneaker-navy", cat: "shoes", img: "img/sneaker-navy", price: null,
    name: { ru: "Кеды кожаные, тёмно-синие", uz: "Charm kedlar, to'q ko'k" },
    desc: {
      ru: "Гладкая кожа, светлая каучуковая подошва. С пиджаком и с джинсами.",
      uz: "Silliq charm, och rangli kauchuk taglik. Pidjak va jinsi bilan."
    },
    sizes: SHOES
  },
  {
    id: "sneaker-brown", cat: "shoes", img: "img/sneaker-brown", price: 2400000,
    name: { ru: "Кроссовки, замша и шерсть", uz: "Krossovka, zamsh va jun" },
    desc: {
      ru: "Коричневая замша со вставками из шерсти. Пара к шоколадной двойке.",
      uz: "Jun qo'shimchali jigarrang zamsh. Shokolad ikkilik bilan juft."
    },
    sizes: SHOES
  },
  {
    id: "sneaker-grey", cat: "shoes", img: "img/sneaker-grey", price: null,
    name: { ru: "Кроссовки замшевые, серые", uz: "Zamsh krossovka, kulrang" },
    desc: {
      ru: "Мягкая серая замша и рельефная подошва. На каждый день.",
      uz: "Yumshoq kulrang zamsh va relyefli taglik. Har kun uchun."
    },
    sizes: SHOES
  }
];
