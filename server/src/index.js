import "dotenv/config";
import { createDatabase } from "./database.js";
import { createApp } from "./app.js";
import { memoryRepository, prismaRepository } from "./repositories.js";
import { mockReports } from "./mock-data.js";
const storage = process.env.STORAGE ?? "prisma";
if (!["memory", "prisma"].includes(storage))
  throw new Error("STORAGE must be memory or prisma");
if (process.env.NODE_ENV === "production" && storage !== "prisma")
  throw new Error("Production requires PostgreSQL persistence");
if (storage === "prisma" && !process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in server/.env");
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_ORIGINS)
  throw new Error("Set CLIENT_ORIGINS in production");
const prisma = storage === "prisma" ? createDatabase() : null;
if (prisma) await prisma.$connect();
const origins = (
  process.env.CLIENT_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const app = createApp({
  repository: prisma ? prismaRepository(prisma) : memoryRepository(mockReports),
  origins,
  trustProxy: Number(process.env.TRUST_PROXY_HOPS ?? 0),
});
const server = app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0", () =>
  console.log(`API http://localhost:${process.env.PORT ?? 3001} (${storage})`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await prisma?.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
