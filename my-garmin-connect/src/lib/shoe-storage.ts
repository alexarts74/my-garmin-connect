import * as SQLite from 'expo-sqlite';
import type { Shoe, SoleType, ActivityShoeLink } from '@/types/shoes';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getShoeDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('shoes.db');
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS shoes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      sole_type TEXT NOT NULL DEFAULT 'standard',
      retired INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_shoe_links (
      activity_id INTEGER PRIMARY KEY,
      shoe_id TEXT NOT NULL,
      distance_meters REAL NOT NULL,
      FOREIGN KEY (shoe_id) REFERENCES shoes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_links_shoe ON activity_shoe_links(shoe_id);
  `);
  return dbInstance;
}

// ── Shoes CRUD ──

export async function getAllShoes(db: SQLite.SQLiteDatabase): Promise<Shoe[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    brand: string;
    sole_type: string;
    retired: number;
    created_at: string;
  }>(`
    SELECT s.*, COALESCE(SUM(l.distance_meters), 0) AS total_distance
    FROM shoes s
    LEFT JOIN activity_shoe_links l ON l.shoe_id = s.id
    GROUP BY s.id
    ORDER BY s.retired ASC, s.created_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    soleType: r.sole_type as SoleType,
    totalDistanceMeters: (r as any).total_distance ?? 0,
    retired: r.retired === 1,
    createdAt: r.created_at,
  }));
}

export async function getShoeById(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<Shoe | null> {
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    brand: string;
    sole_type: string;
    retired: number;
    created_at: string;
    total_distance: number;
  }>(`
    SELECT s.*, COALESCE(SUM(l.distance_meters), 0) AS total_distance
    FROM shoes s
    LEFT JOIN activity_shoe_links l ON l.shoe_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `, [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    soleType: row.sole_type as SoleType,
    totalDistanceMeters: row.total_distance,
    retired: row.retired === 1,
    createdAt: row.created_at,
  };
}

export async function insertShoe(
  db: SQLite.SQLiteDatabase,
  shoe: { id: string; name: string; brand: string; soleType: SoleType },
): Promise<void> {
  await db.runAsync(
    'INSERT INTO shoes (id, name, brand, sole_type, retired, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    [shoe.id, shoe.name, shoe.brand, shoe.soleType, new Date().toISOString()],
  );
}

export async function updateShoe(
  db: SQLite.SQLiteDatabase,
  shoe: { id: string; name: string; brand: string; soleType: SoleType; retired: boolean },
): Promise<void> {
  await db.runAsync(
    'UPDATE shoes SET name = ?, brand = ?, sole_type = ?, retired = ? WHERE id = ?',
    [shoe.name, shoe.brand, shoe.soleType, shoe.retired ? 1 : 0, shoe.id],
  );
}

export async function deleteShoe(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM activity_shoe_links WHERE shoe_id = ?', [id]);
  await db.runAsync('DELETE FROM shoes WHERE id = ?', [id]);
}

// ── Activity ↔ Shoe Links ──

export async function getShoeForActivity(
  db: SQLite.SQLiteDatabase,
  activityId: number,
): Promise<(Shoe & { linkDistance: number }) | null> {
  const link = await db.getFirstAsync<{
    shoe_id: string;
    distance_meters: number;
  }>('SELECT shoe_id, distance_meters FROM activity_shoe_links WHERE activity_id = ?', [activityId]);

  if (!link) return null;

  const shoe = await getShoeById(db, link.shoe_id);
  if (!shoe) return null;

  return { ...shoe, linkDistance: link.distance_meters };
}

export async function linkActivityToShoe(
  db: SQLite.SQLiteDatabase,
  activityId: number,
  shoeId: string,
  distanceMeters: number,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO activity_shoe_links (activity_id, shoe_id, distance_meters)
     VALUES (?, ?, ?)`,
    [activityId, shoeId, distanceMeters],
  );
}

export async function unlinkActivity(
  db: SQLite.SQLiteDatabase,
  activityId: number,
): Promise<void> {
  await db.runAsync('DELETE FROM activity_shoe_links WHERE activity_id = ?', [activityId]);
}

// ── Stats ──

export async function getShoesStats(db: SQLite.SQLiteDatabase): Promise<{
  totalShoes: number;
  totalKm: number;
  carbonKm: number;
}> {
  const row = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count FROM shoes WHERE retired = 0
  `);

  const totalRow = await db.getFirstAsync<{ total: number }>(`
    SELECT COALESCE(SUM(l.distance_meters), 0) AS total
    FROM activity_shoe_links l
    JOIN shoes s ON s.id = l.shoe_id
  `);

  const carbonRow = await db.getFirstAsync<{ total: number }>(`
    SELECT COALESCE(SUM(l.distance_meters), 0) AS total
    FROM activity_shoe_links l
    JOIN shoes s ON s.id = l.shoe_id
    WHERE s.sole_type = 'carbon'
  `);

  return {
    totalShoes: row?.count ?? 0,
    totalKm: Math.round((totalRow?.total ?? 0) / 1000),
    carbonKm: Math.round((carbonRow?.total ?? 0) / 1000),
  };
}
