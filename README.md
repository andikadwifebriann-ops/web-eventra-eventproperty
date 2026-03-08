# ◈ EVENTRA — Rental Properti & Barang Event

> Sistem manajemen rental properti & barang event berbasis web.  
> Admin dapat login, kelola katalog, terima booking, dan pantau pesanan secara real-time.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)

---

## 📁 Struktur File

```
eventra/
├── index.html               # Antarmuka utama (login, katalog, booking, pesanan)
├── style.css                # Layout responsif & semua komponen UI
├── app.js                   # Logika klien (namespace: auth|api|ui|model|data|kelola|report)
├── eventra_import.sql       # File import database
└── api/
    ├── config.example.php   # Template konfigurasi — rename menjadi config.php
    ├── config.php           # Konfigurasi database (tidak di-upload ke GitHub)
    ├── koneksi.php          # Koneksi MySQL + header CORS + charset utf8mb4
    ├── login.php            # POST — autentikasi admin
    ├── ganti_password.php   # POST — ganti password admin
    ├── produk.php           # GET/POST/PUT/DELETE — CRUD katalog produk
    └── pesanan.php          # GET/POST/PUT/DELETE — CRUD pesanan & stok
```

---

## ⚙️ Instalasi

### Prasyarat
- [XAMPP](https://www.apachefriends.org/) dengan **Apache** & **MySQL** aktif

### Langkah

**1. Salin folder project ke XAMPP**
```
C:/xampp/htdocs/eventra/
```

**2. Setup konfigurasi database**
```
Rename file: api/config.example.php  →  api/config.php
```
Isi default sudah sesuai XAMPP, tidak perlu diubah kecuali ada perbedaan.

**3. Import database via phpMyAdmin**
```
Buka  : http://localhost/phpmyadmin
Klik  : Tab Import
Pilih : file eventra_import.sql
Klik  : Go / Kirim
```

**4. Jalankan aplikasi**
```
http://localhost/eventra/
```

**5. Login dengan akun default**
```
Username : admin_eventra
Password : admin_eventra
```

---

## 🔑 Cara Ganti Password

### Via Aplikasi (direkomendasikan)
1. Login ke aplikasi
2. Klik tombol **🔑 Ganti Password** di navbar
3. Isi password lama, password baru, dan konfirmasi
4. Klik **Simpan Password**
5. Aplikasi otomatis logout — login kembali dengan password baru ✅

### Via phpMyAdmin (langsung)
1. Buka `http://localhost/phpmyadmin`
2. Pilih database `eventra` → tabel `admin`
3. Klik **Ubah** (ikon pensil ✏️) di baris admin
4. Kolom `password` → hapus isi lama → ketik password baru
5. Kolom **Fungsi** di sebelah kiri → biarkan **KOSONG**
6. Klik **Simpan** ✅

---

## 🌐 Endpoint API

### Autentikasi

| Method | Endpoint | Parameter | Keterangan |
|--------|----------|-----------|------------|
| `POST` | `api/login.php` | `{username, password}` | Login admin |
| `POST` | `api/ganti_password.php` | `{username, password_lama, password_baru, konfirmasi}` | Ganti password |

### Produk

| Method | Endpoint | Parameter | Keterangan |
|--------|----------|-----------|------------|
| `GET` | `api/produk.php` | `?kat=` (opsional) | Ambil semua produk aktif |
| `POST` | `api/produk.php` | JSON body | Tambah produk baru |
| `PUT` | `api/produk.php` | JSON body + `id` | Edit produk |
| `DELETE` | `api/produk.php` | `?id=` | Nonaktifkan produk |

### Pesanan

| Method | Endpoint | Parameter | Keterangan |
|--------|----------|-----------|------------|
| `GET` | `api/pesanan.php` | `?kode=` / `?status=` / `?cari=` | Ambil pesanan dengan filter |
| `POST` | `api/pesanan.php` | JSON body | Buat pesanan baru + kurangi stok |
| `PUT` | `api/pesanan.php` | `{kode, status}` | Ubah status pesanan |
| `DELETE` | `api/pesanan.php` | `?kode=` | Hapus pesanan |

### Contoh Respons JSON

```json
{ "sukses": true,  "pesan": "Login berhasil.", "username": "admin_eventra", "nama": "Administrator" }
{ "sukses": true,  "pesan": "Pesanan berhasil dibuat.", "kode": "EVT-123456-789" }
{ "sukses": false, "pesan": "Username atau password salah." }
```

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|------------|
| 🔐 Login & Autentikasi | Toggle show/hide password; badge nama admin aktif di navbar |
| 🔑 Ganti Password | Modal ganti password; verifikasi password lama; auto-logout setelah berhasil |
| 📦 Katalog Produk | Grid dengan filter kategori; tombol edit & hapus per kartu |
| ➕ Tambah / Edit Produk | Form modal lengkap dengan validasi; emoji ikon produk |
| 📋 Form Booking | Kalkulasi harga real-time; keranjang multi-item; validasi tanggal |
| 📊 Manajemen Pesanan | Filter Aktif / Selesai / Terlambat; auto-update status lewat jatuh tempo |
| 🔔 Toast Notifikasi | Pop-up sukses/gagal tiap aksi tanpa reload halaman |

---

## 🗄️ Skema Database

```sql
CREATE TABLE admin (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  nama       VARCHAR(100) NOT NULL DEFAULT 'Administrator',
  aktif      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login TIMESTAMP    NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produk (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  kategori   VARCHAR(50)  NOT NULL,
  deskripsi  TEXT,
  harga_hari INT          NOT NULL DEFAULT 0,
  stok       INT          NOT NULL DEFAULT 0,
  tipe       ENUM('fisik','elektronik') NOT NULL DEFAULT 'fisik',
  berat_kg   FLOAT        NULL,
  daya_watt  INT          NULL,
  ico        VARCHAR(10)  DEFAULT '📦',
  aktif      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pesanan (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  kode         VARCHAR(30)  UNIQUE NOT NULL,
  nama_penyewa VARCHAR(100) NOT NULL,
  no_telp      VARCHAR(20)  NOT NULL,
  nama_event   VARCHAR(100) NULL,
  tgl_mulai    DATE         NOT NULL,
  tgl_kembali  DATE         NOT NULL,
  grand_total  BIGINT       NOT NULL DEFAULT 0,
  status       ENUM('aktif','selesai','terlambat') NOT NULL DEFAULT 'aktif',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pesanan_item (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pesanan_id  INT    NOT NULL,
  produk_id   INT    NOT NULL,
  jumlah      INT    NOT NULL DEFAULT 1,
  harga_hari  INT    NOT NULL,
  total_hari  INT    NOT NULL,
  subtotal    BIGINT NOT NULL,
  FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE,
  FOREIGN KEY (produk_id)  REFERENCES produk(id)  ON DELETE RESTRICT
);
```

---

## 📜 Coding Guidelines

| Bahasa | Panduan |
|--------|---------|
| **HTML** | Tag semantik, `id`/`class` deskriptif, setiap input punya `<label>` |
| **CSS** | Variabel CSS untuk warna/spacing, responsif dengan media query |
| **JavaScript** | Namespace IIFE, camelCase, Promise `.then()` untuk fetch, validasi sisi klien |
| **PHP** | Prepared statement (cegah SQL Injection), sanitasi input, HTTP status code, transaksi DB |

---

## 🔒 Keamanan

| Aspek | Implementasi |
|-------|-------------|
| SQL Injection | Semua query menggunakan `prepared statement` + `bind_param` |
| Konfigurasi | Credentials database disimpan di `config.php` yang terpisah |
| Akses API | Header CORS dikontrol di `koneksi.php` |
| Validasi | Input divalidasi di sisi klien (JavaScript) dan server (PHP) |
| HTTP Response | Status code yang tepat (200, 400, 401, 405, 500) |

---

> © 2026 **EVENTRA Rental System** — FR-MUK.04 Tugas Praktek
