<?php
// ============================================================
// api/pesanan.php — CRUD Pesanan
// GET    ?kode= / ?status= / ?cari=
// POST   { body }   → buat pesanan baru
// PUT    { kode, status }
// DELETE ?kode=
// ============================================================
require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    $kode   = isset($_GET['kode'])   ? $conn->real_escape_string(trim($_GET['kode']))   : null;
    $status = isset($_GET['status']) ? $conn->real_escape_string(trim($_GET['status'])) : null;
    $cari   = isset($_GET['cari'])   ? $conn->real_escape_string(trim($_GET['cari']))   : null;

    if ($kode) {
        $sql = "SELECT * FROM pesanan WHERE kode='$kode' LIMIT 1";
    } elseif ($status && $status !== 'semua') {
        $sql = "SELECT * FROM pesanan WHERE status='$status' ORDER BY created_at DESC";
    } elseif ($cari) {
        $sql = "SELECT * FROM pesanan WHERE nama_penyewa LIKE '%$cari%' OR kode LIKE '%$cari%' OR nama_event LIKE '%$cari%' ORDER BY created_at DESC";
    } else {
        $sql = "SELECT * FROM pesanan ORDER BY created_at DESC";
    }

    $result = $conn->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['sukses' => false, 'pesan' => 'Query error: ' . $conn->error]);
        $conn->close(); exit;
    }

    $list = [];
    while ($row = $result->fetch_assoc()) {
        $row['id']          = (int)$row['id'];
        $row['grand_total'] = (int)$row['grand_total'];

        // Auto-update terlambat
        if ($row['status'] === 'aktif') {
            if (new DateTime($row['tgl_kembali']) < new DateTime(date('Y-m-d'))) {
                $conn->query("UPDATE pesanan SET status='terlambat' WHERE id={$row['id']}");
                $row['status'] = 'terlambat';
            }
        }

        // Ambil item pesanan
        $pid  = $row['id'];
        $iRes = $conn->query(
            "SELECT pi.*, p.nama, p.ico FROM pesanan_item pi
             JOIN produk p ON pi.produk_id = p.id WHERE pi.pesanan_id = $pid"
        );
        $items = [];
        while ($item = $iRes->fetch_assoc()) {
            $item['jumlah']     = (int)$item['jumlah'];
            $item['harga_hari'] = (int)$item['harga_hari'];
            $item['total_hari'] = (int)$item['total_hari'];
            $item['subtotal']   = (int)$item['subtotal'];
            $items[] = $item;
        }
        $row['items'] = $items;
        $list[] = $row;
    }

    echo json_encode(['sukses' => true, 'data' => $list, 'total' => count($list)]);

// ── POST : Buat pesanan baru ─────────────────────────────────
} elseif ($method === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $errors = [];

    if (empty($body['nama_penyewa'])) $errors[] = 'Nama penyewa wajib diisi.';
    if (empty($body['no_telp']))      $errors[] = 'No. telepon wajib diisi.';
    if (empty($body['tgl_mulai']))    $errors[] = 'Tanggal mulai wajib diisi.';
    if (empty($body['tgl_kembali'])) $errors[] = 'Tanggal kembali wajib diisi.';
    if (empty($body['items']))        $errors[] = 'Minimal 1 barang harus dipilih.';

    if ($errors) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => implode(' ', $errors)]);
        $conn->close(); exit;
    }

    $totalHari = (int)(new DateTime($body['tgl_mulai']))->diff(new DateTime($body['tgl_kembali']))->days;
    if ($totalHari <= 0) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => 'Tanggal kembali harus setelah tanggal mulai.']);
        $conn->close(); exit;
    }

    $kode       = 'EVT-' . substr(time(), -6) . '-' . rand(100, 999);
    $grandTotal = array_sum(array_column($body['items'], 'subtotal'));
    $nama       = $conn->real_escape_string($body['nama_penyewa']);
    $telp       = $conn->real_escape_string($body['no_telp']);
    $event      = $conn->real_escape_string($body['nama_event'] ?? '');
    $mulai      = $conn->real_escape_string($body['tgl_mulai']);
    $kembali    = $conn->real_escape_string($body['tgl_kembali']);

    $conn->begin_transaction();
    try {
        $conn->query(
            "INSERT INTO pesanan (kode, nama_penyewa, no_telp, nama_event, tgl_mulai, tgl_kembali, grand_total)
             VALUES ('$kode','$nama','$telp','$event','$mulai','$kembali',$grandTotal)"
        );
        $pesananId = $conn->insert_id;

        foreach ($body['items'] as $item) {
            $pid = (int)$item['id'];
            $jml = (int)$item['jml'];
            $hrg = (int)$item['harga'];
            $sub = (int)$item['subtotal'];
            $conn->query("INSERT INTO pesanan_item (pesanan_id, produk_id, jumlah, harga_hari, total_hari, subtotal)
                          VALUES ($pesananId,$pid,$jml,$hrg,$totalHari,$sub)");
            $conn->query("UPDATE produk SET stok = stok - $jml WHERE id=$pid AND stok >= $jml");
        }

        $conn->commit();
        echo json_encode(['sukses' => true, 'kode' => $kode, 'grand_total' => $grandTotal, 'pesan' => 'Pesanan berhasil dibuat.']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['sukses' => false, 'pesan' => 'Gagal menyimpan: ' . $e->getMessage()]);
    }

// ── PUT : Update status ──────────────────────────────────────
} elseif ($method === 'PUT') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $kode   = $conn->real_escape_string($body['kode']   ?? '');
    $status = $conn->real_escape_string($body['status'] ?? '');

    if (!$kode || !in_array($status, ['aktif','selesai','terlambat'])) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => 'Data tidak valid.']);
        $conn->close(); exit;
    }

    if ($status === 'selesai') {
        $pRes = $conn->query("SELECT id FROM pesanan WHERE kode='$kode'");
        if ($pRow = $pRes->fetch_assoc()) {
            $pid  = $pRow['id'];
            $iRes = $conn->query("SELECT produk_id, jumlah FROM pesanan_item WHERE pesanan_id=$pid");
            while ($r = $iRes->fetch_assoc())
                $conn->query("UPDATE produk SET stok = stok + {$r['jumlah']} WHERE id={$r['produk_id']}");
        }
    }

    $conn->query("UPDATE pesanan SET status='$status' WHERE kode='$kode'");
    echo json_encode(['sukses' => true, 'pesan' => "Status diubah ke $status."]);

// ── DELETE ───────────────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $kode = isset($_GET['kode']) ? $conn->real_escape_string(trim($_GET['kode'])) : '';
    if (!$kode) {
        http_response_code(400);
        echo json_encode(['sukses' => false, 'pesan' => 'Kode pesanan wajib diisi.']);
        $conn->close(); exit;
    }
    $conn->query("DELETE FROM pesanan WHERE kode='$kode'");
    $ok = $conn->affected_rows > 0;
    echo json_encode(['sukses' => $ok, 'pesan' => $ok ? 'Pesanan dihapus.' : 'Pesanan tidak ditemukan.']);

} else {
    http_response_code(405);
    echo json_encode(['sukses' => false, 'pesan' => 'Method tidak diizinkan.']);
}

$conn->close();
?>
