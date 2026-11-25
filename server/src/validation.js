import { z } from "zod";
import { TYPES, CATEGORIES } from "./constants.js";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan tanggal YYYY-MM-DD")
  .refine((v) => {
    const parsed = new Date(v + "T00:00:00Z");
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === v &&
      parsed <= new Date()
    );
  }, "Tanggal tidak valid atau berada di masa depan");
export const submissionSchema = z
  .object({
    type: z.enum(TYPES),
    itemName: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10).max(2000),
    category: z.enum(CATEGORIES),
    location: z.string().trim().min(2).max(100),
    occurredAt: date,
    contactMethod: z.enum(["EMAIL", "WHATSAPP"]),
    contactValue: z.string().trim().min(5).max(254),
  })
  .strict()
  .superRefine((v, ctx) => {
    const valid =
      v.contactMethod === "EMAIL"
        ? z.string().email().safeParse(v.contactValue).success
        : /^\+[1-9]\d{7,14}$/.test(v.contactValue);
    if (!valid)
      ctx.addIssue({
        code: "custom",
        path: ["contactValue"],
        message:
          v.contactMethod === "EMAIL"
            ? "Alamat email tidak valid"
            : "Gunakan nomor internasional, contoh +6281234567890",
      });
  });
const positive = (max) =>
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .refine((v) => Number.isSafeInteger(v) && v <= max);
export const querySchema = z
  .object({
    q: z.string().trim().max(100).default(""),
    type: z.enum(TYPES).optional(),
    category: z.enum(CATEGORIES).optional(),
    location: z.string().trim().min(2).max(100).optional(),
    page: positive(1000000).default(1),
    limit: positive(50).default(9),
  })
  .strict();
export const idSchema = z.string().uuid();
