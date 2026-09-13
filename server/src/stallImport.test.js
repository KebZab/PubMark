import test from 'node:test';
import assert from 'node:assert/strict';
import { geometryKey, importStallRows } from './stallImport.js';

const stall = { id: 'plan_1', floor: '1', geometry: { type: 'Polygon', coordinates: [[[1,1],[2,1],[2,2],[1,1]]] } };
test('polygon identity handles ring direction, start point, and floor', () => {
  const reordered = { ...stall, geometry: { type: 'Polygon', coordinates: [[[2,1],[1,1],[2,2],[2,1]]] } };
  assert.equal(geometryKey(stall), geometryKey(reordered));
  assert.notEqual(geometryKey(stall), geometryKey({ ...stall, floor: '2' }));
});
test('repeated imports and duplicate batch entries insert only once and preserve existing records', async () => {
  const rows = [];
  let locked = false;
  const conn = { async query(sql, values) {
    if (sql.startsWith('LOCK')) locked = true;
    if (sql.startsWith('SELECT')) return { rows: [...rows] };
    if (sql.startsWith('INSERT')) { assert(locked); rows.push({ id: values[0], floor: values[5], geometry: JSON.parse(values[8]) }); }
    return { rows: [] };
  } };
  const first = await importStallRows(conn, [stall, { ...stall, id: 'duplicate' }]);
  assert.equal(first.inserted, 1); assert.equal(first.skipped, 1);
  assert.equal(first.idMap.plan_1, first.idMap.duplicate);
  const second = await importStallRows(conn, [stall]);
  assert.equal(second.inserted, 0); assert.equal(second.skipped, 1);
  assert.equal(rows.length, 1);
});
test('stable import ID prevents reinsertion after existing geometry changes', async () => {
  const conn = { async query() { return { rows: [{ id: 'stable', floor: '2', geometry: stall.geometry }] }; } };
  const result = await importStallRows(conn, [{ ...stall, import_id: 'stable' }], { dryRun: true });
  assert.equal(result.inserted, 0); assert.equal(result.skipped, 1);
});
test('dry run never writes or locks', async () => {
  const conn = { async query(sql) { assert(sql.startsWith('SELECT')); return { rows: [] }; } };
  assert.equal((await importStallRows(conn, [stall], { dryRun: true })).inserted, 1);
});
