import crypto from 'node:crypto';

export function geometryKey(stall) {
  const geometry = typeof stall.geometry === 'string' ? JSON.parse(stall.geometry) : stall.geometry;
  if (geometry?.type !== 'Polygon' || !geometry.coordinates?.length) throw new Error('A stall polygon is required.');
  const rings = geometry.coordinates.map(ring => {
    if (ring.length < 4 || JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) throw new Error('Stall polygon must be closed.');
    const points = ring.slice(0, -1).map(point => {
      if (point.length !== 2 || !point.every(Number.isFinite)) throw new Error('Invalid stall coordinates.');
      return point.map(value => value.toFixed(8)).join(',');
    });
    const variants = [points, [...points].reverse()].flatMap(order => order.map((_, i) => [...order.slice(i), ...order.slice(0, i)].join(';')));
    return variants.sort()[0];
  });
  return `${stall.floor || '1'}:${rings[0]}:${rings.slice(1).sort().join('|')}`;
}

// Caller owns the transaction. Lock also serializes concurrent bulk imports.
export async function importStallRows(conn, stalls, { dryRun = false } = {}) {
  if (!dryRun) await conn.query('LOCK TABLE stalls IN SHARE ROW EXCLUSIVE MODE');
  const { rows } = await conn.query('SELECT id, floor, geometry FROM stalls');
  const byGeometry = new Map();
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const row of rows) {
    try { byGeometry.set(geometryKey(row), row.id); } catch { /* Legacy non-polygon rows cannot match. */ }
  }
  const idMap = {};
  let inserted = 0, skipped = 0;
  for (const stall of stalls) {
    const key = geometryKey(stall);
    const existing = (stall.import_id && byId.get(stall.import_id)?.id) || byGeometry.get(key);
    if (existing) { idMap[stall.id] = existing; skipped++; continue; }
    const id = stall.import_id || crypto.randomUUID();
    if (!dryRun) await conn.query(
      'INSERT INTO stalls (id, stall_name, status, business_type, section, floor, floor_area, notes, geometry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, stall.stall_name, stall.status, stall.business_type, stall.section, stall.floor || '1', stall.floor_area, stall.notes || '', JSON.stringify(stall.geometry)]
    );
    byId.set(id, { id }); byGeometry.set(key, id); idMap[stall.id] = id; inserted++;
  }
  return { idMap, inserted, skipped };
}
