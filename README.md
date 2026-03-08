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
├── index.html          # Antarmuka utama (login, katalog, booking, pesanan)
├── style.css           # Layout responsif, variabel warna & semua komponen UI
├── app.js              # Logika klien (namespace: auth|api|ui|model|data|kelola|report)
└── api/
    ├── koneksi.php     # Koneksi MySQL + header CORS + charset utf8mb4
    ├── login.php       # POST — autentikasi admin (SHA-256)
    ├── produk.php      # GET/POST/PUT/DELETE — CRUD katalog produk
    └── pesanan.php     # GET/POST/PUT/DELETE — CRUD pesanan & stok
```

---

## ⚙️ Instalasi

### Prasyarat
- [XAMPP](https://www.apachefriends.org/) dengan **Apache** & **MySQL** aktif

### Langkah

**1. Salin folder proyek**
```
C:/xampp/htdocs/eventra/
```

**2. Buat database via phpMyAdmin**
```
http://localhost/phpmyadmin
→ New → Nama: eventra → Create
→ Tab Import → Pilih eventra.sql → Go
```

**3. Buka aplikasi**
```
http://localhost/eventra/
```

**4. Login dengan akun default**
```
Username : admin
Password : admin123
```

---

## 🌐 Endpoint API

### Produk

| Method   | Endpoint         | Parameter          | Keterangan                       |
|----------|------------------|--------------------|----------------------------------|
| `GET`    | `api/produk.php` | `?kat=` (opsional) | Ambil semua produk aktif         |
| `POST`   | `api/produk.php` | JSON body          | Tambah produk baru               |
| `PUT`    | `api/produk.php` | JSON body + `id`   | Edit produk                      |
| `DELETE` | `api/produk.php` | `?id=`             | Soft-delete produk (`aktif = 0`) |

### Pesanan

| Method   | Endpoint                  | Parameter                        | Keterangan                                |
|----------|---------------------------|----------------------------------|-------------------------------------------|
| `POST`   | `api/login.php`           | `{username, password}`           | Login admin                               |
| `POST`   | `api/ganti_password.php`  | `{username, password_lama, password_baru, konfirmasi}` | Ganti password admin        |
| `GET`    | `api/pesanan.php`         | `?kode=` / `?status=` / `?cari=` | Ambil pesanan dengan filter               |
| `POST`   | `api/pesanan.php`         | JSON body                        | Buat pesanan baru + kurangi stok          |
| `PUT`    | `api/pesanan.php`         | `{kode, status}`                 | Ubah status; kembalikan stok jika selesai |
| `DELETE` | `api/pesanan.php`         | `?kode=`                         | Hapus pesanan                             |

### Contoh Respons JSON

```json
{ "sukses": true,  "pesan": "Pesanan berhasil dibuat.", "kode": "EVT-123456-789" }
{ "sukses": false, "pesan": "Username atau password salah." }
```

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|------------|
| 🔐 Login & Autentikasi | Toggle show/hide password; SHA-256; badge nama admin aktif |
| 🔑 Ganti Password | Modal ganti password dengan verifikasi password lama; auto-logout setelah berhasil |
| 📦 Katalog Produk | Grid dengan filter kategori; tombol edit & hapus per kartu |
| 📋 Form Booking | Kalkulasi harga real-time; keranjang multi-item; validasi tanggal |
| 📊 Manajemen Pesanan | Filter Aktif / Selesai / Terlambat; auto-update status lewat jatuh tempo |
| 🔔 Toast Notifikasi | Pop-up sukses/gagal tiap aksi tanpa reload halaman |

---

## 🗄️ Skema Database

```sql
CREATE TABLE admin (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50) UNIQUE NOT NULL,
  password   VARCHAR(64) NOT NULL,        -- SHA2(password, 256)
  nama       VARCHAR(100),
  aktif      TINYINT DEFAULT 1,
  last_login DATETIME
);

CREATE TABLE produk (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  kategori   VARCHAR(50),
  deskripsi  TEXT,
  harga_hari INT NOT NULL,
  stok       INT DEFAULT 0,
  tipe       ENUM('fisik','elektronik') DEFAULT 'fisik',
  berat_kg   FLOAT,
  daya_watt  INT,
  ico        VARCHAR(10) DEFAULT '📦',
  aktif      TINYINT DEFAULT 1
);

CREATE TABLE pesanan (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  kode         VARCHAR(30) UNIQUE,
  nama_penyewa VARCHAR(100),
  no_telp      VARCHAR(20),
  nama_event   VARCHAR(100),
  tgl_mulai    DATE,
  tgl_kembali  DATE,
  grand_total  INT,
  status       ENUM('aktif','selesai','terlambat') DEFAULT 'aktif',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pesanan_item (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  pesanan_id INT,
  produk_id  INT,
  jumlah     INT,
  harga_hari INT,
  total_hari INT,
  subtotal   INT
);
```

---

## 📜 Coding Guidelines

| Bahasa | Panduan Utama |
|--------|---------------|
| **HTML** | Tag semantik, `id`/`class` deskriptif, setiap input punya `<label>` |
| **CSS** | Penamaan BEM, variabel CSS untuk warna/spacing, responsif dengan media query |
| **JavaScript** | Namespace IIFE, camelCase, `async/await` untuk fetch, validasi sisi klien |
| **PHP** | Prepared statement (cegah SQL Injection), sanitasi input, HTTP status code, transaksi DB |

---

> © 2026 **EVENTRA Rental System** — FR-MUK.04 Tugas Praktek
