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
assert.equal(records.length, 107);
assert.equal(new Set(records.map(s => s.id)).size, 107);
assert.equal(records.filter(s => s.kind === 'table_stall').length, 22);
assert.equal(records.filter(s => s.kind === 'technical_room').length, 1);
for (const record of records) {
  const ring = record.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring.at(-1));
  for (const [lng, lat] of ring) {
    assert(lng > 123.0409 && lng < 123.0417);
    assert(lat > 10.6053 && lat < 10.6058);
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
const output = context.buildLayoutMarkdown(records, storage, 'Reference layout generated from local-stall-map.html. Includes the approved 84 regular stalls, 22 table stalls, and Technical Room. Browser-only edits are not included. Timestamps were generated for this reference snapshot.');
const payload = JSON.parse(output.split('## Complete object data (JSON)')[1].split('```json\n')[1].split('\n```')[0]);
assert.equal(payload.stalls.length, 107);
assert.equal(output.split('\n').filter(line => /^\| .* \| [0-9]+(?: \(close\))? \| 123\./.test(line)).length, 535);
process.stdout.write(output);
