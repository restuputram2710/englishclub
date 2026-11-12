# Pembaruan English Club Hub v1.1 — Halaman Utama

Pembaruan ini hanya mengubah halaman utama dan tab **Pengaturan → Halaman publik**. Data anggota, nilai, XP, akun, dan alamat `/exec` tidak berubah.

## Yang baru

| Permintaan | Hasil |
|---|---|
| Teks halaman utama rapi dan enak dibaca | Judul hanya menampilkan kalimat pertama teks "Tentang". Sisanya pindah ke bagian **Tentang kami** dan otomatis dibagi menjadi paragraf pendek. Huruf halaman utama diganti ke **Plus Jakarta Sans**, dengan ukuran dan jarak baris yang lebih lega. Visi dan Misi tampil sebagai kartu. |
| Foto Pembina | Kartu Pembina menampilkan foto bulat. Bila belum ada foto, yang tampil inisial nama. |
| Slide foto dan video profil sekolah | Slide foto sampul bergeser otomatis di bawah judul (maks. 12 foto, bisa digeser di HP). Ada juga bagian **Video profil sekolah** dari tautan YouTube, tautan Google Drive, atau video unggahan sendiri. |

Bagian slide dan video otomatis disembunyikan selama belum diisi.

## Isi paket

| Berkas | Untuk |
|---|---|
| `Kode.gs` | Backend versi 1.1.0 |
| `english-club-hub-update-v1.1.zip` | Hanya berkas frontend yang berubah: `index.html`, `css/style.css`, `js/pages-public.js`, `js/pages-admin.js`, dan panduan. **`js/config.js` sengaja tidak disertakan** agar alamat server Anda tidak tertimpa. |

## Langkah 1 — Perbarui backend

1. Buka proyek Apps Script English Club Hub.
2. Di `Kode.gs`, hapus seluruh isinya, tempel isi `Kode.gs` yang baru, lalu tekan **Ctrl+S**.
3. Pilih fungsi **`setupAplikasi`** lalu klik **▶ Jalankan**. Fungsi ini aman diulang: data tidak tersentuh, kata sandi admin tidak berubah, dan folder Drive baru **Halaman Publik** dibuat untuk foto slide dan video.
4. Klik **Terapkan → Kelola penerapan → ✏️ Edit → Versi: Versi baru → Terapkan**.
   Jangan memilih "Penerapan baru", karena URL `/exec` akan berganti.

## Langkah 2 — Perbarui frontend

1. Ekstrak `english-club-hub-update-v1.1.zip` **ke folder repository yang sama** dengan instalasi sebelumnya (folder yang berisi `index.html`). Bila Windows bertanya, pilih **Ganti berkas di tujuan**.
2. Buka PowerShell di folder itu, lalu jalankan:

```bash
git add .
git commit -m "Halaman utama v1.1: teks rapi, foto Pembina, slide foto, video profil"
git push
```

3. Tunggu 1–2 menit, buka situs, lalu tekan **Ctrl+Shift+R**.

## Langkah 3 — Isi konten baru

Masuk sebagai Admin → **Pengaturan Aplikasi → Halaman publik**:

1. **Slide foto sampul.** Klik **Unggah foto** (bisa pilih beberapa sekaligus; foto diperkecil otomatis) atau **Tambah dari tautan**. Isi keterangan bila perlu, atur urutan dengan tombol panah.
2. **Teks tentang English Club.** Kalimat pertama tampil di judul. Tekan Enter bila ingin menentukan paragraf sendiri.
3. **Video profil sekolah.** Tempel tautan YouTube (paling disarankan), atau klik **Unggah video sendiri** (maks. 25 MB).
4. **Foto Pembina.** Klik **Unggah foto**. Foto dipotong persegi otomatis.
5. Klik **Simpan perubahan**, lalu buka halaman utama.

## Perlu diketahui

- **Izin foto anggota.** Foto di slide bisa dilihat siapa saja. Tampilkan foto anggota hanya bila siswa dan orang tua/wali sudah memberi izin sesuai aturan sekolah.
- **Berkas di folder Halaman Publik** dibagikan "siapa saja yang memiliki link" (hanya lihat) supaya bisa tampil di halaman utama. Berkas tugas siswa tetap privat di folder lain.
- **Akun Google Workspace sekolah** kadang melarang berbagi tautan publik. Bila unggahan ditolak dengan pesan itu, pakai tautan YouTube untuk video dan **Tambah dari tautan** untuk foto.
- **Video unggahan** butuh beberapa menit diproses Google Drive sebelum bisa diputar. Video di atas 25 MB sebaiknya diunggah ke YouTube.
- **Foto dari tautan Google Drive** hanya muncul bila akses berkasnya "Siapa saja yang memiliki link".

## Hasil pengujian

Pengujian dilakukan di simulator Google Apps Script dan browser Chromium, bukan di server Google sungguhan.

- 132 uji backend lulus, 19 di antaranya baru. Yang diuji: unggah foto dan video hanya oleh Admin (Pembina dan siswa ditolak), berkas tugas siswa tetap privat, tautan Drive dirapikan otomatis, tautan selain video atau tanpa https ditolak, maksimal 12 slide, dan foto tidak ikut data login.
- Alur Admin di browser lulus: unggah 2 foto, tambah 1 dari tautan, ubah urutan, isi keterangan, unggah foto Pembina dan video, simpan. Halaman utama lalu menampilkan slide, video, dan foto Pembina.
- Halaman utama dicek di lebar 1366, 1024, dan 390 px, dengan dan tanpa slide/video: tanpa error JavaScript dan tanpa geser ke samping.
- Seluruh halaman Siswa, Pembina, dan Admin diuji ulang: tanpa error JavaScript.
- Huruf Plus Jakarta Sans dimuat dari Google Fonts dan belum bisa ditampilkan di lingkungan uji. Bentuk hurufnya baru terlihat setelah situs online.
