import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { areas, getCities, getBarangays, searchPlaces } from '../../../mobile/src/shared/philippine-address.mjs';

function PlaceSelect({ field, label, options, value, onChange, onBlur, error, disabled, fieldRefs }) {
  const [query, setQuery] = useState('');
  return (
    <Autocomplete
      options={options}
      value={options.find(option => option.code === value) || null}
      inputValue={query}
      onInputChange={(_, text) => setQuery(text)}
      onChange={(_, option) => onChange(field, option?.code || '')}
      getOptionLabel={option => option.name}
      getOptionKey={option => option.code}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      filterOptions={(items, state) => searchPlaces(items, state.inputValue)}
      disabled={disabled}
      fullWidth
      renderInput={params => (
        <TextField {...params} label={label} required error={Boolean(error)} helperText={error}
          onBlur={() => onBlur(field)}
          inputRef={element => { if (fieldRefs) fieldRefs.current[field] = element; }}
          placeholder={`Select ${label.toLowerCase()}`}
        />
      )}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f9fafb', fontSize: '14px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#0f766e' } }}
    />
  );
}

export default function AddressFields({ value, onChange, onBlur, errors, disabled, fieldRefs }) {
  return (
    <fieldset className="space-y-4 min-w-0" disabled={disabled}>
      <legend className="text-sm font-medium text-gray-700 mb-3">Address</legend>
      <PlaceSelect field="areaCode" label="Province / Area" options={areas} value={value.areaCode} {...{ onChange, onBlur, fieldRefs, disabled }} error={errors.areaCode} />
      <PlaceSelect key={`city-${value.areaCode}`} field="cityCode" label="City / Municipality" options={getCities(value.areaCode)} value={value.cityCode} {...{ onChange, onBlur, fieldRefs }} disabled={disabled || !value.areaCode} error={errors.cityCode} />
      <PlaceSelect key={`barangay-${value.cityCode}`} field="barangayCode" label="Barangay" options={getBarangays(value.cityCode)} value={value.barangayCode} {...{ onChange, onBlur, fieldRefs }} disabled={disabled || !value.cityCode} error={errors.barangayCode} />
      <div>
        <label htmlFor="address-street" className="block text-sm font-medium text-gray-700 mb-1.5">House number / Street / Purok <span className="font-normal text-gray-400">(optional)</span></label>
        <input id="address-street" value={value.street} onChange={event => onChange('street', event.target.value)} autoComplete="address-line1" placeholder="e.g. Purok 2, Mabini Street" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50" />
      </div>
    </fieldset>
  );
}
