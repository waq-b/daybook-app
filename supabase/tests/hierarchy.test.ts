import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDb, type TestDb } from "./db";

let db: TestDb;
let alice: string;
let bob: string;
let aliceTask: string;
let bobTask: string;

async function practiceAndTask(user: string) {
  return db.as(
    user,
    async (c) => {
      const p = (
        await c.query(
          "insert into practices (type, name) values ('hierarchy', 'Activity hierarchy') returning id",
        )
      ).rows[0].id;
      return (
        await c.query(
          "insert into tasks (practice_id, name, predicted) values ($1, 'Gym', 7) returning id",
          [p],
        )
      ).rows[0].id as string;
    },
    true,
  );
}

beforeAll(async () => {
  db = await freshDb();
  alice = await db.addUser("alice@example.com");
  bob = await db.addUser("bob@example.com");
  aliceTask = await practiceAndTask(alice);
  bobTask = await practiceAndTask(bob);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("hierarchy (0c)", () => {
  it("needs both scores on every rep, attempts too (D3)", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (task_id, actual) values ($1, 5)", [aliceTask]),
      ),
    ).rejects.toThrow(/null value in column "remaining"/);
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (task_id, remaining, left_early) values ($1, 5, true)", [
          aliceTask,
        ]),
      ),
    ).rejects.toThrow(/null value in column "actual"/);
  });

  it("takes a rep with a client-made id, and the same id again is refused (no duplicates)", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    await db.as(
      alice,
      (c) =>
        c.query("insert into reps (id, task_id, actual, remaining) values ($1, $2, 5, 4)", [
          id,
          aliceTask,
        ]),
      true,
    );
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (id, task_id, actual, remaining) values ($1, $2, 5, 4)", [
          id,
          aliceTask,
        ]),
      ),
    ).rejects.toThrow(/duplicate key/);
    // What the outbox actually sends: an upsert that ignores a row already there.
    const count = await db.as(alice, async (c) => {
      await c.query(
        "insert into reps (id, task_id, actual, remaining) values ($1, $2, 5, 4) on conflict (id) do nothing",
        [id, aliceTask],
      );
      return Number((await c.query("select count(*) from reps where id = $1", [id])).rows[0].count);
    });
    expect(count).toBe(1);
  });

  it("won't log a rep on someone else's task", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query("insert into reps (task_id, actual, remaining) values ($1, 5, 4)", [bobTask]),
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("keeps 'Before the next one' on the task", async () => {
    const row = await db.as(
      alice,
      async (c) =>
        (
          await c.query(
            "update tasks set next_prediction = 'They will stare', next_prediction_likelihood = 'very' where id = $1 returning next_prediction, next_prediction_likelihood",
            [aliceTask],
          )
        ).rows[0],
    );
    expect(row).toEqual({ next_prediction: "They will stare", next_prediction_likelihood: "very" });
  });

  it("only lets a repeating task have reps per week", async () => {
    await expect(
      db.as(alice, (c) =>
        c.query("update tasks set repeating = false, reps_per_week = 3 where id = $1", [aliceTask]),
      ),
    ).rejects.toThrow(/tasks_reps_per_week_only_when_repeating/);
    await db.as(alice, (c) =>
      c.query("update tasks set repeating = true, reps_per_week = 3 where id = $1", [aliceTask]),
    );
  });
});
