const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('@babel/core');

// Exercise the real registration handlers with a small hook/element harness,
// as in useApiData.test.cjs. No network, real accounts, or DOM are involved.
function mount(file, shared, api, sourceOverride) {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  };
  const module = { exports: {} };
  const source = transformSync(sourceOverride ?? fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false,
    plugins: [
      [require.resolve('@babel/plugin-transform-react-jsx'), { pragma: 'h', pragmaFrag: 'Fragment' }],
      require.resolve('@babel/plugin-transform-modules-commonjs'),
    ],
  }).code;
  vm.runInNewContext(source, {
    exports: module.exports,
    h: (type, props, ...children) => ({ type, props: { ...props, children } }), Fragment: 'Fragment',
    Error, window: { setTimeout: () => {} }, localStorage: { setItem: () => {} },
    require(name) {
      if (name === 'react') return react;
      if (name.includes('philippine-address.mjs')) return shared;
      if (name.includes('AuthContext')) return { useAuth: () => ({ signUp: api, signIn: () => {} }) };
      if (name.includes('services/api')) return { registerVendor: api };
      if (name === 'react-router') return { useNavigate: () => () => {}, useSearchParams: () => [new URLSearchParams()], Link: 'Link' };
      if (name.includes('AddressFields')) return { __esModule: true, default: 'AddressFields' };
      if (name.includes('tenantTerms')) return { tenantTermsIntro: [], tenantTermsSections: [], tenantTermsTitle: 'Terms' };
      if (name === '@mui/material/Autocomplete') return { __esModule: true, default: 'Autocomplete' };
      if (name === '@mui/material/TextField') return { __esModule: true, default: 'TextField' };
      if (name === 'react-native') return { ...Object.fromEntries(['ActivityIndicator', 'KeyboardAvoidingView', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View', 'FlatList', 'Modal'].map(n => [n, n])), Platform: { OS: 'ios' } };
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
      if (name === 'lucide-react') return Object.fromEntries(['MapPin', 'UserPlus', 'Eye', 'EyeOff', 'FileText'].map(n => [n, n]));
      throw new Error(`Unexpected test import: ${name}`);
    },
  });
  const component = module.exports.Register || module.exports.default;
  return { render(props = {}) { cursor = 0; return component({ navigation: { goBack() {} }, ...props }); } };
}

function all(tree) {
  if (Array.isArray(tree)) return tree.flatMap(all);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...all(tree.props?.children)];
}
function find(tree, predicate) {
  const element = all(tree).find(predicate);
  assert(element, 'Expected element in rendered component');
  return element;
}

for (const platform of ['web', 'mobile']) {
  test(`${platform}: address validation, cascades and mocked registration payload`, async () => {
    const shared = await import('../src/shared/philippine-address.mjs');
    let resolve, submitted;
    const response = new Promise(r => { resolve = r; });
    const file = platform === 'web' ? '../../src/app/pages/Register.jsx' : '../src/screens/RegisterScreen.jsx';
    const form = mount(path.join(__dirname, file), shared, value => { submitted = value; return response; });
    const address = () => find(form.render(), n => n.type === 'AddressFields').props;
    const submit = () => {
      const tree = form.render();
      if (platform === 'web') return find(tree, n => n.type === 'form').props.onSubmit({ preventDefault() {} });
      return find(tree, n => n.type === 'Pressable' && n.props.className?.includes('mt-6 flex-row')).props.onPress();
    };
    await submit();
    assert.equal(submitted, undefined);
    assert.equal(address().errors.areaCode, undefined);
    assert(address().errors.cityCode);
    assert(address().errors.barangayCode);
    const fields = [
      [platform === 'web' ? 'e.g. Juan dela Cruz' : 'Juan dela Cruz', 'Test Vendor'],
      ['you@example.com', 'test@example.invalid'], ['09XXXXXXXXX', '09171234567'],
      ['At least 6 characters', 'test-password'], ['Re-enter your password', 'test-password'],
    ];
    for (const [placeholder, value] of fields) {
      const input = find(form.render(), n => n.props.placeholder === placeholder);
      if (platform === 'web') input.props.onChange({ target: { value } });
      else input.props.onChangeText(value);
    }
    const checkbox = find(form.render(), n => n.props.type === 'checkbox' || n.props.accessibilityRole === 'checkbox');
    if (platform === 'web') checkbox.props.onChange({ target: { checked: true } });
    else checkbox.props.onPress();
    const area = shared.areas.find(a => a.name === 'Negros Occidental');
    const city = shared.getCities(area.code).find(c => c.name === 'Murcia');
    const barangay = shared.getBarangays(city.code).find(b => b.name === 'Abo-abo');
    address().onChange('street', ' Purok 2 ');
    address().onChange('areaCode', area.code);
    address().onChange('cityCode', city.code);
    address().onChange('barangayCode', barangay.code);
    address().onChange('areaCode', 'NCR');
    assert.equal(address().value.cityCode, '');
    assert.equal(address().value.barangayCode, '');
    assert.equal(address().value.street, ' Purok 2 ');
    address().onChange('areaCode', area.code);
    address().onChange('cityCode', city.code);
    address().onChange('barangayCode', barangay.code);
    const pending = submit();
    assert.equal(submitted.address, 'Purok 2, Abo-abo, Murcia, Negros Occidental');
    assert.equal(address().disabled, true);
    resolve({ profile: { id: 'mock-vendor' } });
    await pending;
  });
}

test('mobile picker: search, selection, cancel and Android back dismissal', async () => {
  const shared = await import('../src/shared/philippine-address.mjs');
  const fields = mount(path.join(__dirname, '../src/components/AddressFields.jsx'), shared, () => {});
  let changed;
  let blurred;
  const props = { value: shared.emptyAddress(), onChange: (...args) => { changed = args; }, onBlur: value => { blurred = value; }, errors: {}, disabled: false };
  const tree = fields.render(props);
  const selectors = all(tree).filter(n => typeof n.type === 'function');
  assert.equal(selectors[0].props.disabled, false);
  assert.equal(selectors[1].props.disabled, true);
  // Render the real nested PlaceSelect with an independent hook lifecycle.
  const source = fs.readFileSync(path.join(__dirname, '../src/components/AddressFields.jsx'), 'utf8');
  // Mount supports exported components; expose the private picker only in the in-memory test transform.
  const tempSource = source.replace('export default function AddressFields', 'function AddressFields') + '\nexport default PlaceSelect;';
  const picker = mount('__picker__', shared, () => {}, tempSource);
  const options = selectors[0].props;
  const render = () => picker.render(options);
  find(render(), n => n.type === 'Pressable' && n.props.accessibilityState?.expanded === false).props.onPress();
  assert.equal(find(render(), n => n.type === 'Modal').props.visible, true);
  find(render(), n => n.type === 'TextInput').props.onChangeText('murcia');
  const list = find(render(), n => n.type === 'FlatList');
  assert.equal(list.props.data.length, 1);
  list.props.renderItem({ item: list.props.data[0] }).props.onPress();
  assert.equal(changed[0], 'cityCode');
  assert.equal(find(render(), n => n.type === 'Modal').props.visible, false);
  find(render(), n => n.type === 'Pressable' && n.props.accessibilityState).props.onPress();
  assert.equal(find(render(), n => n.type === 'TextInput').props.value, '');
  find(render(), n => n.type === 'Modal').props.onRequestClose();
  assert.equal(blurred, 'cityCode');
  assert.equal(find(render(), n => n.type === 'Modal').props.visible, false);
  find(render(), n => n.type === 'Pressable' && n.props.accessibilityState).props.onPress();
  find(render(), n => n.props.accessibilityLabel === 'Close address choices').props.onPress();
  assert.equal(find(render(), n => n.type === 'Modal').props.visible, false);
});
