// Generate a reference Markdown snapshot from the HTML's actual seed functions.
// Prints to stdout; does not read a browser profile or write files.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../local-stall-map.html', import.meta.url), 'utf8');
const code = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
new vm.Script(code);
const radius = 6378137;
const degrees = Math.PI / 180;
const scale = 256 * 2 ** 22;
// Same EPSG:3857 projection, transformation and inverse as Leaflet 1.9.4.
const map = {
  project({ lat, lng }) {
    const sin = Math.max(Math.min(Math.sin(lat * degrees), 1 - 1e-15), -1 + 1e-15);
    const x = radius * lng * degrees;
    const y = radius * Math.log((1 + sin) / (1 - sin)) / 2;
    const coefficient = .5 / (Math.PI * radius);
    return { x: scale * (coefficient*x + .5), y: scale * (-coefficient*y + .5) };
  },
  unproject({ x, y }) {
    const coefficient = .5 / (Math.PI * radius);
    x = (x / scale - .5) / coefficient;
    y = (y / scale - .5) / -coefficient;
    return { lng: x * (180 / Math.PI) / radius, lat: (2*Math.atan(Math.exp(y/radius)) - Math.PI/2)*(180/Math.PI) };
  }
};
const context = vm.createContext({ map, L: { point: (x,y) => ({ x,y }), latLng: (lat,lng) => ({ lat,lng }) } });
const anchors = code.slice(code.indexOf('const PLAN_TOP_LEFT'), code.indexOf('const drawnItems'));
const geometry = code.slice(code.indexOf('function planPoint'), code.indexOf('function load()'));
const markdown = code.slice(code.indexOf('function buildLayoutMarkdown'), code.indexOf("document.getElementById('exportMarkdownBtn').addEventListener"));
vm.runInContext(anchors + geometry + markdown, context);
const records = vm.runInContext('makePlanStalls()', context);
// Check the browser's one-time migration without accessing browser storage.
const storageValues = new Map();
context.localStorage = {getItem:key=>storageValues.get(key) ?? null,setItem:(key,value)=>storageValues.set(key,value)};
vm.runInContext("const STORAGE_KEY='test'; const PLAN_SEED_KEY='seed';" + code.slice(code.indexOf('function load()'),code.indexOf('stalls = load();')),context);
storageValues.set('test',JSON.stringify([{...records[0],stall_name:'Keep my name'}, {id:'custom',floor:'1',notes:'Keep my custom record'}]));
storageValues.set('seed','done');
storageValues.set('test_alignment','aligned-middle-building-v2');
storageValues.set('test_middle_features_v1','done');
const migrated = context.load();
assert.equal(migrated.find(s=>s.id==='plan_1').stall_name,'Keep my name');
assert.equal(migrated.find(s=>s.id==='plan_1').building,'Dry Store Building');
assert.equal(migrated.find(s=>s.id==='custom').notes,'Keep my custom record');
assert.equal(context.load().length,migrated.length);
assert(storageValues.has('test_before_buildings_v3'));
storageValues.clear();
assert.equal(context.load().length,302);
storageValues.set('test','[]');
assert.equal(context.load().length,0);
const stallOne = records.find(s=>s.id==='plan_1');
assert(Math.abs(stallOne.geometry.coordinates[0][0][1]-10.6057458)<1e-10);
assert.equal(records.length, 302);
assert.equal(new Set(records.map(s => s.id)).size, 302);
assert.equal(records.filter(s => s.kind === 'table_stall').length, 132);
assert.equal(records.filter(s => s.building === 'Main Building').length, 36);
assert.equal(records.filter(s => s.building === 'Dry Store Building').length, 107);
assert.equal(records.filter(s => s.building === 'Wet Store Building').length, 159);
assert.equal(records.filter(s => s.kind === 'comfort_room').length, 1);
assert.equal(records.find(s => s.kind === 'comfort_room').stall_name, 'Comfort Room (CR)');
storageValues.set('test',JSON.stringify([{id:'wet_A_1',notes:'old draft'},{id:'wet_table_1'},{id:'wet_v4_table_1',notes:'old traced draft'},{id:'my_wet_stall',building:'Wet Store Building',notes:'custom'},records[0]]));
storageValues.delete('test_wet_reference_v4');
storageValues.delete('test_wet_mirrored_v5');
const wetMigration=context.load();
assert(!wetMigration.some(s=>s.id==='wet_A_1'||s.id==='wet_table_1'||s.id==='wet_v4_table_1'));
assert.equal(wetMigration.find(s=>s.id==='my_wet_stall').notes,'custom');
assert.equal(wetMigration.filter(s=>s.id.startsWith('wet_v5_')).length,159);
assert.equal(context.load().length,wetMigration.length);
assert(storageValues.has('test_before_wet_reference_v4'));
assert(storageValues.has('test_before_wet_mirrored_v5'));
assert.equal(records.filter(s => s.kind === 'technical_room').length, 1);
for (const record of records) {
  const ring = record.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring.at(-1));
  for (const [lng, lat] of ring) {
    assert(lng > 123.0408 && lng < 123.0418);
    assert(lat > 10.6051 && lat < 10.6060);
  }
}
const storage = {
  note: 'Reference layout generated from source code, NOT captured from your browser. No actual browser storage strings, migration flags, prior backups, or user edits were read. Use Export Markdown in the mapper for those.',
  current_data_key: 'pubmark_local_stall_mapper_v1',
  seed_key: 'pubmark_local_stall_mapper_plan_seed_v1',
  alignment_key: 'pubmark_local_stall_mapper_v1_alignment',
  alignment_backup_key: 'pubmark_local_stall_mapper_v1_before_alignment_v2',
  middle_features_key: 'pubmark_local_stall_mapper_v1_middle_features_v1'
};
const output = context.buildLayoutMarkdown(records, storage, 'Three-building reference layout generated from local-stall-map.html. Wet Store Building traced from the supplied wet-market photograph: perimeter wings, meat counters, vegetable counters, fish counters and stairwell. Perimeter numbers repeat by wing; table labels are assigned locally where tiny printed labels remain unreadable. Geometry is an image trace, not survey measurements. Browser-only edits are not included. Timestamps were generated for this reference snapshot.');
const payload = JSON.parse(output.split('## Complete object data (JSON)')[1].split('```json\n')[1].split('\n```')[0]);
assert.equal(payload.stalls.length, 302);
assert.equal(output.split('\n').filter(line => /^\| .* \| [0-9]+(?: \(close\))? \| 123\./.test(line)).length, 1510);
process.stdout.write(output);
