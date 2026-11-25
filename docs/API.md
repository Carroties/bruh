# REST API contract

Local base URL: `http://localhost:3001`. Production base URL: **belum tersedia**. Semua respons JSON dengan envelope `data` atau `error`; tanggal memakai ISO. Request body hanya menerima field yang didokumentasikan. Tidak ada autentikasi pada minimum brief.

## GET /reports

| Query    | Default | Aturan                                                          |
| -------- | ------- | --------------------------------------------------------------- |
| q        | empty   | Trim, maks 100, substring itemName, case-insensitive            |
| type     | all     | LOST / FOUND                                                    |
| category | all     | ELECTRONICS / ID_CARD / BOTTLE / CLOTHING / ACCESSORIES / OTHER |
| location | all     | Trim, 2–100, exact match case-insensitive                       |
| page     | 1       | Integer positif 1–1.000.000                                     |
| limit    | 9       | Integer positif 1–50                                            |

Semua filter dikombinasikan AND. Urut `createdAt DESC, id DESC`; offset `(page-1)*limit`. Hasil kosong dan page di luar hasil tetap 200 dengan `data: []`; `totalPages: 0` jika tidak ada hasil. Parameter tidak dikenal, duplikat, enum salah, `page=0`, pecahan atau notasi ilmiah → 400. FE menyimpan state di URL, reset page ketika search/filter berubah. Tidak ada filter berdasarkan isi kontak.

```http
GET /reports?q=tumbler&type=LOST&category=BOTTLE&location=A206&page=1&limit=9
```

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "type": "LOST",
      "itemName": "Tumbler biru navy",
      "description": "Tumbler stainless biru navy, ada stiker kecil di bagian bawah. Terakhir dipakai setelah kelas.",
      "category": "BOTTLE",
      "location": "A206",
      "occurredAt": "2026-11-20",
      "imageUrl": null,
      "createdAt": "2026-11-24T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 9, "total": 1, "totalPages": 1 }
}
```

Listing tidak menyertakan contact, contactMethod, contactValue, atau imagePublicId.

## GET /reports/:id

UUID valid diperlukan. 200 mengembalikan `{ "data": report }` dengan seluruh field listing ditambah satu `contact`:

```json
{ "contact": { "method": "EMAIL", "value": "demo1@example.com" } }
```

Ini potongan tambahan pada objek report, bukan envelope respons lengkap. Alternatifnya WHATSAPP dengan nomor E.164. Tidak ada kontak alternatif yang disimpan/ditampilkan. Malformed ID → 400 INVALID_ID; UUID valid tetapi tidak ada → 404 NOT_FOUND.

## POST /reports

Text-only memakai `application/json` atau `multipart/form-data`. Foto memakai multipart dengan **8 text fields** yang sama dan satu file opsional bernama `image`. Browser membuat boundary; jangan mengatur Content-Type multipart secara manual.

```json
{
  "type": "LOST",
  "itemName": "Tumbler biru navy",
  "description": "Tumbler stainless biru navy dengan stiker kecil di bagian bawah.",
  "category": "BOTTLE",
  "location": "A206",
  "occurredAt": "2026-11-20",
  "contactMethod": "EMAIL",
  "contactValue": "student@example.com"
}
```

Validasi: nama 3–100, deskripsi 10–2000, lokasi 2–100, semua di-trim; enum seperti di atas; tanggal kalender valid YYYY-MM-DD dan tidak melewati hari ini (server memakai UTC); email valid atau nomor internasional `+` diikuti 8–15 digit, digit pertama 1–9. Nilai contactValue maksimal 254. Hanya delapan field diizinkan; `imageUrl`, `id`, `createdAt`, field kontak alternatif ditolak. Body JSON maks 32 KB. Pelapor memilih satu kontak yang memang ingin dipublikasikan; jangan memasukkan kontak privat di deskripsi.

Contoh curl text-only:

```sh
curl -X POST http://localhost:3001/reports -H 'Content-Type: application/json' --data '{"type":"FOUND","itemName":"Kabel HDMI","description":"Kabel hitam ditemukan di meja rapat.","category":"ELECTRONICS","location":"Sekretariat","occurredAt":"2026-11-20","contactMethod":"EMAIL","contactValue":"student@example.com"}'
```

Contoh foto dari shell yang mendukung curl (pada Windows gunakan `curl.exe`):

```sh
curl -X POST http://localhost:3001/reports \
 -F 'type=FOUND' -F 'itemName=Botol hijau' \
 -F 'description=Botol hijau tertinggal di meja kantin.' \
 -F 'category=BOTTLE' -F 'location=Kantin' -F 'occurredAt=2026-11-20' \
 -F 'contactMethod=WHATSAPP' -F 'contactValue=+6281234567890' \
 -F 'image=@./botol.png;type=image/png'
