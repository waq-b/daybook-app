import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDb, type TestDb } from "./db";

let db: TestDb;
let alice: string;
let bob: string;
let bobSession: string;

beforeAll(async () => {
  db = await freshDb();
  alice = await db.addUser("alice@example.com");
  bob = await db.addUser("bob@example.com");
  bobSession = await db.as(
    bob,
    async (c) =>
      (await c.query("insert into sessions (at) values (now()) returning id")).rows[0].id as string,
    true,
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("sessions (0b)", () => {
  it("keeps the assigned note, and it comes back in the export", async () => {
    const exported = await db.as(alice, async (c) => {
      await c.query(
        "insert into sessions (at, notes, assigned_note) values (now(), 'Notes', 'Notice my phone')",
      );
      return (await c.query("select public.export_everything() as e")).rows[0].e;
    });
    expect(exported.sessions[0]).toMatchObject({
      notes: "Notes",
      assigned_note: "Notice my phone",
    });
  });

  it("lets a user mark their own session done", async () => {
    const done = await db.as(alice, async (c) => {
      const id = (await c.query("insert into sessions (at) values (now()) returning id")).rows[0]
        .id;
      return (
        await c.query("update sessions set done_at = now() where id = $1 returning done_at", [id])
      ).rows[0].done_at;
    });
    expect(done).toBeInstanceOf(Date);
  });

  it("won't let a user mark someone else's session done", async () => {
    const changed = await db.as(
      alice,
      async (c) =>
        (await c.query("update sessions set done_at = now() where id = $1", [bobSession])).rowCount,
    );
    expect(changed).toBe(0);
  });
});
