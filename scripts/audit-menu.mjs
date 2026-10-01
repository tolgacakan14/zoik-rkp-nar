import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const menu = JSON.parse(fs.readFileSync(path.join(root, 'data/menu.json'), 'utf8'));
const presentation = fs.readFileSync(path.join(root, 'data/productPresentation.ts'), 'utf8');
const hookah = fs.readFileSync(path.join(root, 'data/hookah.ts'), 'utf8');
const failures = [];
const items = menu.groups.flatMap((group) => group.items.map((item) => ({ ...item, category: group.category })));
const ids = new Set();

if (menu.groups.length !== 16) failures.push(`Kategori sayısı 16 yerine ${menu.groups.length}.`);
if (items.length !== 76) failures.push(`Ürün sayısı 76 yerine ${items.length}.`);

for (const item of items) {
  if (!item.id || !item.name) failures.push(`Kimliği veya adı eksik ürün: ${JSON.stringify(item)}`);
  if (!Number.isFinite(item.price) || item.price <= 0) failures.push(`Geçersiz fiyat: ${item.name} (${item.price})`);
  if (ids.has(item.id)) failures.push(`Yinelenen ürün kodu: ${item.id}`);
  ids.add(item.id);
  if (item.image?.startsWith('/')) {
    const localPath = path.join(root, 'public', item.image.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) failures.push(`Eksik yerel görsel: ${item.name} → ${item.image}`);
  }
}

const pairingIds = [...presentation.matchAll(/productId:\s*'([^']+)'/g)].map((match) => match[1]);
for (const id of pairingIds) if (!ids.has(id)) failures.push(`Öneri hedefi menüde yok: ${id}`);
for (const group of menu.groups) {
  if (!presentation.includes(`'${group.category}': [`)) failures.push(`Öneri listesi eksik kategori: ${group.category}`);
}

const flavorIds = [...hookah.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((match) => match[1]);
if (flavorIds.length !== 25) failures.push(`Nargile aroma sayısı 25 yerine ${flavorIds.length}.`);
if (new Set(flavorIds).size !== flavorIds.length) failures.push('Nargile aroma kodlarında tekrar var.');

if (failures.length) {
  console.error(`Menü denetimi başarısız (${failures.length} sorun):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const remoteImages = items.filter((item) => /^https?:\/\//.test(item.image || '')).length;
const placeholders = items.filter((item) => !item.image).length;
console.log(`Menü denetimi geçti: ${menu.groups.length} kategori, ${items.length} ürün, ${flavorIds.length} aroma.`);
console.log(`Görseller: ${remoteImages} uzak, ${items.length - remoteImages - placeholders} yerel, ${placeholders} tasarımlı yer tutucu.`);
console.log(`Öneri hedefleri: ${pairingIds.length} geçerli bağlantı.`);
