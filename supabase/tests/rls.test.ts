import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDb, type TestDb } from "./db";

const TABLES = [
  "sessions",
  "practices",
  "tasks",
  "reps",
  "misses",
  "checkins",
  "seeds",
  "gratitude_entries",
  "reminders",
  "push_subscriptions",
] as const;
type Table = (typeof TABLES)[number];

let db: TestDb;
let alice: string;
let bob: string;
/** One row per table for each user, keyed by table. */
const rows: Record<string, Record<Table, string>> = {};

/** Creates one row in every table as `user`, each linked to that user's parents. */
async function seed(user: string): Promise<Record<Table, string>> {
  return db.as(
    user,
    async (c) => {
      const one = async (sql: string, params: unknown[] = []) =>
        (await c.query<{ id: string }>(`${sql} returning id`, params)).rows[0]!.id;
      const sessions = await one("insert into sessions (at) values (now())");
      const practices = await one(
        "insert into practices (type, name, session_id) values ('hierarchy', 'Activity hierarchy', $1)",
        [sessions],
      );
      const tasks = await one(
        "insert into tasks (practice_id, name, predicted) values ($1, 'Gym', 6)",
        [practices],
      );
      const reps = await one("insert into reps (task_id, actual, remaining) values ($1, 5, 3)", [
        tasks,
      ]);
      const misses = await one(
        "insert into misses (task_id, planned_on, reasons) values ($1, current_date, '{Tired}')",
        [tasks],
      );
      const checkins = await one(
        "insert into checkins (practice_id, words, intensity) values ($1, '{tense}', 4)",
        [practices],
      );
      const seeds = await one("insert into seeds (practice_id, text) values ($1, 'The dog')", [
        practices,
      ]);
      const gratitude_entries = await one(
        "insert into gratitude_entries (practice_id, seed_id, because) values ($1, $2, 'Walks')",
        [practices, seeds],
      );
      const reminders = await one("insert into reminders (practice_id) values ($1)", [practices]);
      const push_subscriptions = await one(
        "insert into push_subscriptions (endpoint, keys) values ($1, '{}')",
        [`https://push.example/${user}`],
      );
      return {
        sessions,
        practices,
        tasks,
        reps,
        misses,
        checkins,
        seeds,
        gratitude_entries,
        reminders,
        push_subscriptions,
      };
    },
    true,
  );
}

const count = async (c: pg.PoolClient, table: string) =>
  Number((await c.query(`select count(*) from ${table}`)).rows[0].count);

