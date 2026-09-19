// Run: node --experimental-vm-modules --test server/tests/edge-uploads.test.mjs
// Exercise the generated Edge routes without a Node Buffer global or live data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

async function harness() {
  const uploads = [];
  const errors = [];
  const db = { async query(sql) {
    if (sql.startsWith('SELECT role')) return { rows: [{ role: 'vendor', is_archived: false }] };
    if (sql.startsWith('INSERT INTO applications')) return { rows: [] };
    if (sql.includes('FROM applications a')) return { rows: [{ id: 'test-application', contract_term_months: 12 }] };
    throw new Error(`Unexpected test query: ${sql}`);
  } };
  const storage = { from() { return {
    async upload(path, bytes) { uploads.push({ path, bytes }); return { error: null }; },
    async remove() { return { error: null }; },
  }; } };
  const context = vm.createContext({
    Request, Response, Headers, URL, TextEncoder,
    console: { error: e => errors.push(e), log() {} },
    process: { env: { JWT_SECRET: 'test-only', DATABASE_URL: 'test-only', SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } },
  });
  const exportsByModule = {
    'node:buffer': { Buffer },
    'node:crypto': { default: crypto },
    'npm:bcryptjs@2.4.3': { default: {} },
    'npm:jsonwebtoken@9.0.2': { default: { verify(token) { if (!token) throw Error('No token'); return { sub: 'test-vendor' }; } } },
    'npm:pg@8.23.0': { default: { Pool: class { constructor() { return db; } } } },
    'npm:nodemailer@10.0.0': { default: {} },
    'npm:google-auth-library@11.0.2': { OAuth2Client: class {} },
    'npm:@supabase/supabase-js@2.112.3': { createClient: () => ({ storage }) },
    './stallImport.js': { importStallRows() {} },
  };
  const adapter = new vm.SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../../supabase/functions/api/edge-express.ts', import.meta.url), 'utf8')), { context });
  const source = await readFile(new URL('../../supabase/functions/api/generated-app.js', import.meta.url), 'utf8');
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(specifier => {
    if (specifier === './edge-express.ts') return adapter;
    const values = exportsByModule[specifier];
    assert.ok(values, `Unexpected import: ${specifier}`);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await mod.evaluate();
  const submit = (files = {}, authenticated = true) => mod.namespace.app.fetch(new Request('https://example.invalid/functions/v1/api/applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: 'Bearer test' } : {}) },
    body: JSON.stringify({ stallId: 'test-stall', businessName: 'Test', businessType: 'Test', contractStart: '2026-09-18', contractTermMonths: 12, contractEnd: '2027-09-18', ...files }),
  }));
  return { submit, uploads, errors };
}

test('application with an image decodes bytes in the Edge runtime', async () => {
  const { submit, uploads, errors } = await harness();
  const response = await submit({ permit: { name: 'permit.png', type: 'image/png', base64: 'aGVsbG8=' } });
  assert.equal(response.status, 201, errors.map(String).join('\n'));
  assert.equal(uploads[0].bytes.toString(), 'hello');
});

test('two permitted 5 MB attachments fit after base64 encoding', async () => {
  const { submit, uploads } = await harness();
  const file = { name: 'permit.png', type: 'image/png', base64: Buffer.alloc(5 * 1024 * 1024).toString('base64') };
  const response = await submit({ permit: file, additionalFile: file });
  assert.equal(response.status, 201);
  assert.deepEqual(uploads.map(u => u.bytes.length), [5 * 1024 * 1024, 5 * 1024 * 1024]);
});

test('oversized files and unsupported types remain rejected', async () => {
  const { submit, uploads } = await harness();
  const oversized = await submit({ permit: { name: 'large.png', type: 'image/png', base64: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') } });
  assert.equal(oversized.status, 400);
  const invalid = await submit({ permit: { name: 'file.exe', type: 'application/octet-stream', base64: 'aGVsbG8=' } });
  assert.equal(invalid.status, 400);
  assert.equal(uploads.length, 0);
});

test('unauthenticated submissions do not upload anything', async () => {
  const { submit, uploads } = await harness();
  assert.equal((await submit({}, false)).status, 401);
  assert.equal(uploads.length, 0);
});
