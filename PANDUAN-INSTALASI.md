# Panduan Instalasi English Club Hub

Versi 1.0.0 · Fase 1 (MVP) · SMA PGRI 43 Singaparna

English Club Hub terdiri dari dua bagian:

| Bagian | Berkas | Tempat pasang |
|---|---|---|
| Backend (server dan database) | `Kode.gs` | Google Apps Script, di akun Google milik sekolah atau English Club |
| Frontend (tampilan aplikasi) | `english-club-hub.zip` | GitHub Pages (gratis) |

Data tersimpan di Google Sheets, berkas tugas dan materi di Google Drive. Keduanya dibuat otomatis oleh skrip setup.

Kerjakan secara berurutan: **Bagian A dulu, baru Bagian B.** Frontend membutuhkan alamat server dari Bagian A.

---

## Bagian A — Memasang backend di Google Apps Script

Gunakan akun Google yang akan menjadi pemilik aplikasi. Sebaiknya akun milik sekolah atau English Club, bukan akun pribadi, agar data tidak ikut hilang bila pengelola berganti.

### A1. Buat proyek Apps Script

1. Buka https://script.google.com lalu klik **Proyek baru**.
2. Klik judul "Proyek tanpa judul" dan ganti menjadi `English Club Hub`.
3. Di editor ada berkas `Kode.gs` berisi `function myFunction() {}`. Hapus seluruh isinya.
4. Buka berkas `Kode.gs` dari paket ini, salin **seluruh** isinya, lalu tempel ke editor.
5. Tekan **Ctrl+S** (Cmd+S di Mac) untuk menyimpan.

### A2. Jalankan setup (sekali, aman diulang)

1. Di bilah atas editor, pilih fungsi **`setupAplikasi`** dari menu tarik-turun di sebelah tombol Debug.
2. Klik **▶ Jalankan**.
3. Muncul permintaan izin. Klik **Tinjau izin**, pilih akun Anda, klik **Lanjutan**, lalu **Buka English Club Hub (tidak aman)**, lalu **Izinkan**.
   Peringatan "tidak aman" muncul karena skrip ini buatan sendiri dan belum diverifikasi Google. Itu normal.
4. Tunggu sampai **Log eksekusi** menampilkan `✓ Setup selesai.`

Di log akan tampil seperti ini:

```
AKUN ADMIN PERTAMA (catat sekarang, hanya tampil sekali, wajib diganti saat masuk pertama)
   Username   : admin
   Kata sandi : XXXXXXXXXXXX
```

**Catat kata sandi itu sekarang.** Kata sandi ini hanya ditampilkan sekali dan wajib diganti saat masuk pertama.

Setup otomatis membuat:

- Folder **English Club Hub** di Google Drive, berisi subfolder Pengumpulan Tugas, Digital Library, Branding, dan Ekspor.
- Spreadsheet **English Club Hub — Database** dengan semua sheet yang dibutuhkan.
- Data awal: 10 level, 6 aturan XP, 9 badge, 30 kosakata harian, 8 materi contoh, 1 kuis berisi 10 soal, 3 tantangan contoh, dan 1 pengumuman.
- Kunci rahasia sesi dan akun admin pertama.
- Dua pemicu otomatis: `cronJam` (tiap jam, untuk pengingat deadline) dan `keepWarm` (tiap 5 menit, agar aplikasi cepat dibuka).

Materi, kuis, dan tantangan contoh boleh diubah atau dihapus Pembina kapan saja.

### A3. Terbitkan sebagai aplikasi web

1. Klik tombol biru **Terapkan** (Deploy) di kanan atas, lalu **Penerapan baru**.
2. Klik ikon roda gigi di samping "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi:
   - Deskripsi: `English Club Hub v1.0.0`
   - Jalankan sebagai: **Saya**
   - Siapa yang memiliki akses: **Siapa saja**
4. Klik **Terapkan**.
5. Salin **URL aplikasi web** yang berakhiran `/exec`. Simpan di Notepad karena akan dipakai di Bagian B.

> Akses "Siapa saja" diperlukan karena siswa tidak masuk dengan akun Google. Data tetap aman: setiap permintaan diperiksa dengan sistem login aplikasi dan peran pengguna. Pengunjung tanpa login hanya bisa melihat halaman depan.

### A4. Uji backend

Tempel URL `/exec` tadi di tab browser baru. Hasil yang benar berupa teks JSON yang diawali:

