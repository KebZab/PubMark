// Explicit maintenance command. Not run by the app or build.
// PSGC Cloud v2 failed validation; use a pinned PSA-publication mirror.
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const revision = 'f4c7e1ffd7ba4eb3bf216544a5022ce7c7771362';
const source = `https://raw.githubusercontent.com/alkevintan/psgc-rb/${revision}`;
const hashes = {};
async function download(name) {
  const response = await fetch(`${source}/${name}`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const text = await response.text();
  hashes[name] = createHash('sha256').update(text).digest('hex');
  return text;
}
const [provinceText, cityText, barangayText, license] = await Promise.all(
  ['data/provinces.json', 'data/cities_municipalities.json', 'data/barangays.json', 'LICENSE'].map(download),
);
const provinces = JSON.parse(provinceText);
const rawCities = JSON.parse(cityText);
const rawBarangays = JSON.parse(barangayText);
assert.equal(provinces.length, 82);
assert.equal(rawBarangays.length, 42010);
// Use full PSGC codes, not this mirror's truncated foreign-key fields.
const provinceMap = new Map(provinces.map(p => [p.code, p]));
const areas = provinces.map(p => ({ code: p.code, name: p.name.trim(), kind: 'province' }));
areas.push({ code: 'NCR', name: 'Metro Manila (NCR)', kind: 'region' });
areas.push({ code: 'SGA', name: 'Special Geographic Area (BARMM)', kind: 'special-area' });
const cities = [];
for (const city of rawCities) {
  // Manila sub-municipalities are not separate cities. Expose their barangays under Manila.
  if (city.code.startsWith('13806') && city.code !== '1380600000') continue;
  const provinceCode = `${city.code.slice(0, 5)}00000`;
  let areaCode;
  if (city.code.startsWith('13')) areaCode = 'NCR';
  else if (city.code.startsWith('19999')) areaCode = 'SGA';
  else if (provinceMap.has(provinceCode)) areaCode = provinceCode;
  else {
    areaCode = `city-${city.code}`;
    // Isabela is a component city listed separately under Region IX, not a HUC.
    const separateArea = city.code === '0990101000';
    areas.push({ code: areaCode, name: `${city.name.trim()} (${separateArea ? 'Separate area' : 'Independent city'})`, kind: separateArea ? 'city-area' : 'independent-city' });
  }
  cities.push({ code: city.code, name: city.name.trim(), areaCode });
}
const cityMap = new Map(cities.map(c => [c.code, c]));
const barangays = rawBarangays.map(b => {
  const parent = b.code.startsWith('13806') ? '1380600000' : `${b.code.slice(0, 7)}000`;
  assert(cityMap.has(parent), `Orphan barangay ${b.code}: ${parent}`);
  return [b.code, b.name.trim(), parent];
});
assert.equal(cities.length, 1642);
for (const entries of [areas.map(x => x.code), cities.map(x => x.code), barangays.map(x => x[0])]) assert.equal(new Set(entries).size, entries.length);
for (const city of cities) assert(barangays.some(b => b[2] === city.code), `No barangays for ${city.name}`);
const metadata = {
  schemaVersion: 1, publication: 'PSA PSGC 1Q 2026 (31 March 2026)',
  retrievedAt: new Date().toISOString(), source, revision,
  authority: 'https://psa.gov.ph/classification/psgc', hashes,
  counts: { provinces: provinces.length, citiesMunicipalities: cities.length, barangays: barangays.length },
};
const destination = new URL('../mobile/src/shared/', import.meta.url);
await writeFile(new URL('philippine-address-data.json', destination), JSON.stringify({ metadata, areas, cities, barangays }) + '\n');
await writeFile(new URL('PSGC-LICENSE.txt', destination), license);
console.log('Generated bundled PSGC snapshot:', metadata.counts);
