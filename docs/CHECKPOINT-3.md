# Checkpoint 3 Full Integration and Deployment

Deadline brief: **22 November 2026**. Source final menghubungkan FE ke Express secara default. Tidak ada silent fallback ke mock. PostgreSQL/Prisma adalah default backend dan memory ditolak pada production.

## Integrasi final

1. Ikuti setup README; migrate dan seed DB development.
2. Pastikan `VITE_USE_MOCKS=false`, `VITE_API_URL` sesuai API; CLIENT_ORIGINS berisi frontend origin.
3. Jalankan frontend/backend, lihat listing, detail, search, tipe/kategori/lokasi, halaman berikutnya.
4. Submit LOST dan FOUND tanpa foto; cek redirect sukses/detail. Gambar null menampilkan placeholder.
5. Konfigurasikan ketiga secret Cloudinary; restart backend. Upload JPEG/PNG/WebP ≤5 MB, cek gambar pada detail/listing dan referensi di PostgreSQL.
6. Matikan/mulai ulang API; laporan yang dibuat harus tetap ada.
7. Ulangi pemeriksaan pada deployment production, bukan hanya development.

## Perilaku gagal dan privacy

Backend memvalidasi JSON dan multipart, enum, tanggal, panjang string dan format kontak. FE memvalidasi isian utama serta menampilkan pesan backend. Submit button disabled saat pengiriman. Preview lokal di-revoke ketika diganti atau halaman ditutup. FE menunggu maks 15 detik, menampilkan timeout/network error dan tombol retry listing/detail. Request listing/detail sebelumnya dibatalkan untuk menghindari respons lama menimpa pencarian baru.

Readiness memberi tahu apakah konfigurasi foto tersedia. Tanpa secret foto, form tetap bisa mengirim teks dan memberi tahu foto belum tersedia. Jika provider gagal, laporan tidak dibuat dan error tampil, data form dipertahankan. Jika DB gagal setelah upload, backend mencoba menghapus aset terkait. File tidak valid/terlalu besar ditolak.

Kontak yang dikumpulkan hanya satu metode pilihan pelapor. Public listing tidak membawa kontak; detail memuat satu objek contact. Link email/WhatsApp memakai nilai yang lolos validasi, tidak pernah arbitrary scheme. Foto/teks adalah informasi publik; pengguna diingatkan untuk tidak menulis nomor identitas atau informasi privat. Edit/delete publik tidak tersedia.

## Acceptance final

| Requirement                  | Bukti source/check                               | Status eksternal                         |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------- |
| API integration              | request client, interaction tests                | Uji URL live setelah deploy              |
| PostgreSQL persistence       | Schema + migration + repository + test restart   | Apply migrasi dan uji restart production |
| Cloudinary                   | Signed server upload, reference storage, cleanup | Perlu secret dan real upload smoke test  |
| Responsive UI                | CSS breakpoints + browser review bila tersedia   | Uji perangkat tim                        |
| Validation and loading/error | API tests, frontend interaction tests            | Uji network loss di live                 |
| Privacy/no public edits      | Serializer tests, 404 edit/delete tests          | Review konfigurasi production            |
| Deployment                   | Dockerfile, Render template, SPA rewrite, CI     | Perlu akun dan URL                       |
| README/demo                  | README + DEMO + contract + deployment checklist  | Rekam demo, isi nama tim dan URL         |

Hasil aktual, termasuk batas verifikasi, ada di [VERIFICATION.md](VERIFICATION.md). Jangan mengubah status menjadi deployed sebelum URL dan data flow production terbukti.
