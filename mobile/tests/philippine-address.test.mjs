import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/shared/philippine-address-data.json' with { type: 'json' };
import { areas, getCities, getBarangays, emptyAddress, changeAddress, validateAddress, formatAddress, searchPlaces } from '../src/shared/philippine-address.mjs';

const negros = areas.find(a => a.name === 'Negros Occidental');
const murcia = getCities(negros.code).find(c => c.name === 'Murcia');
const barangay = getBarangays(murcia.code).find(b => b.name === 'Abo-abo');
const valid = { areaCode: negros.code, cityCode: murcia.code, barangayCode: barangay.code, street: '  Purok 2  ' };

test('nationwide snapshot has unique codes, complete parents, and expected counts', () => {
  assert.equal(areas.filter(a => a.kind === 'province').length, 82);
  assert.equal(data.cities.length, 1642);
  assert.equal(data.barangays.length, 42010);
  assert.equal(new Set(data.cities.map(c => c.code)).size, data.cities.length);
  assert.equal(new Set(data.barangays.map(b => b[0])).size, data.barangays.length);
  const areaCodes = new Set(areas.map(a => a.code));
  const cityCodes = new Set(data.cities.map(c => c.code));
  for (const c of data.cities) { assert(areaCodes.has(c.areaCode)); assert(getBarangays(c.code).length > 0); }
  for (const [code, name, parent] of data.barangays) { assert.match(code, /^\d{10}$/); assert(name); assert(cityCodes.has(parent)); }
});

test('Murcia has 23 real barangays and produces the existing API address string', () => {
  assert.equal(getBarangays(murcia.code).length, 23);
  assert.deepEqual(validateAddress(valid), {});
  assert.equal(formatAddress(valid), 'Purok 2, Abo-abo, Murcia, Negros Occidental');
  assert.equal(formatAddress({ ...valid, street: '' }), 'Abo-abo, Murcia, Negros Occidental');
});

test('dependent changes clear stale selections and preserve street details', () => {
  assert.deepEqual(changeAddress(valid, 'areaCode', 'NCR'), { ...valid, areaCode: 'NCR', cityCode: '', barangayCode: '' });
  assert.deepEqual(changeAddress(valid, 'cityCode', 'other'), { ...valid, cityCode: 'other', barangayCode: '' });
  assert.equal(Object.keys(validateAddress(emptyAddress())).length, 3);
  assert(validateAddress({ ...valid, areaCode: 'NCR' }).cityCode);
  assert(validateAddress({ ...valid, barangayCode: 'unknown' }).barangayCode);
  assert.equal(formatAddress({ ...valid, areaCode: 'NCR' }), '');
});

test('NCR includes all 17 cities/municipalities and Manila includes all 897 barangays', () => {
  const ncr = getCities('NCR');
  assert.equal(ncr.length, 17);
  const manila = ncr.find(c => c.name === 'City of Manila');
  assert.equal(getBarangays(manila.code).length, 897);
  const first = getBarangays(manila.code)[0];
  assert.equal(formatAddress({ areaCode: 'NCR', cityCode: manila.code, barangayCode: first.code, street: '' }), `${first.name}, City of Manila, Metro Manila (NCR)`);
});

test('independent city addresses do not repeat the city or invent a province', () => {
  const area = areas.find(a => a.name === 'City of Bacolod (Independent city)');
  assert.equal(area.kind, 'independent-city');
  const city = getCities(area.code)[0];
  const b = getBarangays(city.code)[0];
  assert.equal(formatAddress({ areaCode: area.code, cityCode: city.code, barangayCode: b.code, street: '' }), `${b.name}, City of Bacolod`);
});

test('BARMM special-area municipalities and Isabela are not mislabeled independent cities', () => {
  assert.equal(getCities('SGA').length, 8);
  assert(getCities('SGA').some(c => c.name === 'Kapalawan'));
  const isabela = areas.find(a => a.name === 'City of Isabela (Separate area)');
  assert.equal(isabela.kind, 'city-area');
  assert.equal(getCities(isabela.code).length, 1);
});

test('search handles accents/case and duplicate barangay names stay scoped to their city', () => {
  assert(searchPlaces(getCities('NCR'), 'LAS PINAS').some(c => c.name === 'City of Las Piñas'));
  const other = data.barangays.find(b => b[1] === barangay.name && b[2] !== murcia.code);
  assert(other);
  assert(!getBarangays(murcia.code).some(b => b.code === other[0]));
  assert.equal(searchPlaces(areas, 'no-such-place-xyz').length, 0);
});
