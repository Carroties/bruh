# Checkpoint 1 Project Preparation

Deadline pada brief: **16 November 2026**. Dokumen ini mencatat rencana dan keputusan implementasi, bukan bukti pengumpulan pada tanggal tersebut.

## Masalah dan tujuan

Kabar barang hilang di WhatsApp bisa tertimbun dan tidak menjangkau semua mahasiswa. Temu menyediakan Public Report Listing & Details, Search & Filtering, Report Submission, Image Placeholder, dan Contact Privacy untuk Lost/Found di Fasilkom UI.

## Halaman dan user flow

| Halaman    | Route          | Perilaku                                                                                                 |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| Listing    | `/`            | Browse laporan terbaru, search nama barang, filter tipe/kategori/lokasi, pagination, empty/error/loading |
| Detail     | `/reports/:id` | Deskripsi, lokasi, tanggal kejadian, foto/placeholder, satu kontak publik                                |
| Submission | `/reports/new` | Tipe Lost/Found, field wajib, foto opsional, preview, validasi, konfirmasi sukses                        |
| Not found  | route lain     | Tautan kembali ke listing                                                                                |

Alur pencari: listing → pencarian/filter → detail → kontak pilihan pelapor. Alur pelapor: buat laporan → isi detail dan satu kontak publik → foto opsional → kirim → sukses → detail. Kontak langsung melalui email/WhatsApp; bukan chat internal.

## Tanggung jawab tim

Brief menetapkan 3 peserta: 1 BE dan 2 FE. Nama belum diberikan; penugasan ini adalah usulan untuk dikonfirmasi.

| Role                  | Kepemilikan                                                            | Review pasangan                |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| BE, nama belum diisi  | Contract, Express, PostgreSQL/Prisma, migrasi, Cloudinary, hosting API | FE1 memeriksa respons dan CORS |
| FE1, nama belum diisi | Listing, detail, search/filter, pagination, API client                 | BE memeriksa query dan privacy |
| FE2, nama belum diisi | Submission, upload preview, responsive CSS, aksesibilitas, feedback    | FE1 memeriksa alur mobile      |
| Semua anggota         | README, testing, review PR, demo, deployment verification              | Saling menjelaskan kode        |

## Urutan pekerjaan

1. CP1: sepakati field/schema, API, pagination, submission format dan canonical mock; setup repo/env.
2. CP2: FE membangun halaman memakai fixture yang sama; BE menjalankan endpoints dengan memory repository; test kontrak dan siapkan CORS/hosting API.
3. CP3: migrasi Prisma dan seed ke PostgreSQL; ganti FE ke API sungguhan; integrasi Cloudinary; uji restart, privacy, responsive states; deploy dan Demo Day.

## Definition of done dan risiko

Selesai secara lokal ketika lint/build/tests lulus, API dapat dipakai frontend tanpa mock, laporan tersimpan setelah restart, dan dokumentasi dapat dipakai anggota lain. Selesai deployment ketika URL FE/API terverifikasi, migrasi production applied, Cloudinary teruji, dan GitHub/URL disampaikan ke mentor. Status aktual ada di VERIFICATION dan REQUIREMENTS.

Risiko: ketidaksesuaian field dihindari dengan satu fixture/contract; data hilang dihindari dengan default Prisma dan volume persisten; kontak bocor dihindari dengan serializer allowlist dan hanya satu field kontak; upload gagal memberi error tanpa membuat record parsial; biaya/secret hosting diselesaikan pemilik akun; commit history tidak boleh dibuat seolah dikerjakan pada deadline lampau.

## Artefak desain

Field, tipe, relasi, indeks dan pemetaan Week 3: [DATABASE](DATABASE.md). Format REST, respons dan query: [API](API.md). Fixture yang sama dipakai FE/BE/seed: `server/src/mock-data.js` (12 record deterministik, 6 LOST + 6 FOUND, semua kategori dan enam lokasi, tanpa gambar agar placeholder teruji). ID stabil berbentuk UUID; tanggal stabil November 2026; semua kontak sintetis. `client/src/mock-api.js` mengimpor fixture ini secara langsung.

Repository disiapkan sebagai monorepo dengan workspace `client` dan `server` agar contract, fixture, CI, dan lockfile tetap satu sumber. Brief menyebut repositories; pemakaian satu monorepo diasumsikan boleh dan perlu dikonfirmasi mentor bila diwajibkan dua repository.
