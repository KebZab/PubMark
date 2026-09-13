// Run without arguments for a read-only preview; --apply imports only Dry Store stalls.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { importStallRows } from './src/stallImport.js';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
const root = new URL('../', import.meta.url);
const markdown = execFileSync(process.execPath, [fileURLToPath(new URL('scripts/export-local-map-markdown.mjs', root))], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const data = JSON.parse(markdown.split('## Complete object data (JSON)')[1].split('```json\n')[1].split('\n```')[0]);
const source = fs.readFileSync(new URL('src/app/components/AdminMapView.jsx', root), 'utf8');
const calculator = source.slice(source.indexOf('function calculatePolygonArea('), source.indexOf('\n}', source.indexOf('function calculatePolygonArea(')) + 2);
const context = vm.createContext({ L: { latLng: (lat, lng) => ({ lat, lng }) } });
vm.runInContext(calculator, context);
const stalls = data.stalls.filter(s => s.building === 'Dry Store Building' && s.kind !== 'technical_room').map(s => {
  assert.match(s.id, /^plan_(?:table_)?\d+$/);
  const hex = crypto.createHash('sha256').update(`pubmark:dry-store:${s.id}`).digest('hex');
  const import_id = `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
  const area = Math.round(context.calculatePolygonArea(s.geometry));
  assert(area > 0);
  return { ...s, import_id, status: 'vacant', business_type: 'General', section: 'General', floor: '1', floor_area: String(area), notes: `Dry Store Building; ${s.kind === 'table_stall' ? 'table_stall' : 'stall'}; source: ${s.id}. ${s.notes || ''}` };
});
assert.equal(stalls.length, 106);
assert.equal(stalls.filter(s => s.kind === 'table_stall').length, 22);
assert.equal(new Set(stalls.map(s => s.import_id)).size, 106);
const apply = process.argv.includes('--apply');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
let conn;
try {
  assert(process.env.DATABASE_URL, 'Database configuration is required');
  conn = await pool.connect();
  await conn.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
  const result = await importStallRows(conn, stalls, { dryRun: !apply });
  if (apply) {
    const verified = await conn.query('SELECT count(*)::int AS count FROM stalls WHERE id = ANY($1::uuid[])', [Object.values(result.idMap)]);
    assert.equal(verified.rows[0].count, 106);
  }
  await conn.query('COMMIT');
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'preview', building: 'Dry Store Building', total: stalls.length, inserted: result.inserted, skipped: result.skipped, areaRangeM2: [Math.min(...stalls.map(s=>Number(s.floor_area))), Math.max(...stalls.map(s=>Number(s.floor_area)))] }));
} catch (error) {
  if (conn) await conn.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ error: 'Dry Store import failed; transaction rolled back if started.', code: error.code || error.name }));
  process.exitCode = 1;
} finally { conn?.release(); await pool.end(); }
