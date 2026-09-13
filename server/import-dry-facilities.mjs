// Dry Store facilities only. Default is read-only; --apply commits the import.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { geometryKey } from './src/stallImport.js';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });
const markdown = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/export-local-map-markdown.mjs', import.meta.url))], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const data = JSON.parse(markdown.split('## Complete object data (JSON)')[1].split('```json\n')[1].split('\n```')[0]);
const facilities = data.stalls.filter(s => s.building === 'Dry Store Building' && s.kind === 'technical_room');
assert.equal(facilities.length, 1);
assert.equal(facilities[0].id, 'plan_technical_room');
const source = facilities[0];
const hex = crypto.createHash('sha256').update(`pubmark:dry-store:${source.id}`).digest('hex');
const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
const apply = process.argv.includes('--apply');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
let conn;
try {
  assert(process.env.DATABASE_URL);
  conn = await pool.connect();
  await conn.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
  if (apply && process.argv.includes('--enable-technical-room')) {
    await conn.query(fs.readFileSync(new URL('migrations/2026-09-13-enable-technical-room.sql', import.meta.url), 'utf8'));
  }
  if (process.argv.includes('--inspect-schema')) {
    const constraints = await conn.query("SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='map_facilities'::regclass AND contype='c'");
    console.log(JSON.stringify(constraints.rows));
  }
  if (apply) await conn.query('LOCK TABLE map_facilities IN SHARE ROW EXCLUSIVE MODE');
  const { rows } = await conn.query('SELECT id, type, floor, geometry, notes FROM map_facilities');
  const matches = rows.filter(row => {
    if (row.id === id || row.notes?.includes('source: plan_technical_room')) return true;
    try { return geometryKey(row) === geometryKey(source); } catch { return false; }
  });
  assert(matches.length <= 1, 'Multiple facility matches require review');
  if (matches.length) assert.equal(matches[0].type, 'technical_room');
  const { rows: creators } = await conn.query("SELECT id, name FROM profiles WHERE role = 'super_admin' AND COALESCE(is_archived, false) = false");
  const creatorName = process.argv.find(arg => arg.startsWith('--creator='))?.slice('--creator='.length);
  const selectedCreators = creatorName ? creators.filter(row => row.name === creatorName) : creators;
  if (apply && !matches.length) {
    assert.equal(selectedCreators.length, 1, 'An explicit creator is needed when there is not exactly one active super admin');
    await conn.query('INSERT INTO map_facilities (id, type, name, floor, geometry, connected_floors, is_accessible, notes, created_by) VALUES ($1,$2,$3,$4,$5,NULL,false,$6,$7)',
      [id, 'technical_room', 'Technical Room', '1', JSON.stringify(source.geometry), `Dry Store Building; source: plan_technical_room. ${source.notes || ''}`, selectedCreators[0].id]);
    const check = await conn.query('SELECT id, type, floor, geometry FROM map_facilities WHERE id=$1', [id]);
    assert.equal(check.rows.length, 1);
    assert.equal(check.rows[0].type, 'technical_room');
    assert.equal(geometryKey(check.rows[0]), geometryKey(source));
  }
  await conn.query('COMMIT');
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'preview', building: 'Dry Store Building', facility: 'Technical Room', inserted: matches.length ? 0 : 1, skipped: matches.length, activeSuperAdmins: creators.map(row => row.name) }));
} catch (error) {
  if (conn) await conn.query('ROLLBACK').catch(() => {});
  console.error(JSON.stringify({ error: 'Facility import failed; transaction rolled back if started.', code: error.code || error.name, constraint: error.constraint }));
  process.exitCode = 1;
} finally { conn?.release(); await pool.end(); }
