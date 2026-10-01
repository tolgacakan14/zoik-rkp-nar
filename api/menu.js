const spreadsheetId = '1TZL5VfTyn5ysH1DGdNKimF7F2lkkZHAK2OQD3LV7GKk';
const csvUrl = sheet => `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

export default async function handler(_request, response) {
  try {
    const names = ['Menü', 'Nargile', 'Ayarlar'];
    const results = await Promise.all(names.map(async name => {
      const result = await fetch(csvUrl(name), { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      if (!result.ok) throw new Error(`${name}: Google Sheets ${result.status}`);
      const text = await result.text();
      if (!text.includes(',')) throw new Error(`${name}: geçersiz CSV`);
      return text;
    }));
    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
    response.status(200).json({ source: 'google-sheets', menuCsv: results[0], hookahCsv: results[1], settingsCsv: results[2] });
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(503).json({ source: 'local-fallback', error: error instanceof Error ? error.message : 'Google Sheets okunamadı' });
  }
}
