# Hasil verifikasi lokal

Tanggal: **25 November 2026, Asia/Jakarta**. Lingkungan: Windows, Node 26.7.0, npm 11.19.0, PostgreSQL 19.0. Deployment template/CI menargetkan Node 22 dan PostgreSQL 17; eksekusi CI di GitHub atau Docker build belum dilakukan karena belum ada remote/runner Docker. Hasil ini adalah pengujian lokal, bukan klaim deployment live.

## Build

`npm run build` berhasil melakukan Prisma Client generation versi 7.10.1 dan Vite production build. Bundle frontend final berada di `client/dist` ketika build dijalankan; source ZIP tidak menyertakan dependensi atau generated files. Bundle memakai frontend API sungguhan secara default. Google Fonts memerlukan jaringan; font fallback lokal tetap tersedia ketika offline.

## Lint

`npm run lint` lulus untuk JavaScript dan JSX. Generated Prisma, dist dan node_modules dikecualikan. Source dirapikan dengan Prettier untuk kemudahan review/pembelajaran.

## Tests API

**8 test lulus**, menggunakan Express app dan Supertest dengan memory repository sebagai test double:

- Contract listing, case-insensitive search, gabungan filter, pagination dan hasil kosong.
- Invalid query/UUID, missing report, dan tidak adanya edit/delete publik.
- JSON/multipart text submission, response 201/Location, serta detail-only selected contact.
- Validasi tanggal mustahil/masa depan, kontak salah, field tambahan, JSON/body invalid.
- CORS allowlist dan preflight.
- Batas file 5 MB, signature/MIME invalid, upload field salah dan provider belum dikonfigurasi.
- Upload reference memakai provider test double, serta compensation cleanup bila DB gagal.
- Rate limit mengembalikan JSON 429.

Log `Request failed: Error` pada uji compensation merupakan kegagalan database yang sengaja disimulasikan; test lulus bila respons 503 dan cleanup terpanggil. Tidak ada upload ke akun Cloudinary sungguhan dalam tests ini.

## Tests frontend

**5 test lulus** menggunakan Vitest, Testing Library, jsdom dan mock transport:

- Listing API render dan pengiriman query pencarian/filter.
- Detail menampilkan placeholder dan hanya kontak terpilih.
- Network error lalu retry berhasil.
- Empty result dengan reset action.
- Form menolak isian kosong, menerima data valid, mengirim FormData dan menampilkan sukses.

## PostgreSQL dan migrasi

Database pengujian terpisah dibuat lokal, bind 127.0.0.1 pada port test. Migrasi committed `20261125000000_init` berhasil applied; menjalankannya ulang menghasilkan **No pending migrations**. Seed memasukkan 12 sample. Test dijalankan dengan `TEST_DATABASE_URL` terisi: **1 test lulus, 0 skip**. Test membuat laporan melalui API proses anak, menghentikan proses tersebut, menjalankannya kembali dan membaca record yang sama dari PostgreSQL. Test membersihkan record miliknya setelah selesai.

`prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` dari workspace server menghasilkan **No difference detected**. Constraints SQL tambahan tetap berada di migrasi. Ini bukan bukti migrasi production sudah applied.

## Browser integration dan responsive review

Browser lokal memakai frontend Vite → Express → Prisma → PostgreSQL, tanpa mock mode:

- Listing memuat 12 fixture sebelum pengiriman demo.
- Search `tumbler` dan filter LOST + BOTTLE + A206 mengembalikan satu laporan yang benar.
- Detail Tumbler biru navy menampilkan placeholder dan email terpilih.
- Form dikirim dengan nama “Payung hijau demo browser”, lokasi Perpustakaan, kategori Aksesori, tanggal 20 November 2026 dan email contoh. Halaman sukses, detail, lalu listing menampilkan record baru; total menjadi 13 pada database pengujian tersebut. Record demo tidak disertakan sebagai fixture canonical.
- Layout desktop diperiksa pada lebar 1440. Listing/form diperiksa pada layar kecil, termasuk viewport 390; lebar konten 375 tidak melebihi viewport 390. Judul mobile dan penanganan input tanggal diperbaiki selama review.
- Placeholder aktif saat tidak ada foto; upload UI memberi informasi layanan foto belum dikonfigurasi.

Browser check ini tidak menggantikan uji pada perangkat fisik tim. Provider foto nyata dan URL production belum diuji.

## Audit dependensi

Audit npm terakhir setelah update Prisma, Zod, Vitest dan patch Effect: **0 vulnerabilities**. CLI, client, dan adapter Prisma dipin 7.10.1; root override `effect: 3.22.5` memperbaiki dependency transitif Prisma config. Lockfile mencatat resolusi yang digunakan. Audit bukan jaminan bebas seluruh risiko; hasil berlaku pada waktu pemeriksaan. Tidak ada `npm audit fix --force` yang digunakan.

## Belum terverifikasi atau memerlukan pemilik akun

- Upload Cloudinary sungguhan, kredensial provider dan gambar hasil delivery.
- Remote/push GitHub, CI GitHub aktual dan kontribusi tiga anggota.
- Docker image build pada engine Docker; konfigurasi disiapkan namun engine tidak tersedia di lingkungan ini.
- Deployment frontend/backend, apply migrasi production, CORS/SSL/live domain, dan restart host production.
- Nama anggota, tanggal pengumpulan, tautan video dan pelaksanaan Demo Day.

Tidak ada URL live atau klaim seluruh kewajiban eksternal selesai. Tindakan lanjutan tercantum di DEPLOYMENT dan REQUIREMENTS.
