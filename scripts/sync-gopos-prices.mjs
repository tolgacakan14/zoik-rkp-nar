import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const source = 'https://zoikirkpinar.gopos.com.tr/web-qr-menu';
const menuPath = new URL('../data/menu.json', import.meta.url);
const pricesPath = new URL('../data/gopos-prices.json', import.meta.url);
const normalize = value => value.toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
const parsePrice = value => {
  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};
const mode = values => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0];
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
  })));
  if (scraped.length < 60) throw new Error(`GoPOS eksik yüklendi: ${scraped.length} ürün`);
  const rows = scraped.map(row => ({ ...row, key: normalize(row.name), price: parsePrice(row.priceText) })).filter(row => row.name && row.price !== null);
  const byName = new Map();
  for (const row of rows) if (!byName.has(row.key)) byName.set(row.key, row);

  const menu = JSON.parse(await fs.readFile(menuPath, 'utf8'));
  const products = {};
  const missing = [];
  for (const group of menu.groups) for (const item of group.items) {
    const match = byName.get(normalize(item.name));
    if (!match) { missing.push(`${group.category} / ${item.name}`); continue; }
    item.price = match.price;
    products[item.id] = match.price;
  }
  if (Object.keys(products).length < 70) throw new Error(`GoPOS eşleşmesi yetersiz: ${Object.keys(products).length}/76\n${missing.join('\n')}`);

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
  const previous = JSON.parse(await fs.readFile(pricesPath, 'utf8'));
  const unchanged = JSON.stringify(previous.products || {}) === JSON.stringify(products)
    && JSON.stringify(previous.settings || {}) === JSON.stringify(settings);
  if (unchanged) {
    console.log(`GoPOS fiyat değişikliği yok: ${Object.keys(products).length} ürün doğrulandı.`);
    process.exitCode = 0;
  } else {
  await fs.writeFile(menuPath, `${JSON.stringify(menu, null, 2)}\n`);
  await fs.writeFile(pricesPath, `${JSON.stringify({ source, syncedAt: new Date().toISOString(), products, settings }, null, 2)}\n`);
  console.log(`GoPOS senkronu tamamlandı: ${Object.keys(products).length} ürün, ${rows.length} fiyat satırı.`);
  }
} finally {
  await browser.close();
}
