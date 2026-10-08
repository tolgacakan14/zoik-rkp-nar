import fallbackMenu from '@/data/menu.json';
import { hookahFlavors as fallbackHookah, type HookahFlavor } from '@/data/hookah';

export type LiveMenuItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string | null;
  soldOut?: boolean;
  character?: string;
  intensity?: number;
  pairingProductId?: string;
  pairingNote?: string;
};

export type LiveMenuGroup = { category: string; section?: string; items: LiveMenuItem[] };
export type LiveMenu = { source: string; retrievedAt: string; groups: LiveMenuGroup[] };
export type LiveSettings = {
  classicPrice: number;
  darkPrice: number;
  headChange: number;
  iceHose: number;
  maxAromas: number;
};

export const defaultSettings: LiveSettings = { classicPrice: 580, darkPrice: 650, headChange: 450, iceHose: 75, maxAromas: 2 };
export const localMenu = fallbackMenu as LiveMenu;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += char;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(candidate => candidate.some(cell => cell.trim()));
}

const numeric = (value: string, fallback: number) => {
  const parsed = Number(value.trim().replace(/\s/g, '').replace('₺', '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const status = (value: string) => value.trim().toLocaleLowerCase('tr-TR');

function reader(csv: string) {
  const [headerRow, ...rows] = parseCsv(csv);
  if (!headerRow) throw new Error('Boş Google Sheets verisi.');
  const headers = headerRow.map(value => value.trim().toLocaleLowerCase('tr-TR'));
  const get = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? '';
  return { headers, rows, get };
}

export function menuFromCsv(csv: string): LiveMenu {
  const { headers, rows, get } = reader(csv);
  for (const key of ['kategori_adı', 'ürün_kodu', 'ürün_adı', 'fiyat', 'durum']) {
    if (!headers.includes(key)) throw new Error(`Menü tablosunda eksik sütun: ${key}`);
  }
  const groups = new Map<string, LiveMenuGroup & { order: number }>();
  for (const row of rows) {
    const visibility = status(get(row, 'durum'));
    if (visibility === 'gizli') continue;
    const category = get(row, 'kategori_adı');
    const id = get(row, 'ürün_kodu');
    const name = get(row, 'ürün_adı');
    if (!category || !id || !name) continue;
    const fallbackGroup = localMenu.groups.find(group => group.category === category);
    const fallback = fallbackGroup?.items.find(item => item.id === id);
    if (!groups.has(category)) groups.set(category, {
      category,
      section: get(row, 'bölüm') || undefined,
      order: numeric(get(row, 'kategori_sırası'), localMenu.groups.findIndex(group => group.category === category) + 1),
      items: [],
    });
    const stockText = get(row, 'stok_adedi');
    const stock = stockText === '' ? null : numeric(stockText, 0);
    const sheetImage = get(row, 'görsel_url');
    const image = sheetImage && !sheetImage.includes('img.gopos.com.tr') ? sheetImage : fallback?.image || sheetImage || null;
    groups.get(category)!.items.push({
      id,
      name,
      price: numeric(get(row, 'fiyat'), fallback?.price ?? 0),
      description: get(row, 'açıklama') || fallback?.description || '',
      image,
      soldOut: visibility === 'tükendi' || stock === 0,
      character: get(row, 'karakter') || undefined,
      intensity: Math.min(4, Math.max(1, numeric(get(row, 'yoğunluk'), 2))),
      pairingProductId: get(row, 'önerilen_ürün_kodu') || undefined,
      pairingNote: get(row, 'öneri_notu') || undefined,
      order: numeric(get(row, 'ürün_sırası'), (fallbackGroup?.items.findIndex(item => item.id === id) ?? 0) + 1),
    } as LiveMenuItem & { order: number });
  }
  return {
    source: 'google-sheets',
    retrievedAt: new Date().toISOString(),
    groups: [...groups.values()].sort((a, b) => a.order - b.order).map(({ order: _order, ...group }) => ({
      ...group,
      items: (group.items as Array<LiveMenuItem & { order: number }>).sort((a, b) => a.order - b.order).map(({ order: _itemOrder, ...item }) => item),
    })),
  };
}

export function hookahFromCsv(csv: string): HookahFlavor[] {
  const { headers, rows, get } = reader(csv);
  for (const key of ['seri', 'ürün_kodu', 'ürün_adı', 'fiyat', 'durum']) {
    if (!headers.includes(key)) throw new Error(`Nargile tablosunda eksik sütun: ${key}`);
  }
  return rows.filter(row => status(get(row, 'durum')) !== 'gizli').map((row, index) => {
    const id = get(row, 'ürün_kodu');
    const fallback = fallbackHookah.find(flavor => flavor.id === id);
    const line = status(get(row, 'seri')) === 'dark' ? 'dark' : 'classic';
    const color = /^#[0-9a-f]{6}$/i.test(get(row, 'renk')) ? get(row, 'renk') : fallback?.color || '#6f8980';
    return {
      id: id || `aroma-${index + 1}`,
      name: get(row, 'ürün_adı') || fallback?.name || `Aroma ${index + 1}`,
      line,
      price: numeric(get(row, 'fiyat'), fallback?.price ?? (line === 'dark' ? 650 : 580)),
      color,
      tags: (get(row, 'etiketler') || fallback?.tags.join(' · ') || '').split(/[·,;]/).map(value => value.trim()).filter(Boolean),
      note: get(row, 'açıklama') || fallback?.note || '',
      soldOut: status(get(row, 'durum')) === 'tükendi',
      order: numeric(get(row, 'sıra'), index + 1),
    } as HookahFlavor & { soldOut?: boolean; order: number };
  }).sort((a, b) => a.order - b.order).map(({ order: _order, ...flavor }) => flavor as HookahFlavor);
}

export function settingsFromCsv(csv: string): LiveSettings {
  const { rows, get } = reader(csv);
  const values = new Map(rows.map(row => [get(row, 'ayar_kodu'), numeric(get(row, 'değer'), 0)]));
  return {
    classicPrice: values.get('klasik_fiyat') || defaultSettings.classicPrice,
    darkPrice: values.get('dark_fiyat') || defaultSettings.darkPrice,
    headChange: values.get('kafa_degisim') || defaultSettings.headChange,
    iceHose: values.get('buzlu_marpuc') || defaultSettings.iceHose,
    maxAromas: Math.min(2, Math.max(1, values.get('maks_aroma') || defaultSettings.maxAromas)),
  };
}
