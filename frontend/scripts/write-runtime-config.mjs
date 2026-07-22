import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(projectRoot, 'public', 'runtime-config.js');
const googleMapsApiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim();

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `window.SISTUR_CONFIG = Object.freeze(${JSON.stringify({ googleMapsApiKey })});\n`,
  'utf8'
);

console.log(`Runtime config generated (${googleMapsApiKey ? 'Google Maps enabled' : 'Google Maps fallback enabled'}).`);
