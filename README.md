# Temu — Lost & Found Fasilkom UI

Aplikasi Final Project Web Development RISTEK Open Class 2026 untuk mempertemukan mahasiswa yang kehilangan dan menemukan barang. Stack: React + Vite, HTML/CSS/JavaScript, Node/Express, PostgreSQL, Prisma ORM, Cloudinary, dan GitHub workflow.

## Mulai dari sini

- [Project plan dan pembagian tanggung jawab](docs/CHECKPOINT-1.md)
- [Database design dan pemetaan Prisma](docs/DATABASE.md)
- [REST API contract](docs/API.md)
- [Checkpoint 2 dan mock development](docs/CHECKPOINT-2.md)
- [Checkpoint 3 dan integration acceptance](docs/CHECKPOINT-3.md)
- [Deployment dan GitHub](docs/DEPLOYMENT.md)
- [Demo Day dan naskah presentasi](docs/DEMO.md)
- [Matriks requirement brief](docs/REQUIREMENTS.md)
- [Hasil verifikasi aktual](docs/VERIFICATION.md)

Brief sumber: **Final Project Webdev 2026(2).docx**, OPEN CLASS FINAL PROJECT WEBSITE DEVELOPMENT RISTEK FASILKOM UI 2026. Deadline asli: CP1 16 November, CP2 19 November, CP3 22 November 2026. Source ini disiapkan pada 25 November 2026; tidak ada klaim pengumpulan tepat waktu atau riwayat kerja tim yang belum terjadi.

## Menjalankan aplikasi

Prasyarat: Node.js 22.12+ (disarankan Node 22 LTS), npm, PostgreSQL 17+ atau Docker. Gunakan satu terminal dari root folder `lost-found`.

```sh
npm ci
```

Salin `server/.env.example` menjadi `server/.env` dan `client/.env.example` menjadi `client/.env`. Di PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Untuk database lokal memakai Docker:

```sh
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Buka frontend pada `http://localhost:5173`, API `http://localhost:3001`, readiness `http://localhost:3001/health`. Jika sudah memiliki PostgreSQL, buat database kosong dan sesuaikan `DATABASE_URL`; Docker tidak diperlukan. Seed menambah 12 laporan contoh secara idempotent tanpa menghapus laporan. Semua kontak seed adalah data demo, bukan kontak untuk dihubungi. Jangan seed data demo ke produksi kecuali memang diinginkan.

Database adalah default; backend gagal dengan pesan konfigurasi ketika `DATABASE_URL` belum tersedia. `STORAGE=memory` hanya untuk CP2/development dan dilarang pada `NODE_ENV=production`. Data mode memory hilang saat restart. Frontend final memakai API (`VITE_USE_MOCKS=false`); tidak ada fallback otomatis ke mock ketika API gagal.

Cloudinary opsional bagi pengguna yang mengirim laporan tanpa foto. Agar fitur unggah foto aktif, isi ketiga `CLOUDINARY_*` di `server/.env`, restart backend. Secret tetap di server. Tanpa konfigurasi, frontend tetap menerima laporan teks dan memakai placeholder; pengiriman file langsung ke API mendapat 503. Detail [format unggahan](docs/API.md).

## Perintah

| Perintah                                         | Fungsi                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| `npm run dev`                                    | Frontend dan backend dengan reload                        |
| `npm run build`                                  | Generate Prisma Client dan build frontend produksi        |
| `npm start`                                      | Backend produksi; membutuhkan env dan database termigrasi |
| `npm run lint`                                   | ESLint seluruh JavaScript/JSX                             |
| `npm test`                                       | Uji contract/API dan interaksi frontend                   |
| `npm run test:db`                                | Uji persistence PostgreSQL, opt-in `TEST_DATABASE_URL`    |
| `npm run db:migrate`                             | Apply migrasi committed dengan `prisma migrate deploy`    |
| `npm run db:dev -w server -- --name change_name` | Membuat migrasi baru hanya di database development        |
| `npm run db:seed`                                | Seed fixture canonical                                    |