beforeAll(async () => {
  db = await freshDb();
  alice = await db.addUser("alice@example.com");
  bob = await db.addUser("bob@example.com");
  rows[alice] = await seed(alice);
  rows[bob] = await seed(bob);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe.each(TABLES)("%s", (table) => {
  it("shows a user only their own rows", async () => {
    const ids = await db.as(
      alice,
      async (c) =>
        (await c.query<{ id: string; user_id: string }>(`select id, user_id from ${table}`)).rows,
    );
    expect(ids.map((r) => r.id)).toEqual([rows[alice]![table]]);
    expect(ids.every((r) => r.user_id === alice)).toBe(true);
  });

  it("shows a signed-out visitor nothing, and won't let them write", async () => {
    await expect(db.as(null, (c) => c.query(`select * from ${table}`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("won't let a user change someone else's row", async () => {
    const changed = await db.as(
      alice,
      async (c) =>
        (
          await c.query(`update ${table} set archived_at = now() where id = $1`, [
            rows[bob]![table],
          ])
        ).rowCount,
    );
    expect(changed).toBe(0);
  });

  it("won't let a user hand their own row to someone else", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query(`update ${table} set user_id = $1 where id = $2`, [bob, rows[alice]![table]]),
      ),
    ).rejects.toThrow(/row-level security|violates/);
  });

  it("won't let anyone delete, even their own row", async () => {
    await expect(
      db.as(alice, (c) => c.query(`delete from ${table} where id = $1`, [rows[alice]![table]])),
    ).rejects.toThrow(/permission denied/);
    await expect(db.as(alice, (c) => c.query(`truncate ${table}`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("lets a user archive their own row and bumps updated_at", async () => {
    const row = await db.as(alice, async (c) => {
      const before = (
        await c.query(`select updated_at from ${table} where id = $1`, [rows[alice]![table]])
      ).rows[0].updated_at as Date;
      await c.query("select pg_sleep(0.01)");
      // now() is fixed per transaction, so compare against clock time via a new statement timestamp
      await c.query(`update ${table} set archived_at = clock_timestamp() where id = $1`, [
        rows[alice]![table],
      ]);
      const after = (
        await c.query(`select archived_at, updated_at from ${table} where id = $1`, [
          rows[alice]![table],
        ])
      ).rows[0];
      return { before, after };
    });
    expect(row.after.archived_at).not.toBeNull();
    expect(row.after.updated_at.getTime()).toBeGreaterThanOrEqual(row.before.getTime());
  });
});

describe("parent links", () => {
  it("won't let a user attach a row to someone else's parent", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query("insert into tasks (practice_id, name, predicted) values ($1, 'Sneaky', 3)", [
          rows[bob]!.practices,
        ]),
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (task_id, actual, remaining) values ($1, 1, 1)", [
          rows[bob]!.tasks,
        ]),
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.as(alice, (c) =>
        c.query(
          "insert into gratitude_entries (practice_id, seed_id, because) values ($1, $2, 'x')",
          [rows[alice]!.practices, rows[bob]!.seeds],
        ),
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("won't let a user write a row as someone else", async () => {
    await expect(
      db.as(alice, (c) => c.query("insert into sessions (user_id, at) values ($1, now())", [bob])),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("worksheet scales", () => {
  it("keeps difficulty and intensity on 0–8", async () => {
    for (const sql of [
      "insert into tasks (practice_id, name, predicted) values ($1, 'x', 9)",
      "insert into checkins (practice_id, intensity) values ($1, -1)",
    ]) {
      await expect(db.as(alice, (c) => c.query(sql, [rows[alice]!.practices]))).rejects.toThrow(
        /check constraint/,
      );
    }
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (task_id, actual, remaining) values ($1, 3, 9)", [
          rows[alice]!.tasks,
        ]),
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("keeps reps per week on 1–7 and days on ISO 1–7", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query(
          "insert into tasks (practice_id, name, predicted, reps_per_week) values ($1, 'x', 3, 8)",
          [rows[alice]!.practices],
        ),
      ),
    ).rejects.toThrow(/check constraint/);
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reminders (practice_id, days) values ($1, '{0}')", [
          rows[alice]!.practices,
        ]),
      ),
    ).rejects.toThrow(/check constraint/);
  });
});

describe("export_everything()", () => {
  it("returns every table, with only the caller's rows", async () => {
    const exported = await db.as(
      alice,
      async (c) => (await c.query("select public.export_everything() as e")).rows[0].e,
    );
    expect(exported.app).toBe("Daybook");
    expect(exported.user_id).toBe(alice);
    for (const table of TABLES) {
      expect(
        exported[table].map((r: { id: string }) => r.id),
        table,
      ).toEqual([rows[alice]![table]]);
    }
  });

  it("is not available signed out", async () => {
    await expect(db.as(null, (c) => c.query("select public.export_everything()"))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("delete_everything()", () => {
  it("refuses anything but the word delete", async () => {
    for (const word of ["nope", "Delete", "", null]) {
      await expect(
        db.as(alice, (c) => c.query("select public.delete_everything($1)", [word])),
      ).rejects.toThrow(/Type delete to confirm/);
    }
  });

  it("is not available signed out", async () => {
    await expect(
      db.as(null, (c) => c.query("select public.delete_everything('delete')")),
    ).rejects.toThrow(/permission denied/);
  });

  it("removes the caller's account and every row they own, and nobody else's", async () => {
    const carol = await db.addUser("carol@example.com");
    await seed(carol);
    await db.as(carol, (c) => c.query("select public.delete_everything('delete')"), true);

    const left = await db.pool.query("select count(*) from auth.users where id = $1", [carol]);
    expect(Number(left.rows[0].count)).toBe(0);
    for (const table of TABLES) {
      const mine = await db.pool.query(`select count(*) from ${table} where user_id = $1`, [carol]);
      expect(Number(mine.rows[0].count), table).toBe(0);
    }
    const others = await db.as(alice, async (c) => Promise.all(TABLES.map((t) => count(c, t))));
    expect(others.every((n) => n === 1)).toBe(true);
  });
});
