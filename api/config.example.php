<?php
// ============================================================
// api/config.example.php
// RENAME file ini menjadi config.php lalu isi nilainya
// File config.php TIDAK akan ter-upload ke GitHub (.gitignore)
// ============================================================

define('DB_HOST', 'localhost');   // Contoh: 'localhost'
define('DB_USER', 'root');        // Contoh XAMPP: 'root'
define('DB_PASS', '');            // Contoh XAMPP: '' (kosong)
define('DB_NAME', 'eventra');     // Nama database Anda

define('SESSION_TIMEOUT', 3600);  // Sesi berakhir 1 jam
define('APP_NAME',    'EVENTRA');
define('APP_VERSION', '1.0.0');
define('APP_ENV',     'local');   // Ganti 'production' saat di hosting