Prisma CLI, Client, dan adapter-pg dipin ke 7.10.1 agar schema dan workflow migrasi konsisten. PostgreSQL memakai driver adapter dengan connection timeout 5 detik. `prisma.config.js` memuat URL database; generator `prisma-client-js` menghasilkan JavaScript tanpa kebutuhan TypeScript. Jangan memperbarui major Prisma tanpa menyesuaikan konfigurasi dan menguji migrasi. Lockfile disertakan untuk instalasi yang dapat direproduksi.

Untuk test persistence di PowerShell, gunakan database pengujian terpisah yang sudah dimigrasi:

```powershell
$env:DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/lostfound_test?schema=public'
$env:TEST_DATABASE_URL=$env:DATABASE_URL
npm run db:migrate
npm run test:db
```

Test membuat satu laporan, menghentikan proses API miliknya, menyalakannya kembali, lalu membaca laporan yang sama. Hanya record test tersebut yang dihapus setelah selesai. Port 3109 harus kosong. Tanpa `TEST_DATABASE_URL`, test ini **skip**, bukan bukti persistence.

## Struktur

```text
client/                 React + Vite, responsive UI, optional CP2 mock mode
server/src/             Express, validation, public serializers, repositories, upload
server/prisma/          Schema, SQL migration, seed
server/test/            API contract and PostgreSQL process-restart tests
docs/                   Checkpoint artifacts, API, design, deployment, demo
.github/workflows/      CI with real PostgreSQL service
docker-compose.yml      Local persistent PostgreSQL volume
Dockerfile              Backend production image + migration startup
render.yaml             Backend deployment template
client/vercel.json      SPA deep-link rewrite template
```

## Keputusan privasi dan keamanan

Pelapor memilih satu metode publik: EMAIL atau WHATSAPP. Hanya nilai pilihan itu yang dikumpulkan; API menolak field tambahan. Listing tidak menyertakan kontak. Detail hanya menyertakan `contact: {method, value}`. `imagePublicId` tidak pernah dikirim ke publik. Tidak ada endpoint edit/delete publik. Laporan publik tidak membutuhkan akun; rate limit membantu mengurangi spam. Informasi yang pengguna tulis sendiri di deskripsi/foto tetap publik, sehingga UI meminta pengguna menghindari nomor identitas atau data pribadi di sana.

CORS memakai allowlist exact origin. Berkas maksimal 5 MB, JPEG/PNG/WebP dengan pemeriksaan signature dan MIME; SVG dan arbitrary image URLs tidak diterima. Error database/provider tidak membocorkan stack trace atau secret. Jika database gagal setelah upload, backend mencoba menghapus gambar orphan. Jika cleanup Cloudinary juga gagal, operator perlu rekonsiliasi aset pada folder `pacil-lost-found` dengan `Report.imagePublicId`.

## Status external deliverables

Source, konfigurasi deploy, CI, migrasi, dan materi demo tersedia. **Belum ada URL live, remote GitHub, akun hosting, atau verifikasi upload Cloudinary sungguhan yang diklaim.** Langkah akun/secret dan deployment acceptance dijelaskan di [DEPLOYMENT.md](docs/DEPLOYMENT.md). Riwayat commit checkpoint harus merekam pekerjaan dan kontribusi yang benar, tanpa backdate.

Asumsi yang perlu dikonfirmasi: nama anggota dan penanggung jawab tim, kategori/lokasi pilihan kampus, EMAIL/WHATSAPP sebagai metode kontak, nama Temu, serta tujuan hosting/GitHub. Brief tidak mengharuskan autentikasi, edit, delete, klaim barang, atau dashboard admin; fitur tersebut tidak ditambahkan. Kewajiban belajar dan menjelaskan implementasi pada Demo Day tetap ada sesuai brief.
