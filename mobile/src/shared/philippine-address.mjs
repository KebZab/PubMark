import data from './philippine-address-data.json' with { type: 'json' };

const sort = (items) => items.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
export const areas = sort(data.areas);
const citiesByArea = new Map();
const barangaysByCity = new Map();
for (const city of data.cities) {
  if (!citiesByArea.has(city.areaCode)) citiesByArea.set(city.areaCode, []);
  citiesByArea.get(city.areaCode).push(city);
}
for (const [code, name, cityCode] of data.barangays) {
  if (!barangaysByCity.has(cityCode)) barangaysByCity.set(cityCode, []);
  barangaysByCity.get(cityCode).push({ code, name });
}
for (const list of [...citiesByArea.values(), ...barangaysByCity.values()]) sort(list);
export const getCities = (areaCode) => citiesByArea.get(areaCode) || [];
export const getBarangays = (cityCode) => barangaysByCity.get(cityCode) || [];
export const emptyAddress = () => ({ areaCode: '', cityCode: '', barangayCode: '', street: '' });

export function changeAddress(address, field, value) {
  const next = { ...address, [field]: value };
  if (field === 'areaCode') { next.cityCode = ''; next.barangayCode = ''; }
  if (field === 'cityCode') next.barangayCode = '';
  return next;
}

export function validateAddress(address) {
  const errors = {};
  if (!areas.some(a => a.code === address.areaCode)) errors.areaCode = 'Select a province or area.';
  if (!getCities(address.areaCode).some(c => c.code === address.cityCode)) errors.cityCode = 'Select a city or municipality.';
  if (!getBarangays(address.cityCode).some(b => b.code === address.barangayCode)) errors.barangayCode = 'Select a barangay.';
  return errors;
}

export function formatAddress(address) {
  if (Object.keys(validateAddress(address)).length) return '';
  const area = areas.find(a => a.code === address.areaCode);
  const city = getCities(address.areaCode).find(c => c.code === address.cityCode);
  const barangay = getBarangays(address.cityCode).find(b => b.code === address.barangayCode);
  return [address.street.trim(), barangay.name, city.name, ['independent-city', 'city-area'].includes(area.kind) ? '' : area.name].filter(Boolean).join(', ');
}

export function searchPlaces(options, query) {
  const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const term = normalize(query.trim());
  return options.filter(option => normalize(option.name).includes(term));
}