```
{"success":true,"data":{"settings":{"app_name":"English Club Hub", ...
```

Bila muncul halaman login Google atau pesan izin, ulangi langkah A3 dan pastikan aksesnya **Siapa saja**.

---

## Bagian B — Memasang frontend di GitHub Pages

### B1. Siapkan alat (sekali saja)

1. Pasang Git:
   - Windows: unduh dari https://git-scm.com/download/win, pasang dengan pengaturan bawaan, lalu buka **PowerShell**.
   - Mac: buka Terminal, ketik `git --version`. Bila belum ada, macOS menawarkan pemasangan otomatis.
2. Buat akun di https://github.com bila belum punya. Username akan menjadi bagian alamat situs, contoh `englishclub43.github.io`.
3. Atur identitas Git:

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

### B2. Buat repository di GitHub

1. Di github.com klik **+** → **New repository**.
2. Nama: misalnya `english-club-hub`.
3. Pilih **Public**. GitHub Pages gratis hanya untuk repository publik. Ini aman karena frontend tidak memuat rahasia apa pun.
4. **Jangan** centang README, .gitignore, atau license.
5. Klik **Create repository** dan biarkan halaman itu terbuka.

### B3. Ekstrak ZIP dan isi alamat server

1. Ekstrak `english-club-hub.zip`, misalnya ke `Documents\english-club-hub`.
2. **Folder hasil ekstraksi itulah folder proyek.** Di dalamnya harus langsung terlihat `index.html`, folder `css`, dan folder `js`:

```
english-club-hub\        ← folder ini yang di-git init
├── index.html
├── README.md
├── PANDUAN-INSTALASI.md
├── css\
│   └── style.css
└── js\
    ├── config.js        ← satu-satunya berkas yang perlu diubah
    ├── app.js, api.js, ui.js, icons.js, mascot.js
    └── pages-*.js
```

3. Buka `js\config.js` dengan Notepad, lalu ganti `https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec` dengan URL `/exec` dari langkah A3. Simpan.

### B4. Unggah lewat terminal

Jangan gunakan tombol "Upload files" di situs GitHub, karena struktur folder `css/` dan `js/` akan rusak dan tampilan aplikasi berantakan.

1. Buka folder proyek di File Explorer, klik address bar, ketik `powershell`, lalu Enter. PowerShell langsung terbuka di folder itu.
2. Pastikan Anda berada di folder yang benar:

```powershell
dir
```

   Harus terlihat `index.html`, `css`, dan `js` di daftar. Bila yang terlihat justru satu folder lain, masuk dulu ke folder itu dengan `cd nama-folder`.

3. Jalankan satu per satu:

```bash
git init
git add .
git commit -m "English Club Hub v1.0.0"
git branch -M main
git remote add origin https://github.com/USERNAME/english-club-hub.git
git push -u origin main
```

   Ganti `USERNAME` dengan username GitHub Anda. Perhatikan titik di akhir `git add .`

4. Saat diminta kata sandi, tempel **Personal Access Token**, bukan kata sandi akun GitHub. Layar memang tidak menampilkan apa pun saat Anda menempel. Itu normal, tekan Enter saja.

   Cara membuat token: buka https://github.com/settings/tokens → **Generate new token (classic)** → beri nama → centang **repo** → **Generate token** → salin token yang diawali `ghp_` (hanya tampil sekali).

Tanda berhasil: muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### B5. Aktifkan GitHub Pages

1. Di halaman repository, buka **Settings** → **Pages**.
2. Source: **Deploy from a branch**. Branch: **main**, folder **/ (root)**. Klik **Save**.
3. Centang **Enforce HTTPS**. Ini wajib agar fitur rekam suara di tantangan speaking bisa dipakai.
4. Tunggu 1–2 menit, lalu muat ulang. Alamat situs muncul: `https://USERNAME.github.io/english-club-hub/`

Buka alamat itu. Halaman depan English Club dengan maskot Leo akan tampil.

---

## Bagian C — Langkah pertama setelah online

1. **Masuk sebagai admin.** Klik Masuk Anggota, isi `admin` dan kata sandi dari log setup, lalu buat kata sandi baru.
2. **Atur identitas.** Buka **Pengaturan Aplikasi**:
   - Identitas & tema: nama aplikasi, logo, dan warna. Pratinjau langsung tampil di kanan.
   - Halaman publik: visi, misi, kegiatan, prestasi, nama dan kontak Pembina, jadwal pertemuan.
   - Unggahan: batas ukuran berkas (bawaan 10 MB) dan format yang diizinkan.
