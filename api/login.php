<?php
// ============================================================
// api/login.php — Autentikasi Admin
// POST { username, password }
// Returns { sukses, pesan, username, nama }
// ============================================================
require_once 'koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sukses' => false, 'pesan' => 'Method tidak diizinkan.']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$password = trim($body['password'] ?? '');

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['sukses' => false, 'pesan' => 'Username dan password wajib diisi.']);
    exit;
}

$stmt = $conn->prepare(
    "SELECT id, username, nama FROM admin
     WHERE username = ? AND password = ? AND aktif = 1 LIMIT 1"
);
$stmt->bind_param('ss', $username, $password);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 1) {
    $admin = $res->fetch_assoc();

    // Catat last_login
    $upd = $conn->prepare("UPDATE admin SET last_login = NOW() WHERE id = ?");
    $upd->bind_param('i', $admin['id']);
    $upd->execute();
    $upd->close();

    echo json_encode([
        'sukses'   => true,
        'pesan'    => 'Login berhasil.',
        'username' => $admin['username'],
        'nama'     => $admin['nama'],
    ]);
} else {
    http_response_code(401);
    echo json_encode(['sukses' => false, 'pesan' => 'Username atau password salah.']);
}

$stmt->close();
$conn->close();
?>
