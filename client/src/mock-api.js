import { mockReports } from "../../server/src/mock-data.js";
// Mock mode only: same contract, same canonical records. No persistence.
const rows = structuredClone(mockReports);
const publicRow = (r, detail = false) => {
  const { contactMethod, contactValue, imagePublicId: _image, ...rest } = r;
  return {
    ...rest,
    ...(detail
      ? { contact: { method: contactMethod, value: contactValue } }
      : {}),
  };
};
export async function mockRequest(path, { body } = {}) {
  if (path === "/health")
    return { data: { status: "ok", uploadsEnabled: false } };
  if (body) {
    if (body.get("image")?.size)
      throw new Error("Mode mock tidak mendukung unggah foto.");
    const row = {
      ...Object.fromEntries(body),
      id: crypto.randomUUID(),
      imageUrl: null,
      createdAt: new Date().toISOString(),
    };
    rows.unshift(row);
    return { data: publicRow(row, true) };
  }
  const url = new URL(path, "http://mock");
  if (url.pathname === "/reports") {
    const p = url.searchParams;
    const page = Number(p.get("page") || 1),
      limit = Number(p.get("limit") || 9);
    const filtered = rows.filter(
      (r) =>
        (!p.get("q") ||
          r.itemName.toLowerCase().includes(p.get("q").toLowerCase())) &&
        ["type", "category", "location"].every(
          (k) => !p.get(k) || r[k] === p.get(k),
        ),
    );
    return {
      data: filtered
        .slice((page - 1) * limit, page * limit)
        .map((r) => publicRow(r)),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }
  const row = rows.find((r) => r.id === path.split("/").pop());
  if (!row) {
    const e = new Error("Laporan tidak ditemukan.");
    e.status = 404;
    throw e;
  }
  return { data: publicRow(row, true) };
}
