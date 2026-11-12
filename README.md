# English Club Hub — Frontend

Tampilan web English Club Hub (SMA PGRI 43 Singaparna). Learn. Play. Challenge. Achieve.

Ini aplikasi statis (HTML, CSS, JavaScript murni, tanpa build) yang berbicara dengan backend Google Apps Script lewat `fetch`. Cocok di-host di GitHub Pages.

## Pasang

1. Isi `GAS_URL` di `js/config.js` dengan URL `/exec` dari penerapan Apps Script.
2. Jalankan `git init` **di folder ini** (folder yang berisi `index.html`), lalu push ke GitHub.
3. Aktifkan GitHub Pages: Settings → Pages → branch `main`, folder `/ (root)`, centang Enforce HTTPS.

Langkah lengkap ada di `PANDUAN-INSTALASI.md`.

## Isi folder

| Berkas | Fungsi |
|---|---|
| `index.html` | Kerangka halaman dan urutan pemuatan skrip |
| `css/style.css` | Token desain, komponen, tata letak responsif, gaya cetak |
| `js/config.js` | Satu-satunya pengaturan: alamat backend |
| `js/api.js` | Sesi, panggilan API, penggabungan permintaan, cache lokal, pengukur kecepatan |
| `js/ui.js` | Komponen bersama: tabel, modal, grafik, formulir, notifikasi XP |
| `js/app.js` | Rute, menu per peran, kerangka aplikasi |
| `js/icons.js` | Ikon garis |
| `js/mascot.js` | Maskot Leo si bunglon (SVG + CSS) |
| `js/pages-public.js` | Beranda publik, masuk, ganti kata sandi wajib |
| `js/pages-student.js` | Halaman siswa |
| `js/pages-staff.js` | Halaman Pembina |
| `js/pages-admin.js` | Halaman Admin |

## Catatan

- Tidak ada kunci rahasia di folder ini. URL `/exec` memang publik; keamanan dijaga login dan pengecekan peran di server.
- Setelah memperbarui berkas, naikkan angka `?v=1.0.0` di `index.html` agar browser memuat versi baru.
- Untuk melihat kecepatan server, buka Console browser lalu ketik `Perf.table()` atau `Perf.summary()`.
