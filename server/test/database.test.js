import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createDatabase } from "../src/database.js";
// Opt-in against an isolated migrated database. Never resets or truncates data.
test(
  "PostgreSQL API persists a report across real backend process restart",
  { skip: !process.env.TEST_DATABASE_URL, timeout: 60000 },
  async () => {
    const database = process.env.TEST_DATABASE_URL;
    const prisma = createDatabase(database);
    let child;
    let id;
    async function start() {
      child = spawn(process.execPath, ["src/index.js"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: database,
          PORT: "3109",
          STORAGE: "prisma",
          NODE_ENV: "test",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let logs = "";
      child.stdout.on("data", (b) => (logs += b));
      child.stderr.on("data", (b) => (logs += b));
      for (let i = 0; i < 100; i++) {
        if (child.exitCode !== null) throw new Error(logs);
        try {
          const r = await fetch("http://127.0.0.1:3109/health");
          if (r.ok) return;
        } catch {
          /* waiting for owned child */
        }
        await delay(100);
      }
      throw new Error("API did not become ready: " + logs);
    }
    async function stop() {
      if (child && child.exitCode === null) {
        const stopped = new Promise((r) => child.once("exit", r));
        child.kill();
        await stopped;
      }
    }
    try {
      await start();
      const response = await fetch("http://127.0.0.1:3109/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOUND",
          itemName: "Persistence test report",
          description: "Created only by the automated integration test.",
          category: "OTHER",
          location: "A206",
          occurredAt: "2026-11-20",
          contactMethod: "EMAIL",
          contactValue: "test@example.com",
        }),
      });
      assert.equal(response.status, 201);
      const created = await response.json();
      id = created.data.id;
      await stop();
      await start();
      const detail = await fetch("http://127.0.0.1:3109/reports/" + id);
      assert.equal(detail.status, 200);
      assert.equal(
        (await detail.json()).data.itemName,
        "Persistence test report",
      );
      const list = await fetch(
        "http://127.0.0.1:3109/reports?q=PERSISTENCE&type=FOUND&location=a206",
      );
      assert.ok((await list.json()).data.some((r) => r.id === id));
    } finally {
      await stop();
      if (id) await prisma.report.delete({ where: { id } });
      await prisma.$disconnect();
    }
  },
);
