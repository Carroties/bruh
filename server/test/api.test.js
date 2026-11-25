import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { memoryRepository } from "../src/repositories.js";
import { mockReports } from "../src/mock-data.js";
const payload = {
  type: "LOST",
  itemName: "Tumbler hijau",
  category: "BOTTLE",
  location: "A206",
  occurredAt: "2026-11-20",
  description: "Tumbler hijau dengan stiker kucing.",
  contactMethod: "EMAIL",
  contactValue: "student@example.com",
};
const setup = (options = {}) =>
  createApp({
    repository: memoryRepository(mockReports),
    rateLimits: false,
    ...options,
  });
test("listing contract, case insensitive item search, intersection filters and pagination", async () => {
  const app = setup();
  const list = await request(app).get("/reports").expect(200);
  assert.deepEqual(list.body.meta, {
    page: 1,
    limit: 9,
    total: 12,
    totalPages: 2,
  });
  assert.equal(list.body.data.length, 9);
  assert.equal("contact" in list.body.data[0], false);
  assert.equal("contactValue" in list.body.data[0], false);
  const result = await request(app)
    .get("/reports?q=TUMBLER&type=LOST&category=BOTTLE&location=a206&limit=1")
    .expect(200);
  assert.equal(result.body.meta.total, 1);
  assert.equal(result.body.data[0].id, mockReports[0].id);
  assert.equal(
    (await request(app).get("/reports?page=2&limit=9")).body.data.length,
    3,
  );
  assert.deepEqual((await request(app).get("/reports?page=100")).body.data, []);
  assert.equal(
    (await request(app).get("/reports?q=not-existing")).body.meta.totalPages,
    0,
  );
});
test("invalid query, ID, missing record, unknown field and unsupported methods", async () => {
  const app = setup();
  for (const q of [
    "page=0",
    "limit=51",
    "page=1.5",
    "type=INVALID",
    "q=a&q=b",
    "unknown=x",
    "page=1e3",
  ])
    await request(app)
      .get("/reports?" + q)
      .expect(400);
  await request(app).get("/reports/not-a-uuid").expect(400);
  await request(app)
    .get("/reports/00000000-0000-4000-8000-999999999999")
    .expect(404);
  await request(app)
    .delete("/reports/" + mockReports[0].id)
    .expect(404);
  await request(app)
    .patch("/reports/" + mockReports[0].id)
    .send({ itemName: "hacked" })
    .expect(404);
});
test("JSON and multipart submissions preserve detail-only selected contact", async () => {
  const app = setup();
  const result = await request(app).post("/reports").send(payload).expect(201);
  assert.equal(result.headers.location, "/reports/" + result.body.data.id);
  assert.equal(result.body.data.imageUrl, null);
  const detail = await request(app).get(result.headers.location).expect(200);
  assert.deepEqual(detail.body.data.contact, {
    method: "EMAIL",
    value: payload.contactValue,
  });
  assert.equal("imagePublicId" in detail.body.data, false);
  const multipart = request(app).post("/reports");
  for (const [k, v] of Object.entries({
    ...payload,
    contactMethod: "WHATSAPP",
    contactValue: "+6281234567890",
  }))
    multipart.field(k, v);
  assert.equal(
    (await multipart.expect(201)).body.data.contact.method,
    "WHATSAPP",
  );
});
test("submission validation rejects impossible/future dates, invalid contacts and extra private fields", async () => {
  const app = setup();
  for (const change of [
    { itemName: "x" },
    { description: "short" },
    { occurredAt: "2026-02-30" },
    { occurredAt: "2099-01-01" },
    { contactValue: "javascript:alert(1)" },
    { contactMethod: "WHATSAPP", contactValue: "08123" },
    { privateEmail: "secret@example.com" },
    { type: "OTHER" },
  ]) {
    const result = await request(app)
      .post("/reports")
      .send({ ...payload, ...change })
      .expect(400);
    assert.equal(result.body.error.code, "VALIDATION_ERROR");
  }
  await request(app)
    .post("/reports")
    .set("Content-Type", "application/json")
    .send("{bad")
    .expect(400);
  await request(app).post("/reports").type("text").send("text").expect(415);
  await request(app)
    .post("/reports")
    .send({ ...payload, description: "a".repeat(40000) })
    .expect(413);
});
test("CORS only permits configured browser origins", async () => {
  const app = setup();
  const ok = await request(app)
    .get("/reports")
    .set("Origin", "http://localhost:5173")
    .expect(200);
  assert.equal(
    ok.headers["access-control-allow-origin"],
    "http://localhost:5173",
  );
  await request(app)
    .options("/reports")
    .set("Origin", "http://localhost:5173")
    .set("Access-Control-Request-Method", "POST")
    .expect(204);
  await request(app)
    .get("/reports")
    .set("Origin", "https://untrusted.example")
    .expect(403);
});
test("image size, true file signature, disabled provider and unknown upload field", async () => {
  const app = setup();
  const post = (buf, name, type, field = "image") => {
    let r = request(app).post("/reports");
    for (const [k, v] of Object.entries(payload)) r = r.field(k, v);
    return r.attach(field, buf, { filename: name, contentType: type });
  };
  await post(
    Buffer.alloc(5 * 1024 * 1024 + 1),
    "large.jpg",
    "image/jpeg",
  ).expect(413);
  await post(Buffer.from("<svg>bad</svg>"), "fake.jpg", "image/jpeg").expect(
    415,
  );
  await post(Buffer.from("anything"), "file.txt", "text/plain", "other").expect(
    400,
  );
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
    "base64",
  );
  await post(png, "valid.png", "image/png").expect(503);
});
test("successful image reference and compensation on database failure", async () => {
  const removed = [];
  const service = {
    configured: true,
    upload: async () => ({
      imageUrl: "https://res.cloudinary.com/demo/image/upload/item.png",
      imagePublicId: "demo/item",
    }),
    remove: async (id) => removed.push(id),
  };
  let app = setup({ imageService: service });
  let post = request(app).post("/reports");
  for (const [k, v] of Object.entries(payload)) post = post.field(k, v);
  const result = await post
    .attach("image", Buffer.from("test"), {
      filename: "test.png",
      contentType: "image/png",
    })
    .expect(201);
  assert.ok(result.body.data.imageUrl);
  assert.equal("imagePublicId" in result.body.data, false);
  const repo = memoryRepository();
  repo.create = async () => {
    throw new Error("DB unavailable");
  };
  app = setup({ imageService: service, repository: repo });
  post = request(app).post("/reports");
  for (const [k, v] of Object.entries(payload)) post = post.field(k, v);
  await post
    .attach("image", Buffer.from("test"), {
      filename: "test.png",
      contentType: "image/png",
    })
    .expect(503);
  assert.deepEqual(removed, ["demo/item"]);
});
test("rate limit returns the JSON error envelope", async () => {
  const app = setup({ rateLimits: true });
  for (let i = 0; i < 20; i++)
    await request(app).post("/reports").send({}).expect(400);
  const r = await request(app).post("/reports").send(payload).expect(429);
  assert.equal(r.body.error.code, "RATE_LIMITED");
});
