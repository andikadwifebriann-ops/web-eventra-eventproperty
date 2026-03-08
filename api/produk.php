<?php
// ============================================================
// api/produk.php — CRUD Produk
// GET    ?kat=   → semua / filter kategori
// POST           → tambah produk baru
// PUT            → edit produk
// DELETE ?id=    → nonaktifkan produk
// ============================================================
require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $kat = isset($_GET['kat']) ? $conn->real_escape_string(trim($_GET['kat'])) : 'semua';

    $sql = ($kat !== 'semua')
        ? "SELECT * FROM produk WHERE kategori='$kat' AND aktif=1 ORDER BY nama"
        : "SELECT * FROM produk WHERE aktif=1 ORDER BY kategori, nama";

    $result = $conn->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['sukses' => false, 'pesan' => 'Query error: ' . $conn->error]);
        $conn->close(); exit;
    }

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $row['id']         = (int)$row['id'];
        $row['harga_hari'] = (int)$row['harga_hari'];
        $row['stok']       = (int)$row['stok'];
        $row['berat_kg']   = $row['berat_kg']  !== null ? (float)$row['berat_kg']  : null;
        $row['daya_watt']  = $row['daya_watt'] !== null ? (int)$row['daya_watt']   : null;
        $data[] = $row;
    }

    echo json_encode(['sukses' => true, 'data' => $data, 'total' => count($data)]);

// ── POST : Tambah produk baru ────────────────────────────────
} elseif ($method === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $errors = [];

    if (empty(trim($body['nama']     ?? ''))) $errors[] = 'Nama produk wajib diisi.';
    if (empty(trim($body['kategori'] ?? ''))) $errors[] = 'Kategori wajib dipilih.';
    if (!isset($body['harga_hari']) || (int)$body['harga_hari'] <= 0) $errors[] = 'Harga/hari wajib diisi (>0).';
    if (!isset($body['stok'])       || (int)$body['stok']  < 0)       $errors[] = 'Stok tidak boleh negatif.';

    if ($errors) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => implode(' ', $errors)]);
        $conn->close(); exit;
    }

    $nama      = $conn->real_escape_string(trim($body['nama']));
    $kategori  = $conn->real_escape_string(trim($body['kategori']));
    $deskripsi = $conn->real_escape_string(trim($body['deskripsi'] ?? ''));
    $harga     = (int)$body['harga_hari'];
    $stok      = (int)$body['stok'];
    $tipe      = in_array($body['tipe'] ?? '', ['fisik','elektronik']) ? $body['tipe'] : 'fisik';
    $ico       = $conn->real_escape_string(trim($body['ico'] ?? '📦'));
    $beratVal  = (isset($body['berat_kg'])  && $body['berat_kg']  !== '') ? (float)$body['berat_kg']  : 'NULL';
    $dayaVal   = (isset($body['daya_watt']) && $body['daya_watt'] !== '') ? (int)$body['daya_watt']   : 'NULL';

    $ok = $conn->query(
        "INSERT INTO produk (nama, kategori, deskripsi, harga_hari, stok, tipe, berat_kg, daya_watt, ico)
         VALUES ('$nama','$kategori','$deskripsi',$harga,$stok,'$tipe',$beratVal,$dayaVal,'$ico')"
    );

    if ($ok) {
        echo json_encode(['sukses' => true, 'pesan' => "Produk '$nama' berhasil ditambahkan.", 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['sukses' => false, 'pesan' => 'Gagal menyimpan: ' . $conn->error]);
    }

// ── PUT : Edit produk ────────────────────────────────────────
} elseif ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int)($body['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => 'ID produk tidak valid.']);
        $conn->close(); exit;
    }

    $nama      = $conn->real_escape_string(trim($body['nama']      ?? ''));
    $kategori  = $conn->real_escape_string(trim($body['kategori']  ?? ''));
    $deskripsi = $conn->real_escape_string(trim($body['deskripsi'] ?? ''));
    $harga     = (int)($body['harga_hari'] ?? 0);
    $stok      = (int)($body['stok']       ?? 0);
    $tipe      = in_array($body['tipe'] ?? '', ['fisik','elektronik']) ? $body['tipe'] : 'fisik';
    $ico       = $conn->real_escape_string(trim($body['ico'] ?? '📦'));
    $beratVal  = (isset($body['berat_kg'])  && $body['berat_kg']  !== '') ? (float)$body['berat_kg']  : 'NULL';
    $dayaVal   = (isset($body['daya_watt']) && $body['daya_watt'] !== '') ? (int)$body['daya_watt']   : 'NULL';

    $conn->query(
        "UPDATE produk SET
            nama='$nama', kategori='$kategori', deskripsi='$deskripsi',
            harga_hari=$harga, stok=$stok, tipe='$tipe',
            berat_kg=$beratVal, daya_watt=$dayaVal, ico='$ico'
         WHERE id=$id AND aktif=1"
    );
    echo json_encode(['sukses' => true, 'pesan' => 'Produk berhasil diperbarui.']);

// ── DELETE : Nonaktifkan produk ──────────────────────────────
} elseif ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => 'ID tidak valid.']);
        $conn->close(); exit;
    }
    $conn->query("UPDATE produk SET aktif=0 WHERE id=$id");
    $ok = $conn->affected_rows > 0;
    echo json_encode(['sukses' => $ok, 'pesan' => $ok ? 'Produk dihapus.' : 'Produk tidak ditemukan.']);

} else {
    http_response_code(405);
    echo json_encode(['sukses' => false, 'pesan' => 'Method tidak diizinkan.']);
}

$conn->close();
?>