3. **Buat akun Pembina.** Buka Pengguna → **Buat akun** → peran **Pembina**.
4. **Masukkan anggota.** Buka **Import Data**:
   - Dari Google Sheets: tempel URL spreadsheet daftar anggota yang berisi kolom Nama, Kelas, dan WA.
   - Dari CSV: unduh template, isi, lalu unggah.
   - Tekan **Pindai** untuk melihat hasilnya tanpa menyimpan, lalu **Jalankan import**.
   - Kata sandi awal setiap anggota tampil sekali. Klik **Cetak kartu** atau **CSV** dan bagikan secara pribadi.
5. **Pembina mulai mengisi.** Pembina menyiapkan materi, tantangan harian/mingguan, kuis di Quiz Builder, dan pengumuman. Saat tantangan atau pengumuman diterbitkan, semua siswa mendapat notifikasi.

Setiap akun baru wajib membuat kata sandi sendiri saat masuk pertama.

---

## Keamanan dan rahasia

| Yang disimpan | Di mana | Keterangan |
|---|---|---|
| Kunci sesi (`SESSION_SECRET`) | Script Properties | Dibuat otomatis oleh setup |
| Hash kata sandi setiap pengguna (`PW_…`) | Script Properties | Kata sandi asli tidak pernah disimpan |
| ID spreadsheet dan folder Drive | Script Properties | Dicatat juga di sheet `AppConfig` sebagai catatan |
| Data pengguna, nilai, XP | Google Sheets | Tanpa kata sandi |
| Berkas tugas siswa | Google Drive (privat) | Hanya disajikan aplikasi setelah cek akses |
| Alamat `/exec` | `js/config.js` | Bukan rahasia |

Fungsi darurat di editor Apps Script (pilih fungsi lalu Jalankan):

| Fungsi | Kegunaan |
|---|---|
| `resetSandiAdmin` | Membuat kata sandi baru untuk akun `admin` bila lupa. Kata sandi tampil di log. |
| `rotasiSecretSesi` | Mengeluarkan semua pengguna dari semua perangkat, misalnya bila ada kebocoran. |
| `bersihkanCache` | Memaksa aplikasi membaca ulang spreadsheet setelah diedit langsung. |
| `cekPerforma` | Menampilkan jumlah baris tiap sheet, pemicu, dan ukuran Script Properties. |
| `matikanKeepWarm` / `nyalakanKeepWarm` | Mematikan atau menyalakan pemanasan otomatis. |

Penting:

- **Jangan bagikan spreadsheet database** dan **jangan menambah editor proyek Apps Script** sembarangan. Siapa pun yang bisa mengedit proyek dapat melihat Script Properties.
- Login salah 5 kali berturut-turut mengunci akun itu selama 15 menit.
- Sesi berlaku 12 jam, atau 14 hari bila "Ingat saya" dicentang. Siswa bisa memilih "Keluar dari semua perangkat" di Profil.
- Mengedit data langsung di spreadsheet boleh, tetapi perubahan baru terlihat setelah paling lama 30 menit, atau segera bila Admin menekan **Segarkan data** di Dashboard Admin.

---

## Kecepatan dan kuota Google

Aplikasi memakai beberapa cara agar tetap cepat walau datanya banyak: cache bertingkat, beberapa permintaan digabung menjadi satu, data tampil dari simpanan lokal dulu lalu diperbarui, dan pemanasan server tiap 5 menit.

Pemicu memakai kuota waktu harian Google: sekitar 90 menit per hari untuk akun Gmail biasa, dan sekitar 6 jam untuk akun Google Workspace sekolah. Perkiraan pemakaian aplikasi ini sekitar 5–15 menit per hari. Bila kuota terasa sempit, jalankan `matikanKeepWarm`. Aplikasi tetap berjalan, hanya pembukaan pertama setelah lama tidak dipakai menjadi lebih lambat.

---

## Memperbarui aplikasi nanti

**Backend:** tempel `Kode.gs` versi baru → Simpan → jalankan `setupAplikasi` (aman diulang, data tidak tersentuh) → **Terapkan → Kelola penerapan → ✏️ Edit → Versi: Versi baru → Terapkan**.
Jangan memilih "Penerapan baru", karena URL `/exec` akan berganti.

