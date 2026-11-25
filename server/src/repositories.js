import { randomUUID } from "node:crypto";
export function memoryRepository(seed = []) {
  const rows = structuredClone(seed);
  return {
    async list({ q, type, category, location, page, limit }) {
      const data = rows
        .filter(
          (r) =>
            (!q || r.itemName.toLowerCase().includes(q.toLowerCase())) &&
            (!type || r.type === type) &&
            (!category || r.category === category) &&
            (!location || r.location.toLowerCase() === location.toLowerCase()),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt) ||
            b.id.localeCompare(a.id),
        );
      return {
        data: data.slice((page - 1) * limit, page * limit),
        total: data.length,
      };
    },
    async get(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async create(data) {
      const row = { ...data, id: randomUUID(), createdAt: new Date() };
      rows.push(row);
      return row;
    },
    async health() {
      return true;
    },
  };
}
export function prismaRepository(prisma) {
  return {
    async list({ q, type, category, location, page, limit }) {
      const where = {
        ...(q ? { itemName: { contains: q, mode: "insensitive" } } : {}),
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(location
          ? { location: { equals: location, mode: "insensitive" } }
          : {}),
      };
      const [data, total] = await prisma.$transaction(
        [
          prisma.report.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.report.count({ where }),
        ],
        { isolationLevel: "RepeatableRead" },
      );
      return { data, total };
    },
    get: (id) => prisma.report.findUnique({ where: { id } }),
    create: (data) => prisma.report.create({ data }),
    async health() {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
  };
}
