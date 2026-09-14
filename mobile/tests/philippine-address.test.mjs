import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/shared/philippine-address-data.json' with { type: 'json' };
import { areas, getCities, getBarangays, emptyAddress, changeAddress, validateAddress, formatAddress, searchPlaces } from '../src/shared/philippine-address.mjs';

const negros = areas.find(a => a.name === 'Negros Occidental');
const murcia = getCities(negros.code).find(c => c.name === 'Murcia');
const barangay = getBarangays(murcia.code).find(b => b.name === 'Abo-abo');
const valid = { areaCode: negros.code, cityCode: murcia.code, barangayCode: barangay.code, street: '  Purok 2  ' };

test('nationwide source remains intact while registration exposes only Negros Occidental', () => {
  assert.equal(data.areas.filter(a => a.kind === 'province').length, 82);
  assert.equal(data.cities.length, 1642);
  assert.equal(data.barangays.length, 42010);
  assert.equal(new Set(data.cities.map(c => c.code)).size, data.cities.length);
  assert.equal(new Set(data.barangays.map(b => b[0])).size, data.barangays.length);
  const areaCodes = new Set(data.areas.map(a => a.code));
  const cityCodes = new Set(data.cities.map(c => c.code));
  for (const c of data.cities) assert(areaCodes.has(c.areaCode));
  for (const [code, name, parent] of data.barangays) { assert.match(code, /^\d{10}$/); assert(name); assert(cityCodes.has(parent)); }
  assert.deepEqual(areas.map(a => a.name), ['Negros Occidental']);
  assert.equal(getCities(negros.code).length, 31);
  assert.equal(getCities('NCR').length, 0);
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
  assert.deepEqual(validateAddress(emptyAddress()), {
    cityCode: 'Select a city or municipality.',
    barangayCode: 'Select a barangay.',
  });
  assert(validateAddress({ ...valid, areaCode: 'NCR' }).cityCode);
  assert(validateAddress({ ...valid, barangayCode: 'unknown' }).barangayCode);
  assert.equal(formatAddress({ ...valid, areaCode: 'NCR' }), '');
});

test('search handles accents/case and duplicate barangay names stay scoped to their city', () => {
  assert(searchPlaces(getCities(negros.code), 'MURCIA').some(c => c.name === 'Murcia'));
  const other = data.barangays.find(b => b[1] === barangay.name && b[2] !== murcia.code);
  assert(other);
  assert(!getBarangays(murcia.code).some(b => b.code === other[0]));
  assert.equal(searchPlaces(areas, 'no-such-place-xyz').length, 0);
});