**Frontend:** salin berkas baru ke folder proyek, lalu:

```bash
git add .
git commit -m "Pembaruan"
git push
```

Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R** di browser.

---

## Maskot Leo

Leo si bunglon menemani siswa di halaman siswa. Leo menyapa sekali sehari, memberi petunjuk saat diketuk, dan bereaksi saat siswa mendapat XP, naik level, meraih badge, atau selesai kuis. Warnanya berubah sesuai situasi: ungu saat santai, biru saat fokus, emas saat merayakan, dan oranye lembut saat menyemangati.

- Siswa bisa menyembunyikan Leo atau mengurangi animasi di **Profil**.
- Admin bisa menyembunyikan Leo untuk semua pengguna di **Pengaturan Aplikasi**.
- Di halaman Pembina dan Admin, Leo tidak melayang agar tidak menutupi tabel.

---

## Batasan Fase 1

- Fitur Fase 2 belum tersedia: Speaking Studio terpisah, Team Mission, absensi, Hall of Fame, komunitas, dan PDF resmi berlogo. Laporan saat ini bisa dicetak atau disimpan sebagai PDF lewat dialog cetak browser, atau diunduh sebagai CSV.
- Notifikasi hanya muncul di dalam aplikasi. Integrasi WhatsApp direncanakan di Fase 3.
- Unggah langsung dibatasi sesuai pengaturan (maksimal 25 MB). Video besar sebaiknya lewat tautan Google Drive atau YouTube.
- Rekam suara di halaman tantangan membutuhkan izin mikrofon dan situs ber-HTTPS.
- Pembuatan akun hanya bisa dilakukan Admin, sesuai keputusan PRD.

---

## Kendala umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar "Konfigurasi belum lengkap" | `GAS_URL` di `js/config.js` belum diisi | Isi URL `/exec`, lalu push ulang |
| "Tidak dapat terhubung ke server" | URL salah atau akses penerapan bukan "Siapa saja" | Cek URL di tab baru (langkah A4) dan pengaturan penerapan |
| Situs 404 di GitHub Pages | `index.html` tidak berada di root repository | Pastikan `git init` dijalankan di folder yang berisi `index.html` |
| Tampilan polos tanpa warna | Folder `css/` atau `js/` tidak ikut terunggah | Unggah lewat terminal, jangan lewat "Upload files" |
| "Password authentication is not supported" | GitHub menolak kata sandi akun | Pakai Personal Access Token (langkah B4) |
| Perubahan backend tidak terasa | Belum membuat versi baru penerapan | Kelola penerapan → Edit → Versi baru |
| Edit langsung di spreadsheet belum muncul | Data masih dari cache | Dashboard Admin → Segarkan data |
| Admin lupa kata sandi | — | Jalankan `resetSandiAdmin` di editor |
| Tombol rekam tidak berfungsi | Izin mikrofon ditolak atau situs belum HTTPS | Izinkan mikrofon; centang Enforce HTTPS |
| Berkas gagal diunggah | Ukuran melebihi batas atau format tidak diizinkan | Gunakan tautan Google Drive, atau ubah batas di Pengaturan → Unggahan |

---

## Hasil pengujian sebelum diserahkan

Pengujian dilakukan di simulator Google Apps Script (Node.js) dan browser Chromium, bukan di server Google yang sebenarnya. Setelah dipasang, lakukan sekali uji singkat: masuk, kerjakan satu kuis, dan kirim satu tugas.

- 113 uji backend lulus: setup diulang tanpa duplikasi, login dan penguncian, wajib ganti kata sandi, pencabutan sesi, hak akses per peran, privasi berkas antarsiswa, kunci jawaban kuis tidak bocor, XP tidak terhitung ganda, badge otomatis, import dengan pratinjau yang aman diulang, serta tidak ada kata sandi atau hash di spreadsheet.
- Uji skala 200 akun, 9.000 riwayat XP, dan 5.000 notifikasi: setelah cache hangat, dashboard siswa, leaderboard, dan dashboard Pembina dilayani tanpa membaca spreadsheet.
- Uji browser di desktop (1366 px) dan HP (390 px): semua halaman Siswa, Pembina, dan Admin terbuka tanpa error JavaScript, termasuk alur kirim tugas, kuis, penilaian, buat akun, ganti tema, unggah logo, dan foto profil.
