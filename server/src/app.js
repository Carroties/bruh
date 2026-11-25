import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { submissionSchema, querySchema, idSchema } from "./validation.js";
import { createImageService, HttpError } from "./upload.js";
export function publicReport(row, detail = false) {
  const date = (v) => (v instanceof Date ? v.toISOString() : v);
  const result = {
    id: row.id,
    type: row.type,
    itemName: row.itemName,
    description: row.description,
    category: row.category,
    location: row.location,
    occurredAt: date(row.occurredAt).slice(0, 10),
    imageUrl: row.imageUrl ?? null,
    createdAt: date(row.createdAt),
  };
  if (detail)
    result.contact = { method: row.contactMethod, value: row.contactValue };
  return result;
}
export function createApp({
  repository,
  origins = ["http://localhost:5173", "http://127.0.0.1:5173"],
  imageService = createImageService(),
  trustProxy = 0,
  rateLimits = true,
}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || origins.includes(origin)) cb(null, true);
        else
          cb(
            new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origin tidak diizinkan."),
          );
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 8,
      fieldSize: 8000,
      parts: 10,
    },
  }).single("image");
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      res
        .status(429)
        .json({
          error: {
            code: "RATE_LIMITED",
            message: "Terlalu banyak laporan. Coba lagi nanti.",
          },
        }),
  });
  app.get("/health", async (_req, res) => {
    await repository.health();
    res.json({
      data: { status: "ok", uploadsEnabled: !!imageService.configured },
    });
  });
  app.get("/reports", async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error);
    const { data, total } = await repository.list(parsed.data);
    const { page, limit } = parsed.data;
    res.json({
      data: data.map((r) => publicReport(r)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
  app.get("/reports/:id", async (req, res) => {
    if (!idSchema.safeParse(req.params.id).success)
      throw new HttpError(400, "INVALID_ID", "ID laporan tidak valid.");
    const row = await repository.get(req.params.id);
    if (!row) throw new HttpError(404, "NOT_FOUND", "Laporan tidak ditemukan.");
    res.json({ data: publicReport(row, true) });
  });
  app.post(
    "/reports",
    ...(rateLimits ? [limiter] : []),
    (req, res, next) => {
      if (!req.is("application/json") && !req.is("multipart/form-data"))
        return next(
          new HttpError(
            415,
            "UNSUPPORTED_MEDIA_TYPE",
            "Gunakan application/json atau multipart/form-data.",
          ),
        );
      if (req.is("multipart/form-data")) upload(req, res, next);
      else next();
    },
    async (req, res) => {
      const parsed = submissionSchema.safeParse(req.body);
      if (!parsed.success) return validationError(res, parsed.error);
      let image = { imageUrl: null, imagePublicId: null };
      if (req.file) image = await imageService.upload(req.file);
      let row;
      try {
        row = await repository.create({
          ...parsed.data,
          occurredAt: new Date(parsed.data.occurredAt + "T00:00:00Z"),
          ...image,
        });
      } catch (error) {
        if (image.imagePublicId) {
          try {
            await imageService.remove(image.imagePublicId);
          } catch {
            console.error("Image cleanup failed; reconciliation required.");
          }
        }
        throw error;
      }
      res
        .status(201)
        .location(`/reports/${row.id}`)
        .json({ data: publicReport(row, true) });
    },
  );
  app.use((_req, res) =>
    res
      .status(404)
      .json({
        error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." },
      }),
  );
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError)
      return res
        .status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        .json({
          error: {
            code: err.code,
            message:
              err.code === "LIMIT_FILE_SIZE"
                ? "Ukuran foto maksimal 5 MB."
                : "Format unggahan tidak valid.",
          },
        });
    if (err.type === "entity.parse.failed")
      return res
        .status(400)
        .json({
          error: { code: "INVALID_JSON", message: "JSON tidak valid." },
        });
    if (err.type === "entity.too.large")
      return res
        .status(413)
        .json({
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Isi permintaan terlalu besar.",
          },
        });
    const status = err instanceof HttpError ? err.status : 503;
    if (!(err instanceof HttpError))
      console.error("Request failed:", err.code ?? err.name);
    res
      .status(status)
      .json({
        error: {
          code: err instanceof HttpError ? err.code : "SERVICE_UNAVAILABLE",
          message:
            err instanceof HttpError
              ? err.message
              : "Layanan sementara tidak tersedia. Silakan coba lagi.",
        },
      });
  });
  return app;
}
function validationError(res, error) {
  return res
    .status(400)
    .json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Periksa kembali isian Anda.",
        fields: error.flatten(),
      },
    });
}
