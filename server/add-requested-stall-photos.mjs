// One-time, explicitly requested addition of store mock 1.jpg to dry stalls 63-84.
// Default is read-only; --apply uploads separate objects and appends photo rows.
import 'dotenv/config';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const bytes = await readFile('C:/Users/Kevin/Downloads/store mock 1.jpg');
assert(bytes.length <= 5 * 1024 * 1024 && bytes[0] === 255 && bytes[1] === 216, 'Expected a JPEG under 5 MB');
const hash = value => createHash('sha256').update(value).digest('hex');
const wantedHash = hash(bytes);
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY).storage.from('attachments');
try {
  const { rows: stalls } = await db.query('SELECT id, stall_name, notes, floor FROM stalls WHERE stall_name = ANY($1)', [Array.from({ length: 22 }, (_, i) => `Stall ${i + 63}`)]);
  assert.equal(stalls.length, 22, 'Expected exactly one stall for each number 63-84');
  for (let n = 63; n <= 84; n++) {
    const matches = stalls.filter(s => s.stall_name === `Stall ${n}` && s.floor === '1' && s.notes?.includes(`Dry Store Building; stall; source: plan_${n}.`));
    assert.equal(matches.length, 1, `Dry stall ${n} not uniquely identified`);
  }
  const { rows: images } = await db.query('SELECT id, stall_id, storage_path, file_name, file_size, uploaded_by FROM stall_images WHERE stall_id = ANY($1)', [stalls.map(s => s.id)]);
  const duplicates = new Set();
  let original;
  for (const img of images) {
    if (Number(img.file_size) !== bytes.length) continue;
    const { data, error } = await storage.download(img.storage_path);
    if (error) throw new Error('Could not verify existing photo bytes');
    if (hash(Buffer.from(await data.arrayBuffer())) === wantedHash) {
      duplicates.add(img.stall_id);
      original ??= img;
    }
  }
  assert(original, 'Expected the already-uploaded matching photo as provenance');
  const pending = stalls.filter(s => !duplicates.has(s.id));
  console.log(JSON.stringify({ targets: stalls.length, alreadyHavePhoto: duplicates.size, appendTo: pending.map(s => s.stall_name).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })), sourceBytes: bytes.length }));
  if (process.argv.includes('--apply') && pending.length) {
    const uploaded = [];
    const conn = await db.connect();
    let committed = false;
    try {
      for (const stall of pending) {
        const id = randomUUID();
        const objectPath = `stalls/${stall.id}/${id}-store-mock-1.jpg`;
        const { error } = await storage.upload(objectPath, bytes, { contentType: 'image/jpeg', upsert: false });
        if (error) throw new Error(`Photo upload failed for ${stall.stall_name}`);
        uploaded.push({ stall, id, objectPath });
      }
      await conn.query('BEGIN');
      for (const file of uploaded) {
        const { rows } = await conn.query('SELECT id, notes, floor FROM stalls WHERE id = $1 FOR UPDATE', [file.stall.id]);
        assert.equal(rows[0]?.notes, file.stall.notes, 'Stall changed during upload');
        assert.equal(rows[0]?.floor, '1');
        await conn.query('INSERT INTO stall_images (id, stall_id, storage_path, file_name, mime_type, file_size, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7)', [file.id, file.stall.id, file.objectPath, 'store mock 1.jpg', 'image/jpeg', bytes.length, original.uploaded_by]);
      }
      await conn.query('COMMIT');
      committed = true;
      console.log(`Appended photo to ${uploaded.length} stalls; preserved all existing photo rows.`);
    } catch (error) {
      if (!committed) {
        await conn.query('ROLLBACK');
        if (uploaded.length) {
          const cleanup = await storage.remove(uploaded.map(f => f.objectPath));
          if (cleanup.error) console.error('Cleanup of new objects needs attention.');
        }
      }
      throw error;
    } finally { conn.release(); }
  }
} catch (error) {
  console.error(error.name === 'AssertionError' ? error.message : 'Photo operation failed; no credentials logged.');
  process.exitCode = 1;
} finally { await db.end(); }
