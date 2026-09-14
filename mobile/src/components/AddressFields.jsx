import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCities, getBarangays, searchPlaces } from '../shared/philippine-address.mjs';

function PlaceSelect({ field, label, options, value, onChange, onBlur, error, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef(null);
  const search = useRef(null);
  const selected = options.find(option => option.code === value);
  function close() {
    setOpen(false);
    onBlur(field);
    trigger.current?.focus?.();
  }
  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-medium text-gray-700">{label} *</Text>
      <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={`${label}: ${selected?.name || 'Select'}`}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }} disabled={disabled}
        onPress={() => { setQuery(''); setOpen(true); }}
        className={`flex-row items-center justify-between rounded-xl border bg-gray-50 px-4 py-3.5 ${error ? 'border-red-300' : 'border-gray-200'} ${disabled ? 'opacity-50' : ''}`}>
        <Text className={`flex-1 text-base ${selected ? 'text-gray-900' : 'text-gray-400'}`}>{selected?.name || `Select ${label.toLowerCase()}`}</Text>
        <Ionicons name="chevron-down" size={18} color="#6b7280" />
      </Pressable>
      {error ? <Text accessibilityRole="alert" className="mt-1.5 text-xs text-red-600">{error}</Text> : null}
      <Modal visible={open && !disabled} animationType="slide" onRequestClose={close} onShow={() => search.current?.focus()}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4">
              <Text className="flex-1 text-lg font-semibold text-gray-900">{label}</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close address choices" hitSlop={12} className="p-2">
                <Ionicons name="close" size={24} color="#0f766e" />
              </Pressable>
            </View>
            <TextInput ref={search} value={query} onChangeText={setQuery} placeholder={`Search ${label.toLowerCase()}`}
              accessibilityLabel={`Search ${label.toLowerCase()}`} autoCorrect={false} placeholderTextColor="#9ca3af"
              className="m-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900" />
            <FlatList data={searchPlaces(options, query)} keyExtractor={item => item.code} keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag" initialNumToRender={20}
              ListEmptyComponent={<Text className="p-5 text-center text-gray-500">No matching places.</Text>}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="button" accessibilityState={{ selected: value === item.code }}
                  onPress={() => { onChange(field, item.code); setOpen(false); trigger.current?.focus?.(); }}
                  className={`mx-4 flex-row items-center border-b border-gray-100 px-2 py-4 ${value === item.code ? 'bg-teal-50' : ''}`}>
                  <Text className="flex-1 text-base text-gray-900">{item.name}</Text>
                  {value === item.code ? <Ionicons name="checkmark" size={20} color="#0f766e" /> : null}
                </Pressable>
              )} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export default function AddressFields({ value, onChange, onBlur, errors, disabled }) {
  return (
    <View className="mt-5">
      <Text className="text-base font-semibold text-gray-900">Address</Text>
      <View className="mt-4">
        <Text className="mb-2 text-sm font-medium text-gray-700">Province</Text>
        <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5">
          <Text className="text-base text-gray-700">Negros Occidental</Text>
        </View>
      </View>
      <PlaceSelect key={`city-${value.areaCode}`} field="cityCode" label="City / Municipality" options={getCities(value.areaCode)} value={value.cityCode} {...{ onChange, onBlur }} disabled={disabled || !value.areaCode} error={errors.cityCode} />
      <PlaceSelect key={`barangay-${value.cityCode}`} field="barangayCode" label="Barangay" options={getBarangays(value.cityCode)} value={value.barangayCode} {...{ onChange, onBlur }} disabled={disabled || !value.cityCode} error={errors.barangayCode} />
      <Text className="mb-2 mt-4 text-sm font-medium text-gray-700">House number / Street / Purok (optional)</Text>
      <TextInput value={value.street} onChangeText={text => onChange('street', text)} editable={!disabled}
        accessibilityLabel="House number / Street / Purok (optional)" placeholder="e.g. Purok 2, Mabini Street" placeholderTextColor="#9ca3af"
        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900" />
    </View>
  );
}
