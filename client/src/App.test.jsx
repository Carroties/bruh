import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
const report = {
  id: "00000000-0000-4000-8000-000000000001",
  type: "LOST",
  itemName: "Tumbler biru navy",
  category: "BOTTLE",
  location: "A206",
  occurredAt: "2026-11-20",
  description: "Botol minum dengan stiker hijau.",
  imageUrl: null,
  createdAt: "2026-11-24T12:00:00Z",
  contact: { method: "EMAIL", value: "demo@example.com" },
};
const listing = {
  data: [report],
  meta: { page: 1, limit: 9, total: 1, totalPages: 1 },
};
const json = (value) => Promise.resolve({ ok: true, json: async () => value });
beforeEach(() => {
  globalThis.fetch = vi.fn((url) =>
    json(
      String(url).endsWith("/health")
        ? { data: { uploadsEnabled: false } }
        : listing,
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function mount(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
test("listing renders API reports, sends search and filter parameters", async () => {
  const user = userEvent.setup();
  mount();
  expect(
    await screen.findByRole("heading", { name: report.itemName }),
  ).toBeVisible();
  await user.type(screen.getByLabelText("Cari nama barang"), "Tumbler");
  await user.click(screen.getByRole("button", { name: /Cari barang/ }));
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("q=Tumbler"),
      expect.anything(),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Found", exact: true }));
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("type=FOUND"),
      expect.anything(),
    ),
  );
});
test("detail displays selected contact and placeholder", async () => {
  fetch.mockImplementation(() => json({ data: report }));
  mount("/reports/" + report.id);
  expect(
    await screen.findByRole("heading", { name: report.itemName }),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: /Kirim email/ })).toHaveAttribute(
    "href",
    "mailto:demo@example.com",
  );
  expect(
    screen.queryByRole("link", { name: /WhatsApp/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Foto belum tersedia")).toBeVisible();
});
test("server outage presents a retry and successfully recovers", async () => {
  fetch.mockRejectedValueOnce(new TypeError("network"));
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Tidak dapat terhubung",
  );
  await userEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  expect(
    await screen.findByRole("heading", { name: report.itemName }),
  ).toBeVisible();
});
test("empty search has a reset action", async () => {
  fetch.mockImplementation(() =>
    json({ data: [], meta: { page: 1, limit: 9, total: 0, totalPages: 0 } }),
  );
  mount("/?q=none");
  expect(await screen.findByText("Belum ada laporan yang cocok")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Lihat semua laporan" }),
  ).toBeEnabled();
});
test("form rejects missing values then submits selected contact and navigates to success", async () => {
  const user = userEvent.setup();
  mount("/reports/new");
  await user.click(screen.getByRole("button", { name: /Publikasikan/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Ada isian");
  await user.type(screen.getByLabelText(/Nama barang/), "Tumbler biru navy");
  await user.selectOptions(screen.getByLabelText(/^Kategori/), "BOTTLE");
  await user.type(screen.getByLabelText(/Tanggal kehilangan/), "2026-11-20");
  await user.type(screen.getByLabelText(/^Lokasi/), "A206");
  await user.type(
    screen.getByLabelText(/Deskripsi barang/),
    "Botol minum dengan stiker hijau.",
  );
  await user.type(screen.getByLabelText(/Alamat email/), "demo@example.com");
  fetch.mockImplementation((url, opts) =>
    opts?.method === "POST"
      ? json({ data: report })
      : json({ data: { uploadsEnabled: false } }),
  );
  await user.click(screen.getByRole("button", { name: /Publikasikan/ }));
  expect(
    await screen.findByRole("heading", { name: "Laporanmu sudah tayang." }),
  ).toBeVisible();
  const post = fetch.mock.calls.find(([, opts]) => opts?.method === "POST");
  expect(post[1].body.get("contactMethod")).toBe("EMAIL");
  expect(post[1].body.get("contactValue")).toBe("demo@example.com");
  expect(post[1].body.has("image")).toBe(false);
});
