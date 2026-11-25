# Deployment and GitHub handoff

Source dan konfigurasi siap untuk akun tim. Belum ada hosting/URL live atau remote GitHub yang dibuat. Tidak ada secret production dalam repository atau ZIP.

## GitHub

Dari folder `lost-found`, buat repository milik tim melalui akun yang berwenang. Sebelum add/commit, pastikan `server/.env`, `client/.env`, node_modules, dist, dan generated Prisma tidak masuk tracking.

```sh
git init
git add .
git commit -m "Implement Lost and Found application and checkpoint documentation"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

Ganti OWNER/REPOSITORY dengan tujuan asli. Jangan menjalankan git init dari parent folder Codex. Tidak ada commit palsu/backdate untuk deadline checkpoint. Selanjutnya gunakan branch/PR dan commit yang mencerminkan kontribusi masing-masing dari 1 BE + 2 FE. Workflow `.github/workflows/ci.yml` menjalankan lint, build, tests, migrasi, dan uji restart API dengan PostgreSQL service.

## Backend dan database

Template `render.yaml` memakai Dockerfile backend, readiness `/health`, dan variable yang harus diisi oleh pemilik akun. Akun penyedia database PostgreSQL dan hosting belum tersedia; pemilihan provider, plan, domain dan biaya harus disepakati tim. Template bukan bukti deployment dan bukan jaminan ketersediaan plan provider.

1. Push source ke GitHub dan hubungkan repository ke hosting yang mendukung Docker/Node.
2. Sediakan PostgreSQL permanen (managed service disarankan). Pakai direct connection URL dengan SSL sesuai dokumentasi provider; jangan menghilangkan verifikasi sertifikat tanpa alasan terverifikasi.
3. Set `DATABASE_URL`, `STORAGE=prisma`, `NODE_ENV=production`, `CLIENT_ORIGINS=https://YOUR_FRONTEND_HOST`, dan `TRUST_PROXY_HOPS` sesuai proxy provider. Port memakai `$PORT` dari hosting (default 3001). Bind backend `0.0.0.0` sudah disiapkan.
4. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` di secret manager hosting. Tidak boleh diletakkan dalam VITE env atau commit.
5. Docker build menjalankan npm ci dan generate client. Startup menjalankan migrasi committed lalu backend. Banyak replika sebaiknya memakai satu release migration job sebelum rollout; sesuaikan CMD jika host menyediakan pre-deploy hook.
6. Pastikan `/health` 200 dan `uploadsEnabled:true` ketika semua secret upload terisi. Ini belum memverifikasi keabsahan secret; lakukan upload sungguhan.
7. Catat base URL yang benar di API.md dan README setelah verifikasi.

Prisma dipin versi 7.10.1, memakai JavaScript generator dan adapter PostgreSQL; konfigurasi migrasi berada di `server/prisma.config.js`. Migrasi produksi memakai `prisma migrate deploy`, bukan reset/dev. Kode PostgreSQL tidak bisa diganti menjadi browser localStorage tanpa melanggar brief. Tidak ada asumsi bahwa fitur server otomatis tersedia pada hosting statis.

## Frontend

Deploy frontend sebagai Vite SPA dari repository yang sama. Contoh untuk Vercel, atau penyedia static hosting lain dengan pengaturan ekuivalen:

| Pengaturan     | Nilai                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Root directory | `client`                                                                  |
| Install        | `npm ci` dengan workspace root/lockfile ikut terdeteksi                   |
| Build          | `npm run build -w client` dari repo root; `npm run build` bila cwd client |
| Output         | `client/dist` dari root atau `dist` dari cwd client                       |
| Variable       | `VITE_API_URL=https://YOUR_API_HOST`                                      |
| Variable       | `VITE_USE_MOCKS=false`                                                    |

`client/vercel.json` menyediakan fallback `/index.html` agar deep-link `/reports/:id` dan `/reports/new` dapat direfresh. Pada host lain tambahkan rewrite yang sama; assets tetap dilayani dari `dist/assets`. Jangan taruh secret di frontend; VITE variables dimasukkan ke bundle dan terbaca publik. Perubahan VITE env perlu build ulang.

Untuk menghindari ambiguitas workspace provider, alternatif build dari repository root: `npm ci`, `npm run build`, publish directory `client/dist`, lalu salin aturan SPA fallback sesuai host. Jika build provider tidak mendeteksi lockfile root, gunakan alternatif ini.

## Acceptance setelah deployment

- [ ] Root FE HTTPS dapat dibuka pada desktop/mobile.
- [ ] Refresh langsung pada detail dan submission tidak 404.
- [ ] API `/health` 200, CORS exact frontend origin; origin lain ditolak.
- [ ] Search/filter/pagination memanggil URL API production dan hasil sesuai.
- [ ] Buat laporan tanpa foto, lalu lihat detail dengan placeholder.
- [ ] Buat laporan dengan foto valid, cek Cloudinary asset dan DB image references.
- [ ] Coba fake file dan >5 MB; pastikan 415/413 dan tidak ada record baru.
- [ ] Coba tanggal masa depan dan kontak salah; pastikan 400.
- [ ] Detail hanya menampilkan kontak yang dipilih; listing tidak menyertakan kontak.
- [ ] Restart backend dari dashboard host; laporan sebelumnya masih tersedia.
- [ ] PATCH/DELETE laporan tidak tersedia untuk publik.
- [ ] Uji putus koneksi/loading/error, lalu retry.
- [ ] Catat URL, tanggal verifikasi, nama anggota, dan bukti demo di DEMO/README.

## Hal yang memerlukan akun/secret

Remote GitHub dan izin push, database URL production, akun hosting frontend/backend, origin/domain final, serta kredensial Cloudinary. Tidak perlu memberikan secret lewat chat; masukkan langsung pada environment hosting. Template Docker Compose memakai password contoh lokal, bukan secret production.

## Pemeliharaan dan troubleshooting

503 list/health: cek koneksi DB, SSL dan migrasi. Error generation: jalankan db:generate setelah npm ci, izinkan unduhan binary Prisma CLI bila diperlukan. CORS 403: cocokkan scheme/host/port tepat tanpa slash. Gambar belum bisa diunggah: lengkapi ketiga Cloudinary env, restart dan uji secret lewat upload. Deep link 404: aktifkan SPA fallback. Data hilang setelah restart: pastikan STORAGE=prisma dan database permanen, bukan mode memory atau disk ephemeral. Rate limiting di banyak replika membutuhkan shared store; MVP memakai store per proses.
