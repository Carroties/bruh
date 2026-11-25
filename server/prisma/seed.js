import "dotenv/config";
import { createDatabase } from "../src/database.js";
import { mockReports } from "../src/mock-data.js";
const prisma = createDatabase();
try {
  for (const row of mockReports)
    await prisma.report.upsert({
      where: { id: row.id },
      update: {},
      create: {
        ...row,
        occurredAt: new Date(row.occurredAt + "T00:00:00Z"),
        createdAt: new Date(row.createdAt),
      },
    });
  console.log("12 demo reports seeded; existing reports preserved.");
} finally {
  await prisma.$disconnect();
}
