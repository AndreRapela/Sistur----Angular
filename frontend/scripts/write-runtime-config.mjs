import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(projectRoot, 'public', 'runtime-config.js');
const apiUrl = (process.env.SISTUR_API_URL || '').trim();
const googleMapsApiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
const supportEmail = (process.env.SISTUR_SUPPORT_EMAIL || '').trim();
const supportPhone = (process.env.SISTUR_SUPPORT_PHONE || '').trim();
const supportWhatsapp = (process.env.SISTUR_SUPPORT_WHATSAPP || '').trim();
const publicAppUrl = (process.env.SISTUR_PUBLIC_APP_URL || '').trim();

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `window.SISTUR_CONFIG = Object.freeze(${JSON.stringify({
    apiUrl,
    googleMapsApiKey,
    supportEmail,
    supportPhone,
    supportWhatsapp,
    publicAppUrl
  })});\n`,
  'utf8'
);

console.log(`Runtime config generated (${googleMapsApiKey ? 'Google Maps enabled' : 'Google Maps fallback enabled'}).`);
