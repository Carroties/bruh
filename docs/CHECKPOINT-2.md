# Checkpoint 2 Main UI and Working API

Deadline brief: **19 November 2026**. Semua source checkpoint ini disertakan, sedangkan pengumpulan GitHub dan URL API memerlukan akun pemilik proyek.

## Frontend

React + Vite menyediakan listing/detail, search nama barang, tipe Lost/Found, kategori, lokasi, pagination dan submission. Tampilan menyesuaikan desktop/mobile, mendukung keyboard, label form, focus indicator, reduced motion, dan empty/loading/error states. Search dilakukan saat submit; filter mengubah URL dan reset page. Berbagi URL mengembalikan pencarian yang sama.

Untuk pengembangan FE tanpa API, set `VITE_USE_MOCKS=true` pada `client/.env` lalu restart Vite. Banner mode mock selalu terlihat. Fixture diimpor dari `server/src/mock-data.js`, satu sumber yang juga dipakai memory API dan seed. Mock adapter mengikuti struktur respons; ia hanya alat development, tidak meniru seluruh validation/security backend dan tidak menyimpan data setelah reload. Tidak mendukung foto. Final default: `VITE_USE_MOCKS=false`.

## Backend

`GET /reports`, `GET /reports/:id`, `POST /reports` tersedia dengan envelope JSON, validasi dan HTTP status sesuai [API](API.md). Untuk mode CP2 tanpa PostgreSQL, set `STORAGE=memory` dalam `server/.env`, gunakan NODE_ENV development. Setelah `npm run db:generate`, jalankan `npm run dev`. Mode ini menyimpan perubahan dalam proses saja. Endpoint edit/delete tidak ada.

Origin development yang disepakati `http://localhost:5173`; frontend dan backend harus sepakat memakai hostname yang sama. Tambahkan production frontend origin pada CLIENT_ORIGINS sebelum deployment. Request browser dari origin lain menerima 403; CORS tidak membatasi curl/server lain.

## Acceptance

| Pemeriksaan                           | Ekspektasi                                                  |
| ------------------------------------- | ----------------------------------------------------------- |
| Listing default                       | 9 dari 12 sample, metadata total=12, totalPages=2           |
| Search TUMBLER + LOST + BOTTLE + A206 | Satu laporan fixture Tumbler biru navy                      |
| Detail fixture                        | Deskripsi dan satu kontak, placeholder ketika imageUrl null |
| Form kosong / email salah             | Feedback yang bisa dibaca pengguna                          |
| Submit text valid                     | 201, Location header, detail dapat dibuka                   |
| ID salah / laporan tidak ada          | 400 / 404 sesuai contract                                   |
| Layar kecil                           | Grid menyesuaikan, form satu kolom, nav tetap terjangkau    |

Uji otomatis API dan FE ada di `npm test`. Status pemeriksaan aktual dicatat di [VERIFICATION](VERIFICATION.md).

## Penyerahan API

Base URL lokal: `http://localhost:3001`. Base URL deployed: **belum tersedia**. Contract siap di [API.md](API.md), template deployment di [DEPLOYMENT.md](DEPLOYMENT.md). Requirement brief untuk deploy API dan publish URL sebelum Week 3 belum dapat dianggap selesai hanya dari source ini. Lengkapi setelah akun hosting, database, dan GitHub tersedia.