```

Foto: JPEG/PNG/WebP maksimal 5 MB, satu file, signature harus cocok dengan MIME. SVG/berkas lain → 415. Cloudinary diupload dari backend menggunakan `upload_stream`, folder `pacil-lost-found`, resize maksimal 1600×1600 dan strip metadata profile; secure_url dan public_id disimpan PostgreSQL. Input teks divalidasi sebelum upload. Tanpa foto kedua kolom bernilai null. Jika simpan DB gagal setelah upload, backend mencoba menghapus gambar agar tidak orphan. Referensi implementasi: [Cloudinary Node upload documentation](https://cloudinary.com/documentation/node_image_and_video_upload).

Sukses: **201 Created**, header `Location: /reports/{uuid}`, body `{data: reportDetail}` sesuai GET detail. Tidak mendukung idempotency key: setelah network timeout, periksa listing sebelum mengirim ulang untuk menghindari duplikasi.

## Error envelope dan status

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali isian Anda.",
    "fields": {
      "formErrors": [],
      "fieldErrors": {
        "itemName": ["String must contain at least 3 character(s)"]
      }
    }
  }
}
```

`fields` hanya ada pada schema validation. Pesan standar Zod dapat berbahasa Inggris; frontend memberi bantuan isian berbahasa Indonesia.

| Status | Kondisi/code                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------- |
| 200    | Listing, detail, readiness sukses                                                                  |
| 201    | Laporan dibuat                                                                                     |
| 204    | CORS preflight diizinkan                                                                           |
| 400    | VALIDATION_ERROR, INVALID_ID, INVALID_JSON, invalid multipart (LIMIT_*), unknown field             |
| 403    | ORIGIN_NOT_ALLOWED                                                                                 |
| 404    | NOT_FOUND, endpoint edit/delete tidak disediakan                                                   |
| 413    | LIMIT_FILE_SIZE (>5 MB), PAYLOAD_TOO_LARGE (>32 KB JSON)                                           |
| 415    | INVALID_IMAGE, UNSUPPORTED_MEDIA_TYPE                                                              |
| 429    | RATE_LIMITED, 20 POST per 15 menit per IP                                                          |
| 502    | UPLOAD_FAILED, provider gagal                                                                      |
| 503    | SERVICE_UNAVAILABLE, DB unavailable; UPLOAD_UNAVAILABLE, file dikirim tanpa konfigurasi Cloudinary |

`GET /health` → `{data:{status:"ok",uploadsEnabled:false}}` bila DB siap dan secret upload belum lengkap. `uploadsEnabled` menunjukkan konfigurasi tersedia, bukan bukti kredensial/provider berhasil. DB tidak tersedia → 503.

CORS menerima origin browser yang tercantum di CLIENT_ORIGINS (comma-separated, exact scheme/host/port, tanpa trailing slash). Request tanpa Origin tetap dapat memakai API; CORS bukan autentikasi atau proteksi akses server-to-server. Rate limiter bersifat memory per proses; banyak replika perlu store bersama. TRUST_PROXY_HOPS harus sesuai jumlah trusted proxy, jangan asal mengaktifkan semua proxy.
