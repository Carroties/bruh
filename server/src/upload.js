import { v2 as cloudinary } from "cloudinary";
import { fileTypeFromBuffer } from "file-type";
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function createImageService(env = process.env) {
  const configured = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].every((k) => !!env[k]);
  if (configured)
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  return {
    configured,
    async upload(file) {
      const kind = await fileTypeFromBuffer(file.buffer);
      if (
        !kind ||
        !["image/jpeg", "image/png", "image/webp"].includes(kind.mime) ||
        kind.mime !== file.mimetype
      )
        throw new HttpError(
          415,
          "INVALID_IMAGE",
          "Foto harus berupa JPEG, PNG, atau WebP yang valid.",
        );
      if (!configured)
        throw new HttpError(
          503,
          "UPLOAD_UNAVAILABLE",
          "Unggah foto belum dikonfigurasi. Kirim laporan tanpa foto.",
        );
      try {
        return await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "pacil-lost-found",
                resource_type: "image",
                allowed_formats: ["jpg", "png", "webp"],
                transformation: [
                  { width: 1600, height: 1600, crop: "limit" },
                  { flags: "strip_profile" },
                ],
                timeout: 30000,
              },
              (error, result) =>
                error
                  ? reject(error)
                  : resolve({
                      imageUrl: result.secure_url,
                      imagePublicId: result.public_id,
                    }),
            )
            .end(file.buffer);
        });
      } catch {
        throw new HttpError(
          502,
          "UPLOAD_FAILED",
          "Foto gagal diunggah. Silakan coba lagi.",
        );
      }
    },
    async remove(publicId) {
      if (configured) await cloudinary.uploader.destroy(publicId);
    },
  };
}
