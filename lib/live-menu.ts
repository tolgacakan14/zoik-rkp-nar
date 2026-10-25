import fallbackMenu from '@/data/menu.json';
import { hookahFlavors as fallbackHookah, type HookahFlavor } from '@/data/hookah';
import goposSync from '@/data/gopos-prices.json';

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
const safeImageUrl = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost') ? value : '';
  } catch {
    return '';
  }
};

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
  const normalize = (value: string) => value.toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
  const sheetRows = rows.map(row => ({ row, id: get(row, 'ürün_kodu'), key: normalize(get(row, 'ürün_adı')) }));
  const byId = new Map(sheetRows.filter(entry => entry.id).map(entry => [entry.id, entry.row]));
  const byName = new Map(sheetRows.filter(entry => entry.key).map(entry => [entry.key, entry.row]));
  const groups = new Map<string, LiveMenuGroup & { order: number }>();

  // GoPOS-synced localMenu owns the visible inventory. Sheets enriches those
  // products but cannot resurrect a product hidden or removed in GoPOS.
  for (const [groupIndex, fallbackGroup] of localMenu.groups.entries()) {
    const items: Array<LiveMenuItem & { order: number }> = [];
    for (const [itemIndex, fallback] of fallbackGroup.items.entries()) {
      const row = byId.get(fallback.id) || byName.get(normalize(fallback.name));
      const visibility = row ? status(get(row, 'durum')) : 'aktif';
      if (visibility === 'gizli') continue;
      const stockText = row ? get(row, 'stok_adedi') : '';
      const stock = stockText === '' ? null : numeric(stockText, 0);
      const sheetImage = row ? safeImageUrl(get(row, 'görsel_url')) : '';
      items.push({
        ...fallback,
        name: row ? get(row, 'ürün_adı') || fallback.name : fallback.name,
        price: Number((goposSync.products as Record<string, number>)[fallback.id]) || (row ? numeric(get(row, 'fiyat'), fallback.price) : fallback.price),
        description: row ? get(row, 'açıklama') || fallback.description : fallback.description,
        image: sheetImage && !sheetImage.includes('img.gopos.com.tr') ? sheetImage : fallback.image || sheetImage || null,
        soldOut: visibility === 'tükendi' || stock === 0,
        character: row ? get(row, 'karakter') || undefined : undefined,
        intensity: row ? Math.min(4, Math.max(1, numeric(get(row, 'yoğunluk'), 2))) : undefined,
        pairingProductId: row ? get(row, 'önerilen_ürün_kodu') || undefined : undefined,
        pairingNote: row ? get(row, 'öneri_notu') || undefined : undefined,
        order: row ? numeric(get(row, 'ürün_sırası'), itemIndex + 1) : itemIndex + 1,
      });
    }
    if (!items.length) continue;
    const representative = items.map(item => byId.get(item.id) || byName.get(normalize(item.name))).find(Boolean);
    groups.set(fallbackGroup.category, {
      category: fallbackGroup.category,
      section: representative ? get(representative, 'bölüm') || fallbackGroup.section : fallbackGroup.section,
      order: representative ? numeric(get(representative, 'kategori_sırası'), groupIndex + 1) : groupIndex + 1,
      items,
    });
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
    ...(goposSync.settings as Partial<LiveSettings>),
  };
}
