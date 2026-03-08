<?php
// ============================================================
// api/koneksi.php — Koneksi Database MySQL (XAMPP)
// Taruh folder "eventra" di : C:/xampp/htdocs/eventra
// Akses                      : http://localhost/eventra/
// ============================================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');   // default XAMPP
define('DB_PASS', '');       // default XAMPP (kosong)
define('DB_NAME', 'eventra');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['sukses' => false, 'pesan' => 'Koneksi database gagal: ' . $conn->connect_error]));
}

$conn->set_charset('utf8mb4');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
?>
