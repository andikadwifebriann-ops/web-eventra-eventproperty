<?php

// api/config.php — Konfigurasi Aplikasi EVENTRA

// ── Database ─────────────────────────────────────────────────
define('DB_HOST', 'localhost');   // Hosting: biasanya 'localhost'
define('DB_USER', 'root');        // XAMPP default: 'root'
define('DB_PASS', '');            // XAMPP default: '' (kosong)
define('DB_NAME', 'eventra');     // Nama database

// ── Keamanan Session ─────────────────────────────────────────
define('SESSION_TIMEOUT', 3600);  // Sesi berakhir setelah 1 jam (detik)

// ── Aplikasi ─────────────────────────────────────────────────
define('APP_NAME',    'EVENTRA');
define('APP_VERSION', '1.0.0');
define('APP_ENV',     'local');   // Ganti ke 'production' saat di hosting
