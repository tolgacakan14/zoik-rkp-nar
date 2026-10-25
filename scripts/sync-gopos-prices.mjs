import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const source = 'https://zoikirkpinar.gopos.com.tr/web-qr-menu';
const menuPath = new URL('../data/menu.json', import.meta.url);
const pricesPath = new URL('../data/gopos-prices.json', import.meta.url);
const MIN_PRICE = 1;
const MAX_PRICE = 10_000;
const normalize = value => value.toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = value => normalize(value).replace(/\s+/g, '-');
const parsePrice = value => {
  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= MIN_PRICE && parsed <= MAX_PRICE ? parsed : null;
};
const mode = values => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0];
};

const categories = {
  'espresso-bar': { title: 'Espresso Bar', section: 'İçecekler', order: 10 },
  'zoi-bar': { title: 'Zoi Bar', section: 'İçecekler', order: 20 },
  'ice-bar': { title: 'Ice Bar', section: 'İçecekler', order: 30 },
  matcha: { title: 'Matcha', section: 'İçecekler', order: 40 },
  kokteyl: { title: 'Kokteyl', section: 'İçecekler', order: 50 },
  'frozen--milkshake': { title: 'Frozen & Milkshake', section: 'İçecekler', order: 60 },
  'tea-pot': { title: 'Tea Pot', section: 'İçecekler', order: 70 },
  'soguk-cecekler': { title: 'Soğuk İçecekler', section: 'İçecekler', order: 80 },
  kahvalti: { title: 'Kahvaltı', section: 'Yiyecekler', order: 90 },
  'gurme-sandvic': { title: 'Gurme Sandviç', section: 'Yiyecekler', order: 100 },
  tostlar: { title: 'Tostlar', section: 'Yiyecekler', order: 110 },
  baslangiclar: { title: 'Başlangıçlar', section: 'Yiyecekler', order: 120 },
  'makarna-manti': { title: 'Makarna Mantı', section: 'Yiyecekler', order: 130 },
  tatlilar: { title: 'Tatlılar', section: 'Tatlılar', order: 140 },
  dondurma: { title: 'Dondurma', section: 'Tatlılar', order: 150 },
  'luks-cerez': { title: 'Lüks Çerez', section: 'Diğer', order: 160 },
  sarjmatik: { title: 'Şarjmatik', section: 'Diğer', order: 170 },
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'tr-TR' });
  await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForSelector('.product-card-grid .product-name', { timeout: 90_000 });
  await page.waitForTimeout(2_000);
  const scraped = await page.locator('.product-card-grid').evaluateAll(cards => cards.map(card => ({
    category: card.closest('.category-section')?.id?.replace(/^category-/, '') || '',
    name: card.querySelector('.product-name')?.textContent?.trim() || '',
    priceText: card.querySelector('.product-price')?.textContent?.trim() || '',
    image: card.querySelector('img')?.getAttribute('src') || '',
  })));
  if (scraped.length < 60 || scraped.length > 250) throw new Error(`GoPOS beklenmeyen ürün sayısı: ${scraped.length}`);
  const parsedRows = scraped.map(row => ({ ...row, key: normalize(row.name), price: parsePrice(row.priceText) })).filter(row => row.name && row.price !== null);
  const deduped = new Map();
  for (const row of parsedRows) {
    const key = `${row.category}:${row.key}`;
    const current = deduped.get(key);
    if (!current || (!current.image && row.image)) deduped.set(key, row);
  }
  const rows = [...deduped.values()];
  const regularRows = rows.filter(row => categories[row.category]);
  if (regularRows.length < 50) throw new Error(`GoPOS görünür menü sayısı beklenenden az: ${regularRows.length}`);

  const previousMenu = JSON.parse(await fs.readFile(menuPath, 'utf8'));
  const previousItems = new Map(previousMenu.groups.flatMap(group => group.items.map(item => [normalize(item.name), item])));
  const groups = new Map();
  const products = {};
  for (const row of regularRows) {
    const config = categories[row.category];
    const previous = previousItems.get(row.key);
    const id = previous?.id || `gopos-${row.category}-${slugify(row.name)}`;
    if (!groups.has(config.title)) groups.set(config.title, { category: config.title, section: config.section, order: config.order, items: [] });
    const item = {
      name: row.name,
      price: row.price,
      description: previous?.description || '',
      image: previous?.image || row.image || null,
      id,
    };
    groups.get(config.title).items.push(item);
    products[id] = row.price;
  }

  // Venue-requested products stay visible until the same name appears in GoPOS.
  for (const oldGroup of previousMenu.groups) for (const item of oldGroup.items) {
    if (!item.manual || products[item.id] !== undefined) continue;
    const config = Object.values(categories).find(entry => entry.title === oldGroup.category) || { title: oldGroup.category, section: oldGroup.section || 'Diğer', order: 999 };
    if (!groups.has(config.title)) groups.set(config.title, { category: config.title, section: config.section, order: config.order, items: [] });
    groups.get(config.title).items.push(item);
  }

  const menu = {
    source,
    retrievedAt: new Date().toISOString(),
    groups: [...groups.values()].sort((a, b) => a.order - b.order).map(({ order: _order, ...group }) => group),
  };
  const inCategory = slug => rows.filter(row => row.category === slug);
  const classicRows = inCategory('nargile').filter(row => !['kafa degisimi', 'buzlu marpuc'].includes(row.key));
  const darkRows = inCategory('dark-nargile');
  const headChange = rows.find(row => row.key === 'kafa degisimi')?.price;
  const iceHose = rows.find(row => row.key === 'buzlu marpuc')?.price;
  const settings = {
    classicPrice: mode(classicRows.map(row => row.price)),
    darkPrice: mode(darkRows.map(row => row.price)),
    ...(headChange !== undefined ? { headChange } : {}),
    ...(iceHose !== undefined ? { iceHose } : {}),
  };
  await fs.writeFile(menuPath, `${JSON.stringify(menu, null, 2)}\n`);
  await fs.writeFile(pricesPath, `${JSON.stringify({ source, syncedAt: new Date().toISOString(), products, settings }, null, 2)}\n`);
  console.log(`GoPOS senkronu tamamlandı: ${Object.keys(products).length} görünür menü ürünü, ${rows.length} toplam satır.`);
} finally {
  await browser.close();
}
