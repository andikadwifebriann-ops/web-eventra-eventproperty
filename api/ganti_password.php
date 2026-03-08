<?php

// api/ganti_password.php — Ganti Password Admin
// POST { username, password_lama, password_baru, konfirmasi }
// Returns { sukses, pesan }

require_once 'koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sukses' => false, 'pesan' => 'Method tidak diizinkan.']);
    exit;
}

$body          = json_decode(file_get_contents('php://input'), true);
$username      = trim($body['username']      ?? '');
$password_lama = trim($body['password_lama'] ?? '');
$password_baru = trim($body['password_baru'] ?? '');
$konfirmasi    = trim($body['konfirmasi']    ?? '');

if (!$username || !$password_lama || !$password_baru || !$konfirmasi) {
    http_response_code(400);
    echo json_encode(['sukses' => false, 'pesan' => 'Semua field wajib diisi.']);
    exit;
}
if ($password_baru !== $konfirmasi) {
    http_response_code(400);
    echo json_encode(['sukses' => false, 'pesan' => 'Konfirmasi password baru tidak cocok.']);
    exit;
}
if (strlen($password_baru) < 6) {
    http_response_code(400);
    echo json_encode(['sukses' => false, 'pesan' => 'Password baru minimal 6 karakter.']);
    exit;
}
if ($password_baru === $password_lama) {
    http_response_code(400);
    echo json_encode(['sukses' => false, 'pesan' => 'Password baru tidak boleh sama dengan password lama.']);
    exit;
}

// Cek password lama cocok
$stmt = $conn->prepare(
    "SELECT id FROM admin WHERE username = ? AND password = ? AND aktif = 1 LIMIT 1"
);
$stmt->bind_param('ss', $username, $password_lama);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
    http_response_code(401);
    echo json_encode(['sukses' => false, 'pesan' => 'Password lama tidak sesuai.']);
    $stmt->close(); $conn->close(); exit;
}
$admin = $res->fetch_assoc();
$stmt->close();

// Update password baru (plaintext)
$upd = $conn->prepare("UPDATE admin SET password = ? WHERE id = ?");
$upd->bind_param('si', $password_baru, $admin['id']);
$upd->execute();
$ok = $upd->affected_rows > 0;
$upd->close();
$conn->close();

if ($ok) {
    echo json_encode(['sukses' => true, 'pesan' => 'Password berhasil diubah. Silakan login kembali.']);
} else {
    http_response_code(500);
    echo json_encode(['sukses' => false, 'pesan' => 'Gagal mengubah password di database.']);
}
?>
