const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);
export const mockMode = import.meta.env.VITE_USE_MOCKS === "true";
export async function request(path, { signal, body } = {}) {
  if (mockMode) {
    const { mockRequest } = await import("./mock-api.js");
    return mockRequest(path, { body });
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(BASE + path, {
      signal: controller.signal,
      ...(body ? { method: "POST", body } : {}),
    });
    const json = await response.json();
    if (!response.ok) {
      const error = new Error(json.error?.message || "Permintaan gagal.");
      error.fields = json.error?.fields?.fieldErrors;
      error.status = response.status;
      throw error;
    }
    return json;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === "AbortError")
      throw new Error("Permintaan terlalu lama. Silakan coba lagi.");
    if (error instanceof TypeError)
      throw new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
