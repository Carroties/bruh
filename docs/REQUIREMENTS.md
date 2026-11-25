# Requirement traceability

Brief sumber dibaca lengkap dari lampiran Final Project Webdev 2026(2).docx. Matriks membedakan artefak implementasi dari kewajiban akun, kontribusi tim, dan penyerahan. Lihat VERIFICATION untuk bukti pengujian yang benar-benar dijalankan.

| Checkpoint / requirement brief                 | Deliverable source                           | Catatan                                             |
| ---------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| CP1 initialize GitHub repositories/environment | package workspaces, env examples, DEPLOYMENT | Remote/push membutuhkan akun tim                    |
| Pages/features/responsibilities                | CHECKPOINT-1, App.jsx                        | Nama anggota belum diberikan                        |
| Fields/types/relationships/Week 3 mapping      | DATABASE, schema.prisma                      | Satu Report tanpa akun; enum                        |
| REST methods/body/responses/status             | API, server/src/app.js                       | GET list/detail, POST                               |
| Query/filter/pagination                        | API, validation, repositories                | AND, item-name search, stable newest-first          |
| Submission/optional image format               | API, upload.js                               | JSON atau multipart, satu file opsional             |
| Consistent mock data                           | server/src/mock-data.js, mock-api.js, seed   | Satu canonical fixture 12 laporan                   |
| CP2 listing/detail/search/filter/submission    | client/src/App.jsx                           | Halaman terhubung API dan mode mock CP2             |
| Responsive desktop/mobile                      | styles.css                                   | Grid/form breakpoints; hasil review di VERIFICATION |
| Prepare FE integration                         | api.js                                       | Same response contract, default final API           |
| Working backend endpoints                      | app.js, tests                                | Validasi, JSON dan status                           |
| Sample data and memory allowed                 | memoryRepository + fixture                   | Development only                                    |
| Deploy API, publish URL before Week 3          | render.yaml, Dockerfile, DEPLOYMENT          | Belum deployed; tidak mengklaim deadline terpenuhi  |
| CP3 replace mock with actual requests          | api.js default false                         | No silent fallback                                  |
| Integrate optional photo and placeholder       | upload.js, Image, Submission                 | Real Cloudinary memerlukan secret                   |
| Input validation/loading/error                 | Zod, UI states, tests                        | Date/contact/enums/file limits                      |
| Deploy frontend                                | build + vercel.json                          | Memerlukan akun dan API URL                         |
| Complete README/final demo                     | README, DEMO                                 | Nama, URL, video aktual belum diisi                 |
| Prisma schema/PostgreSQL persistence           | schema, database.js, repositories            | Default STORAGE=prisma                              |
| Commit migrations/apply production             | migrations, CI                               | Source migration tersedia; apply production pending |
| Verify persistence after restart               | database.test.js                             | Bukti eksekusi di VERIFICATION                      |
| Cloudinary upload/image references             | upload.js, Report fields                     | Implemented; real provider smoke pending            |
| No arbitrary public edit/delete                | app.js no PATCH/DELETE                       | Uji 404                                             |
| Only selected public contact                   | strict input + publicReport                  | List none, detail exactly one                       |
| Deploy backend/final FE integration            | configs + docs                               | Verifikasi live pending                             |
| Team of 3, breakout collaboration              | CHECKPOINT-1 role proposal                   | Tidak bisa digantikan oleh source atau klaim commit |
| Mentor tracking through commits                | CI and GitHub handoff                        | Harus mengikuti kontribusi asli                     |
| Responsible AI usage and Demo Day              | DEMO learning/review checklist               | Setiap peserta harus memahami implementasi          |

## Asumsi yang perlu dikonfirmasi

- Branding Temu dan bahasa UI Indonesia dipilih untuk konteks Pacil, bukan nama wajib brief.
- Kategori enam enum dan lokasi saran enam area dipilih dari skenario brief; lokasi custom tetap diterima dan dapat difilter tepat.
- EMAIL/WHATSAPP dipilih sebagai opsi publik karena brief hanya menentukan “selected contact method”. Hanya satu opsi dikumpulkan.
- Monorepo diasumsikan memenuhi kebutuhan repositories. Pisahkan bila mentor mewajibkan repo FE/BE berbeda.
- Tidak ada login, moderation dashboard, status resolved, edit, delete, atau claim flow karena bukan minimum brief.
- Tenggat asli sudah lewat saat source disiapkan. Tidak ada backdate commit atau klaim submission historis.
- Akun GitHub/hosting/Cloudinary dan nama anggota belum diberikan. Semua URL live dan bukti pengumpulan masih perlu diisi setelah verifikasi nyata.
