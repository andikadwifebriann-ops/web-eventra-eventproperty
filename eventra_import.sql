-- ============================================================
--  EVENTRA — File Import phpMyAdmin / XAMPP
--
--  Cara import:
--    1. Buka  http://localhost/phpmyadmin
--    2. Klik tab "Import"
--    3. Pilih file ini → klik "Kirim / Go"
--
--  Akun admin default:
--    username : admin
--    password : admin123
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS eventra;
CREATE DATABASE eventra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eventra;

-- ============================================================
-- TABEL 1 : admin  (hanya admin yang bisa login)
-- ============================================================
CREATE TABLE admin (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL COMMENT 'plaintext — bisa diubah langsung di phpMyAdmin',
  nama       VARCHAR(100) NOT NULL DEFAULT 'Administrator',
  aktif      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login TIMESTAMP    NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL 2 : produk
-- ============================================================
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
) ENGINE=InnoDB;

-- ============================================================
-- TABEL 3 : pesanan
-- ============================================================
CREATE TABLE pesanan (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  kode         VARCHAR(30)  NOT NULL UNIQUE,
  nama_penyewa VARCHAR(100) NOT NULL,
  no_telp      VARCHAR(20)  NOT NULL,
  nama_event   VARCHAR(100) NULL,
  tgl_mulai    DATE         NOT NULL,
  tgl_kembali  DATE         NOT NULL,
  grand_total  BIGINT       NOT NULL DEFAULT 0,
  status       ENUM('aktif','selesai','terlambat') NOT NULL DEFAULT 'aktif',
  catatan      TEXT         NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL 4 : pesanan_item
-- ============================================================
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
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DATA : admin  (password PLAINTEXT — bisa diubah langsung di phpMyAdmin)
-- ============================================================
INSERT INTO admin (username, password, nama) VALUES
('admin',         'admin123',      'Administrator'),
('admin_eventra', 'admin_eventra', 'Administrator');

-- ============================================================
-- DATA : produk
-- ============================================================
INSERT INTO produk (nama, kategori, deskripsi, harga_hari, stok, tipe, berat_kg, daya_watt, ico) VALUES
('Tenda Pesta 10x20m',      'tenda',       'Tenda premium tahan hujan, 100-150 orang',   750000,  5, 'fisik',       85,   NULL, '⛺'),
('Tenda Dome 3x3m',         'tenda',       'Cocok untuk booth & registrasi',             150000, 15, 'fisik',       12,   NULL, '🏕'),
('Kursi Tiffany Gold',      'kursi',       'Kursi mewah untuk pernikahan & gala dinner',  15000,200, 'fisik',        3,   NULL, '🪑'),
('Meja Bulat O120cm',       'kursi',       'Meja bundar kapasitas 8 orang',               35000, 80, 'fisik',       18,   NULL, '🪑'),
('Kursi Futura Lipat',      'kursi',       'Kursi lipat ringan untuk seminar',             8000,500, 'fisik',      1.5,   NULL, '🪑'),
('Sound System 10000W',     'audio',       'Speaker aktif + mixer profesional',          500000,  3, 'elektronik', NULL, 10000, '🔊'),
('Microphone Wireless Set', 'audio',       '4 mikrofon wireless + receiver',             150000, 10, 'elektronik', NULL,    50, '🎤'),
('LED Screen 4x3m',         'audio',       'Layar LED outdoor Full HD',                  800000,  2, 'elektronik', NULL,  3000, '📺'),
('Proyektor 10000 Lumen',   'audio',       'Proyektor ultra-terang ruang besar',         350000,  5, 'elektronik', NULL,   500, '📽'),
('Backdrop Kain 4x3m',      'dekorasi',    'Backdrop cetak custom request desain',       120000, 20, 'fisik',        5,   NULL, '🌸'),
('Flower Wall Panel',       'dekorasi',    'Dinding bunga artifisial premium',           200000, 12, 'fisik',        8,   NULL, '💐'),
('Arch Bunga Segar 3m',     'dekorasi',    'Gerbang bunga segar untuk akad/nikah',       500000,  4, 'fisik',       30,   NULL, '🌺'),
('Moving Head 19 Eyes',     'pencahayaan', 'Lampu LED 19 mata untuk stage',              250000, 12, 'elektronik', NULL,   350, '💡'),
('Par LED RGB 54',          'pencahayaan', 'Lampu par LED untuk ambient lighting',        75000, 40, 'elektronik', NULL,    54, '💡'),
('Laser Show RGB',          'pencahayaan', 'Efek laser warna-warni entertainment',       300000,  6, 'elektronik', NULL,   800, '🔦'),
('Meja Prasmanan 180cm',    'catering',    'Meja panjang untuk display buffet',           30000, 50, 'fisik',       20,   NULL, '🍽'),
('Chafing Dish Set',        'catering',    'Set pemanas makanan stainless 3 lubang',      60000, 30, 'fisik',        5,   NULL, '🥘'),
('Genset 10 KVA',           'pencahayaan', 'Generator silent cukup 200 orang',           600000,  5, 'fisik',      200,   NULL, '⚡');

-- ============================================================
-- DATA : contoh pesanan
-- ============================================================
INSERT INTO pesanan (kode, nama_penyewa, no_telp, nama_event, tgl_mulai, tgl_kembali, grand_total, status) VALUES
('EVT-DEMO-001', 'Budi Santoso', '081234567890', 'Pernikahan Budi & Sari', '2026-03-10', '2026-03-12', 0, 'aktif'),
('EVT-DEMO-002', 'Dewi Rahayu',  '082345678901', 'Seminar Nasional 2026',  '2026-03-01', '2026-03-02', 0, 'selesai');

INSERT INTO pesanan_item (pesanan_id, produk_id, jumlah, harga_hari, total_hari, subtotal) VALUES
(1,  1,  1, 750000, 2, 1500000),
(1,  3, 50,  15000, 2, 1500000),
(1, 10,  1, 120000, 2,  240000),
(2,  6,  1, 500000, 1,  500000),
(2,  7,  1, 150000, 1,  150000);

UPDATE pesanan SET grand_total = (
  SELECT COALESCE(SUM(subtotal), 0) FROM pesanan_item WHERE pesanan_id = pesanan.id
);

-- ============================================================
SELECT '✅ Import berhasil! Login: admin / admin123' AS STATUS;
SELECT COUNT(*) AS total_produk  FROM produk;
SELECT COUNT(*) AS total_pesanan FROM pesanan;
