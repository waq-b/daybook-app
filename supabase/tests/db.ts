// Test harness: a fresh database per test file, with the Supabase stub and
// every migration applied in order, and a way to run SQL as a given user
// exactly as PostgREST would (role authenticated, JWT claims set).
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";

const ADMIN_URL = process.env.TEST_DATABASE_URL;
if (!ADMIN_URL) throw new Error("Set TEST_DATABASE_URL to a Postgres you can create databases on");

const here = new URL(".", import.meta.url);
const migrationsDir = new URL("../migrations/", import.meta.url);

export interface TestDb {
  pool: pg.Pool;
  /** Runs `fn` in a transaction as `userId` (or signed out when null), then rolls back unless `commit`. */
  as<T>(userId: string | null, fn: (c: pg.PoolClient) => Promise<T>, commit?: boolean): Promise<T>;
  /** Inserts an auth user and returns its id. */
  addUser(email: string): Promise<string>;
  close(): Promise<void>;
}

export async function freshDb(): Promise<TestDb> {
  const name = `daybook_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(ADMIN_URL!);
  url.pathname = `/${name}`;
  const pool = new pg.Pool({ connectionString: url.toString(), max: 4 });

  await pool.query(readFileSync(new URL("supabase-stub.sql", here), "utf8"));
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await pool.query(readFileSync(new URL(file, migrationsDir), "utf8"));
  }

  return {
    pool,
    async as(userId, fn, commit = false) {
      const c = await pool.connect();
      try {
        await c.query("begin");
        await c.query(`set local role ${userId ? "authenticated" : "anon"}`);
        await c.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" }),
        ]);
        const result = await fn(c);
        await c.query(commit ? "commit" : "rollback");
        return result;
      } catch (err) {
        await c.query("rollback");
        throw err;
      } finally {
        c.release();
      }
    },
    async addUser(email) {
      const id = randomUUID();
      await pool.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
      return id;
    },
    async close() {
      await pool.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`drop database ${name} with (force)`);
      await a.end();
    },
  };
}
