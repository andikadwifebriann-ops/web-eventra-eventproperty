//    
// NAMESPACE 1 — auth : Login & Session Admin
//    
const auth = (() => {
  const SESSION_KEY = 'eventra_admin_session';

  /** Cek apakah sudah login */
  const isLoggedIn = () => !!sessionStorage.getItem(SESSION_KEY);

  /** Ambil data admin dari session */
  const getAdmin = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  };

  /** Simpan session setelah login */
  const _save = d => sessionStorage.setItem(SESSION_KEY, JSON.stringify(d));

  /** Logout — hapus session dan reload halaman */
  const logout = () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); };

  /**
   * Login via PHP API (database MySQL).
   * Jika XAMPP belum aktif, fallback ke pengecekan lokal.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{sukses:boolean, pesan:string, username?:string, nama?:string}>}
   */
  const _loginAPI = (username, password) =>
    fetch('api/login.php', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .catch(() => {
      // ── Fallback lokal (jika XAMPP belum aktif) ──
      if (username === 'admin' && password === 'admin123')
        return { sukses: true, pesan: 'Login lokal berhasil.', username: 'admin', nama: 'Administrator' };
      if (username === 'admin_eventra' && password === 'admin_eventra')
        return { sukses: true, pesan: 'Login lokal berhasil.', username: 'admin_eventra', nama: 'Administrator' };
      return { sukses: false, pesan: 'Username atau password salah.' };
    });

  /** Inisialisasi login overlay */
  const init = () => {
    const overlay   = document.getElementById('loginOverlay');
    const btnLogin  = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const lUser     = document.getElementById('lUser');
    const lPass     = document.getElementById('lPass');
    const errBox    = document.getElementById('loginErr');
    const togglePw  = document.getElementById('togglePw');
    const badge     = document.getElementById('adminBadge');

    // Sudah login → langsung sembunyikan overlay
    if (isLoggedIn()) {
      overlay.classList.add('hidden');
      const adm = getAdmin();
      if (adm && badge) badge.textContent = `👤 ${adm.nama || adm.username}`;
    }

    // Toggle tampilkan / sembunyikan password
    togglePw.addEventListener('click', () => {
      lPass.type = lPass.type === 'password' ? 'text' : 'password';
      togglePw.textContent = lPass.type === 'password' ? '👁' : '🙈';
    });

    // Proses login
    const doLogin = () => {
      const u = lUser.value.trim();
      const p = lPass.value.trim();
      if (!u || !p) {
        errBox.textContent   = '❌ Username dan password wajib diisi.';
        errBox.style.display = 'block'; return;
      }
      btnLogin.textContent = '⏳ Memeriksa...';
      btnLogin.disabled    = true;
      errBox.style.display = 'none';

      _loginAPI(u, p).then(res => {
        if (res.sukses) {
          _save(res);
          overlay.classList.add('hidden');
          if (badge) badge.textContent = `👤 ${res.nama || res.username}`;
        } else {
          errBox.textContent   = '❌ ' + res.pesan;
          errBox.style.display = 'block';
          lPass.value = ''; lPass.focus();
        }
        btnLogin.textContent = 'Masuk →';
        btnLogin.disabled    = false;
      });
    };

    btnLogin.addEventListener('click', doLogin);
    [lUser, lPass].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
    btnLogout.addEventListener('click', () => { if (confirm('Yakin ingin keluar?')) logout(); });

    // ── GANTI PASSWORD ──────────────────────────────────────
    const btnGantiPw   = document.getElementById('btnGantiPw');
    const gantiOverlay = document.getElementById('gantiPwOverlay');
    const gantiClose   = document.getElementById('gantiPwClose');
    const gantiErr     = document.getElementById('gantiPwErr');
    const gantiOk      = document.getElementById('gantiPwOk');
    const btnSimpanPw  = document.getElementById('btnSimpanPw');

    // Toggle show/hide password di setiap field
    ['tgLama','tgBaru','tgKonfirmasi'].forEach(tid => {
      const btn = document.getElementById(tid);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const inp = btn.previousElementSibling;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.textContent = inp.type === 'password' ? '👁' : '🙈';
      });
    });

    const _bukaGantiPw = () => {
      gantiOverlay.classList.add('open');
      gantiErr.style.display = 'none';
      gantiOk.style.display  = 'none';
      ['gpLama','gpBaru','gpKonfirmasi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.type = 'password'; }
      });
      ['tgLama','tgBaru','tgKonfirmasi'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = '👁';
      });
      setTimeout(() => { const el = document.getElementById('gpLama'); if (el) el.focus(); }, 150);
    };

    const _tutupGantiPw = () => gantiOverlay.classList.remove('open');

    if (btnGantiPw)   btnGantiPw.addEventListener('click', _bukaGantiPw);
    if (gantiClose)   gantiClose.addEventListener('click', _tutupGantiPw);
    if (gantiOverlay) gantiOverlay.addEventListener('click', e => { if (e.target === gantiOverlay) _tutupGantiPw(); });

    if (btnSimpanPw) {
      btnSimpanPw.addEventListener('click', () => {
        const adm     = getAdmin();
        const lama    = (document.getElementById('gpLama').value       || '').trim();
        const baru    = (document.getElementById('gpBaru').value       || '').trim();
        const konfirm = (document.getElementById('gpKonfirmasi').value || '').trim();

        const showErr = msg => { gantiErr.textContent = '❌ ' + msg; gantiErr.style.display = 'block'; gantiOk.style.display = 'none'; };

        gantiErr.style.display = 'none';
        gantiOk.style.display  = 'none';

        // Guard: session tidak ada
        if (!adm || !adm.username) return showErr('Sesi tidak ditemukan. Silakan logout dan login ulang.');

        if (!lama || !baru || !konfirm)  return showErr('Semua field wajib diisi.');
        if (baru.length < 6)             return showErr('Password baru minimal 6 karakter.');
        if (baru !== konfirm)            return showErr('Konfirmasi password tidak cocok.');
        if (baru === lama)               return showErr('Password baru tidak boleh sama dengan yang lama.');

        btnSimpanPw.textContent = '⏳ Menyimpan...';
        btnSimpanPw.disabled    = true;

        fetch('api/ganti_password.php', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ username: adm.username, password_lama: lama, password_baru: baru, konfirmasi: konfirm })
        })
        .then(r => {
          if (!r.ok && r.status !== 400 && r.status !== 401) throw new Error('Server error: ' + r.status);
          return r.json();
        })
        .then(res => {
          if (res.sukses) {
            gantiOk.textContent    = '✅ ' + res.pesan;
            gantiOk.style.display  = 'block';
            gantiErr.style.display = 'none';
            setTimeout(() => { _tutupGantiPw(); logout(); }, 2200);
          } else {
            showErr(res.pesan);
          }
        })
        .catch(err => showErr('Gagal terhubung ke server. Pastikan XAMPP aktif. (' + err.message + ')'))
        .finally(() => { btnSimpanPw.textContent = 'Simpan Password →'; btnSimpanPw.disabled = false; });
      });
    }
    // ── END GANTI PASSWORD ───────────────────────────────────
  };

  return { init, isLoggedIn, getAdmin, logout };
})();

//    
// NAMESPACE 2 — utils : Helper & Format
//    
const utils = (() => {
  /** @param {number} n */ const rupiah  = n => "Rp " + (n||0).toLocaleString("id-ID");
  /** @param {string} s */ const tanggal = s => s ? new Date(s+"T00:00:00").toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"}) : "-";
  /** @param {string} a @param {string} b */ const hari = (a,b) => { const d=new Date(b+"T00:00:00")-new Date(a+"T00:00:00"); return d>0?Math.ceil(d/86400000):0; };
  const kode     = () => `EVT-${Date.now().toString().slice(-6)}-${~~(Math.random()*900+100)}`;
  const notEmpty = v  => String(v??"").trim() !== "";
  const validHp  = t  => /^(08|628|\+628)\d{8,12}$/.test(t.replace(/\s/g,""));
  const status   = (tglKembali, st) => {
    if (st === 'selesai')   return "selesai";
    if (st === 'terlambat') return "terlambat";
    const h = new Date(); h.setHours(0,0,0,0);
    return new Date(tglKembali+"T00:00:00") < h ? "terlambat" : "aktif";
  };
  return { rupiah, tanggal, hari, kode, notEmpty, validHp, status };
})();

//    
// NAMESPACE 3 — api : HTTP Request ke PHP Backend
//    
const api = (() => {
  const BASE = 'api';

  /**
   * Fetch wrapper — Promise + .then/.catch
   * @param {string} url @param {object} opts
   * @returns {Promise}
   */
  const req = (url, opts={}) =>
    fetch(url, opts)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(e => { throw new Error('Koneksi gagal: ' + e.message); });

  const getProduk   = (kat='semua') => req(`${BASE}/produk.php${kat!=='semua'?`?kat=${kat}`:''}`);;
  const getPesanan  = (params={})   => req(`${BASE}/pesanan.php?${new URLSearchParams(params)}`);
  const postPesanan = (body)        => req(`${BASE}/pesanan.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const putStatus   = (kode,status) => req(`${BASE}/pesanan.php`, { method:'PUT',  headers:{'Content-Type':'application/json'}, body:JSON.stringify({kode,status}) });
  const delPesanan  = (kode)        => req(`${BASE}/pesanan.php?kode=${kode}`, { method:'DELETE' });
  const postProduk  = (body)        => req(`${BASE}/produk.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const putProduk   = (body)        => req(`${BASE}/produk.php`, { method:'PUT',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const delProduk   = (id)          => req(`${BASE}/produk.php?id=${id}`, { method:'DELETE' });

  return { getProduk, getPesanan, postPesanan, putStatus, delPesanan, postProduk, putProduk, delProduk };
})();

//    
// NAMESPACE 4 — model : Class OOP
//    
const model = (() => {

  /** Abstract base class */
  class ItemRental {
    constructor(id, nama, kat, desk, harga, stok, ico, tipe) {
      if (new.target === ItemRental) throw new Error("Abstract class.");
      /** @type {number} */ this.id    = id;
      /** @type {string} */ this.nama  = nama;
      /** @type {string} */ this.kat   = kat;
      /** @type {string} */ this.desk  = desk;
      /** @type {number} */ this.harga = harga;
      /** @type {number} */ this.stok  = stok;
      /** @type {string} */ this.ico   = ico;
      /** @type {string} */ this.tipe  = tipe;
    }
    getLabel()       { throw new Error("Harus diimplementasi subclass."); }
    total(jml, hari) { return this.harga * jml * hari; }
    stokInfo() {
      if (this.stok <= 0) return { txt:"Habis",                  cls:"no"  };
      if (this.stok <= 3) return { txt:`Terbatas(${this.stok})`, cls:"low" };
      return                     { txt:`Tersedia(${this.stok})`,  cls:"ok"  };
    }
  }

  /** Subclass BarangFisik */
  class BarangFisik extends ItemRental {
    constructor(d) {
      super(d.id, d.nama, d.kategori, d.deskripsi, d.harga_hari, d.stok, d.ico, 'fisik');
      this.kg = d.berat_kg;
    }
    getLabel() { return `[FISIK] ${this.nama} (~${this.kg}kg)`; }
    // Overloading simulasi: total dengan biaya angkut opsional
    totalDenganAngkut(jml, hari, angkut=0) { return this.total(jml, hari) + angkut; }
  }

  /** Subclass BarangElektronik */
  class BarangElektronik extends ItemRental {
    constructor(d) {
      super(d.id, d.nama, d.kategori, d.deskripsi, d.harga_hari, d.stok, d.ico, 'elektronik');
      this.watt = d.daya_watt;
    }
    getLabel() { return `[ELEKTRONIK] ${this.nama} (${this.watt}W)`; }
    // Polymorphism: override total + biaya listrik
    total(jml, hari) { return super.total(jml, hari) + 5000 * jml * hari; }
  }

  /** Factory — buat objek dari data API */
  const buatItem = d => d.tipe === 'elektronik' ? new BarangElektronik(d) : new BarangFisik(d);

  /** Class Keranjang dengan private field */
  class Keranjang {
    #items = [];
    tambah(item)  { this.#items.push(item); }
    hapus(i)      { this.#items.splice(i, 1); }
    kosongkan()   { this.#items = []; }
    get items()   { return this.#items; }
    get jumlah()  { return this.#items.length; }
    get grand()   {
      let total = 0;
      for (let i = 0; i < this.#items.length; i++) total += this.#items[i].subtotal; // for klasik
      return total;
    }
  }

  return { BarangFisik, BarangElektronik, buatItem, Keranjang };
})();

//    
// NAMESPACE 5 — data : State & Cache Produk
//    
const data = (() => {
  let cache = []; // Array

  /** Muat dari API, simpan ke cache — Promise .then */
  const muat = (kat='semua') =>
    api.getProduk(kat).then(res => {
      cache = res.data.map(d => model.buatItem(d)); // map
      cache.forEach(p => console.log(p.getLabel())); // forEach + polymorphism
      return cache;
    });

  /** Cari by ID — do...while */
  const cariId = id => {
    let i = 0, hasil = null;
    do { if (cache[i]?.id === id) { hasil = cache[i]; break; } i++; } while (i < cache.length);
    return hasil;
  };

  /** Filter kategori — for...in */
  const filterKat = kat => {
    if (kat === 'semua') return cache;
    const katMap = { tenda:1, kursi:1, audio:1, dekorasi:1, pencahayaan:1, catering:1 };
    let valid = false;
    for (const k in katMap) { if (k === kat) { valid = true; break; } }
    return valid ? cache.filter(p => p.kat === kat) : cache;
  };

  const semua = () => cache;
  return { muat, cariId, filterKat, semua };
})();

//    
// NAMESPACE 6 — ui : Render Antarmuka
//    
const ui = (() => {
  const $ = id => document.getElementById(id);

  const loading = (el, pesan='Memuat...') => { if(el) el.innerHTML = `<p class="empty">⏳ ${pesan}</p>`; };

  const katalog = items => {
    const g = $("katalogGrid"); g.innerHTML = "";
    for (const p of items) { // for...of
      const s = p.stokInfo();
      const d = document.createElement("div"); d.className = "k-card";
      // Data produk di-encode JSON untuk tombol edit
      const pJson = JSON.stringify({
        id: p.id, nama: p.nama, kategori: p.kat, deskripsi: p.desk,
        harga_hari: p.harga, stok: p.stok, tipe: p.tipe,
        berat_kg: p.kg ?? null, daya_watt: p.watt ?? null, ico: p.ico
      }).replace(/'/g, '&#39;');
      d.innerHTML = `
        <div class="k-img">${p.ico}<span class="k-badge ${s.cls}">${s.txt}</span></div>
        <div class="k-body">
          <div class="k-cat">${p.kat.toUpperCase()}</div>
          <div class="k-name">${p.nama}</div>
          <div class="k-desc">${p.desk}</div>
          <div class="k-foot">
            <div class="k-price">${utils.rupiah(p.harga)}<span>/hari</span></div>
            <div class="k-acts">
              <button class="btn-sm btn-book" onclick="app.pilih(${p.id})">Pilih</button>
              <button class="btn-sm btn-edit" onclick='kelola.bukaEdit(${pJson})' title="Edit Barang">✏️</button>
              <button class="btn-sm btn-del"  onclick="kelola.hapus(${p.id},'${p.nama.replace(/'/g,"\\'")}')" title="Hapus Barang">🗑</button>
            </div>
          </div>
        </div>`;
      g.appendChild(d);
    }
    if (!items.length) g.innerHTML = `<p class="empty">Tidak ada barang.</p>`;
  };

  const keranjang = k => {
    const list = $("keranjangList"), sum = $("keranjangSummary");
    if (k.jumlah === 0) { // if/else
      list.innerHTML = `<p class="empty">Belum ada barang</p>`;
      sum.style.display = "none"; return;
    }
    list.innerHTML = ""; sum.style.display = "block";
    k.items.forEach((it, i) => { // forEach
      const d = document.createElement("div"); d.className = "k-item";
      d.innerHTML = `
        <button class="k-item-rm" onclick="app.hapusKeranjang(${i})">✕</button>
        <div class="k-item-name">${it.ico} ${it.nama}</div>
        <div class="k-item-det">${it.jml} unit × ${utils.rupiah(it.harga)}/hari × ${it.hari} hari</div>
        <div class="k-item-price">${utils.rupiah(it.subtotal)}</div>`;
      list.appendChild(d);
    });
    $("kItem").textContent  = k.jumlah + " item";
    $("kTotal").textContent = utils.rupiah(k.grand);
  };

  const pesanan = list => {
    const c = $("pesananList"); c.innerHTML = "";
    if (!list.length) { c.innerHTML = `<p class="empty">Tidak ada pesanan.</p>`; return; }
    for (const p of list) { // for...of
      const st = utils.status(p.tgl_kembali, p.status);
      const hr = utils.hari(p.tgl_mulai, p.tgl_kembali);
      let rows = "";
      p.items.forEach(it => { rows += `<div><span>${it.ico} ${it.nama} (${it.jumlah}×${hr}hr)</span><span>${utils.rupiah(it.subtotal)}</span></div>`; });
      const d = document.createElement("div"); d.className = `p-card ${st}`;
      d.innerHTML = `
        <div class="p-head">
          <div><div class="p-kode">${p.kode}</div><div class="p-nama">${p.nama_penyewa}</div></div>
          <span class="st ${st}">${st.toUpperCase()}</span>
        </div>
        <div class="p-info">
          <div class="p-info-item"><div class="p-info-lbl">📅 Booking</div><div class="p-info-val">${utils.tanggal(p.tgl_mulai)}</div></div>
          <div class="p-info-item"><div class="p-info-lbl">📦 Kembali</div><div class="p-info-val">${utils.tanggal(p.tgl_kembali)}</div></div>
          <div class="p-info-item"><div class="p-info-lbl">⏱ Durasi</div><div class="p-info-val">${hr} Hari</div></div>
          <div class="p-info-item"><div class="p-info-lbl">🎉 Event</div><div class="p-info-val">${p.nama_event||"-"}</div></div>
        </div>
        <div class="p-items">${rows}</div>
        <div class="p-foot">
          <div class="p-grand">${utils.rupiah(p.grand_total)}</div>
          <div class="p-actions">
            <button class="btn-sm btn-inf" onclick="app.detail('${p.kode}')">👁 Detail</button>
            ${st!=="selesai"?`<button class="btn-sm btn-book" onclick="app.selesai('${p.kode}')">✓ Selesai</button>`:""}
            <button class="btn-sm btn-del" onclick="app.hapus('${p.kode}')">🗑</button>
          </div>
        </div>`;
      c.appendChild(d);
    }
  };

  const populateSelect = items => {
    const sel = $("fBarang");
    sel.innerHTML = '<option value="">-- Pilih Barang --</option>';
    items.forEach(p => { // forEach
      const o = document.createElement("option");
      o.value = p.id; o.textContent = `${p.ico} ${p.nama} — ${utils.rupiah(p.harga)}/hari`;
      sel.appendChild(o);
    });
  };

  const toast = (msg, tipe="info") => {
    const w = $("toastWrap"), el = document.createElement("div");
    el.className = `toast ${tipe==="success"?"ok":tipe==="error"?"err":""}`;
    const ico = tipe==="success"?"✅":tipe==="error"?"❌":"ℹ️";
    el.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
    w.appendChild(el);
    setTimeout(() => { el.style.animation="slideOut .3s ease forwards"; setTimeout(()=>el.remove(),300); }, 3500);
  };

  const bukaModal  = html => { $("modalContent").innerHTML = html; $("modalOverlay").classList.add("open"); };
  const tutupModal = ()   => $("modalOverlay").classList.remove("open");

  return { loading, katalog, keranjang, pesanan, populateSelect, toast, bukaModal, tutupModal };
})();

//    
// NAMESPACE 7 — kelola : Tambah / Edit / Hapus Barang
//    
const kelola = (() => {
  const IKON = ['⛺','🏕','🪑','🛋','🛏','🚿','🔊','🎤','📺','📽','💡','🔦','⚡','🌸','💐','🌺','🎀','🍽','🥘','🎪','🎭','🎨','🎬','🏆','📦','🎁'];

  /** Buat HTML form tambah / edit */
  const _formHTML = (p = null) => {
    const isEdit = !!p;
    const v      = (k, def='') => isEdit ? (p[k] ?? def) : def;
    const ikoGrid = IKON.map(ico =>
      `<button type="button" class="ico-btn${v('ico','📦')===ico?' sel':''}" data-ico="${ico}" onclick="kelola.pilihIco(this)">${ico}</button>`
    ).join('');

    return `
      <h2 class="modal-title">${isEdit ? '✏️ Edit Barang' : '➕ Tambah Barang Baru'}</h2>
      <input type="hidden" id="pId" value="${v('id','')}"/>

      <div class="pf-2col">
        <div class="fg">
          <label>Nama Barang *</label>
          <input type="text" id="pNama" placeholder="contoh: Tenda VIP 5x10m" value="${v('nama')}"/>
        </div>
        <div class="fg">
          <label>Kategori *</label>
          <select id="pKat">
            ${['tenda','kursi','audio','dekorasi','pencahayaan','catering'].map(k =>
              `<option value="${k}"${v('kategori')===k?' selected':''}>${k.charAt(0).toUpperCase()+k.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div class="fg">
        <label>Deskripsi</label>
        <input type="text" id="pDesk" placeholder="Keterangan singkat produk" value="${v('deskripsi')}"/>
      </div>

      <div class="pf-2col">
        <div class="fg">
          <label>Harga / Hari (Rp) *</label>
          <input type="number" id="pHarga" min="1" placeholder="150000" value="${v('harga_hari')}"/>
        </div>
        <div class="fg">
          <label>Stok Unit *</label>
          <input type="number" id="pStok" min="0" placeholder="10" value="${v('stok')}"/>
        </div>
      </div>

      <div class="fg">
        <label>Tipe Barang *</label>
        <div class="tipe-row">
          <button type="button" class="tipe-btn${v('tipe','fisik')!=='elektronik'?' active':''}" data-tipe="fisik" onclick="kelola.pilihTipe(this)">🏗 Fisik</button>
          <button type="button" class="tipe-btn${v('tipe','fisik')==='elektronik'?' active':''}" data-tipe="elektronik" onclick="kelola.pilihTipe(this)">⚡ Elektronik</button>
        </div>
      </div>

      <div id="pfFisik" style="display:${v('tipe','fisik')!=='elektronik'?'block':'none'}">
        <div class="fg">
          <label>Berat (kg)</label>
          <input type="number" id="pBerat" min="0" step="0.1" placeholder="5.5" value="${v('berat_kg')}"/>
        </div>
      </div>
      <div id="pfElektronik" style="display:${v('tipe','fisik')==='elektronik'?'block':'none'}">
        <div class="fg">
          <label>Daya (Watt)</label>
          <input type="number" id="pDaya" min="0" placeholder="500" value="${v('daya_watt')}"/>
        </div>
      </div>

      <div class="fg">
        <label>Pilih Ikon</label>
        <input type="hidden" id="pIco" value="${v('ico','📦')}"/>
        <div class="ico-grid">${ikoGrid}</div>
      </div>

      <button class="btn full" style="margin-top:10px" onclick="kelola.simpan()">
        ${isEdit ? '💾 Simpan Perubahan' : '✅ Tambahkan Barang'}
      </button>`;
  };

  /** Pilih ikon dari grid */
  const pilihIco = el => {
    document.querySelectorAll('.ico-btn').forEach(b => b.classList.remove('sel'));
    el.classList.add('sel');
    document.getElementById('pIco').value = el.dataset.ico;
  };

  /** Toggle fisik / elektronik */
  const pilihTipe = el => {
    document.querySelectorAll('.tipe-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    const isFisik = el.dataset.tipe === 'fisik';
    document.getElementById('pfFisik').style.display      = isFisik ? 'block' : 'none';
    document.getElementById('pfElektronik').style.display = isFisik ? 'none'  : 'block';
  };

  /** Kumpulkan nilai dari form */
  const _getData = () => {
    const $    = id => document.getElementById(id);
    const tipe = document.querySelector('.tipe-btn.active')?.dataset.tipe || 'fisik';
    return {
      id:         parseInt($('pId').value)    || null,
      nama:       $('pNama').value.trim(),
      kategori:   $('pKat').value,
      deskripsi:  $('pDesk').value.trim(),
      harga_hari: parseInt($('pHarga').value) || 0,
      stok:       parseInt($('pStok').value)  || 0,
      tipe,
      berat_kg:   tipe === 'fisik'       ? ($('pBerat').value || '') : '',
      daya_watt:  tipe === 'elektronik'  ? ($('pDaya').value  || '') : '',
      ico:        $('pIco').value || '📦',
    };
  };

  /** Simpan — tambah atau edit */
  const simpan = () => {
    const d = _getData();
    if (!d.nama)           { ui.toast('Nama barang wajib diisi!',   'error'); return; }
    if (d.harga_hari <= 0) { ui.toast('Harga/hari wajib diisi!',    'error'); return; }
    if (d.stok < 0)        { ui.toast('Stok tidak boleh negatif!',  'error'); return; }

    const btn = document.querySelector('#modalContent .btn.full');
    if (btn) { btn.textContent = '⏳ Menyimpan...'; btn.disabled = true; }

    const proses = d.id ? api.putProduk(d) : api.postProduk(d);
    proses
      .then(res => {
        if (!res.sukses) throw new Error(res.pesan);
        ui.toast(res.pesan, 'success');
        ui.tutupModal();
        data.muat().then(items => { ui.katalog(items); ui.populateSelect(items); });
      })
      .catch(e => ui.toast('❌ ' + e.message, 'error'))
      .finally(() => { if (btn) { btn.disabled = false; } });
  };

  /** Buka modal form tambah */
  const bukaTambah = () => ui.bukaModal(_formHTML());

  /** Buka modal form edit */
  const bukaEdit = produk => ui.bukaModal(_formHTML(produk));

  /** Hapus (nonaktifkan) produk */
  const hapus = (id, nama) => {
    if (!confirm(`Hapus barang "${nama}"?\nBarang tidak akan muncul di katalog.`)) return;
    api.delProduk(id)
      .then(res => {
        ui.toast(res.pesan, res.sukses ? 'success' : 'error');
        if (res.sukses) data.muat().then(items => { ui.katalog(items); ui.populateSelect(items); });
      })
      .catch(e => ui.toast('❌ ' + e.message, 'error'));
  };

  return { bukaTambah, bukaEdit, hapus, simpan, pilihIco, pilihTipe };
})();

//    
// NAMESPACE 8 — report : Laporan Detail Pesanan
//    
const report = (() => {
  const detail = p => {
    const hr = utils.hari(p.tgl_mulai, p.tgl_kembali), st = utils.status(p.tgl_kembali, p.status);
    let rows = "";
    for (const it of p.items) { // for...of
      rows += `<tr><td>${it.ico} ${it.nama}</td><td>${it.jumlah}</td><td>${utils.rupiah(it.harga_hari)}</td><td>${hr}</td><td>${utils.rupiah(it.subtotal)}</td></tr>`;
    }
    return `
      <h2 class="modal-title">📋 Detail Pesanan</h2>
      <div class="m-grid">
        <div><div class="m-lbl">Kode</div><div class="m-val"><b>${p.kode}</b></div></div>
        <div><div class="m-lbl">Status</div><div class="m-val"><span class="st ${st}">${st.toUpperCase()}</span></div></div>
        <div><div class="m-lbl">Nama</div><div class="m-val">${p.nama_penyewa}</div></div>
        <div><div class="m-lbl">Telepon</div><div class="m-val">${p.no_telp}</div></div>
        <div><div class="m-lbl">📅 Booking</div><div class="m-val">${utils.tanggal(p.tgl_mulai)}</div></div>
        <div><div class="m-lbl">📦 Kembali</div><div class="m-val">${utils.tanggal(p.tgl_kembali)}</div></div>
        <div><div class="m-lbl">⏱ Durasi</div><div class="m-val"><b>${hr} Hari</b></div></div>
        <div><div class="m-lbl">🎉 Event</div><div class="m-val">${p.nama_event||"-"}</div></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:.84rem;margin-top:12px">
        <tr style="background:#f0ebe2"><th style="padding:7px;text-align:left">Barang</th><th>Qty</th><th>Harga/hari</th><th>Hari</th><th>Subtotal</th></tr>
        ${rows}
      </table>
      <div class="m-total"><span>GRAND TOTAL</span><span>${utils.rupiah(p.grand_total)}</span></div>`;
  };
  return { detail };
})();

//    
// NAMESPACE 9 — app : Controller Utama
//    
const app = (() => {
  const $  = id => document.getElementById(id);
  let keranjang = new model.Keranjang();
  let cariQ = "", filterSt = "semua";
  let allPesanan = [];

  /** Inisialisasi — muat data dari API */
  const init = () => {
    _events();
    _renderFilter();

    // Muat produk dari database — Promise .then .catch
    ui.loading($("katalogGrid"), "Memuat produk dari database...");
    data.muat()
      .then(items => {
        ui.katalog(items);
        ui.populateSelect(items);
      })
      .catch(e => {
        $("katalogGrid").innerHTML = `<p class="empty">❌ Gagal memuat produk: ${e.message}</p>`;
        ui.toast("Pastikan XAMPP & database sudah aktif!", "error");
      });

    _muatPesanan();
  };

  /** Muat ulang pesanan dari API */
  const _muatPesanan = () => {
    ui.loading($("pesananList"), "Memuat pesanan...");
    let params = {};
    // switch untuk filter status
    switch (filterSt) {
      case "aktif":     params.status = "aktif";     break;
      case "selesai":   params.status = "selesai";   break;
      case "terlambat": params.status = "terlambat"; break;
      default: break;
    }
    if (cariQ) params.cari = cariQ;

    api.getPesanan(params)
      .then(res => { allPesanan = res.data; ui.pesanan(allPesanan); })
      .catch(e  => ui.toast("Gagal memuat pesanan: " + e.message, "error"));
  };

  /** Render tombol filter kategori */
  const _renderFilter = () => {
    const bar  = $("filterBar");
    const cats = ["semua","tenda","kursi","audio","dekorasi","pencahayaan","catering"];
    const ico  = { semua:"🔍", tenda:"⛺", kursi:"🪑", audio:"🔊", dekorasi:"🌸", pencahayaan:"💡", catering:"🍽" };
    cats.forEach(c => { // forEach
      const b = document.createElement("button");
      b.className = "filter-btn" + (c==="semua"?" active":"");
      b.textContent = `${ico[c]} ${c.charAt(0).toUpperCase()+c.slice(1)}`;
      b.onclick = () => {
        document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        let items = data.filterKat(c);
        let i = 0;
        while (i < items.length) { i++; } // while — iterasi hitung item
        ui.katalog(items);
      };
      bar.appendChild(b);
    });
  };

  /** Preview harga & durasi sewa */
  const _preview = () => {
    const m=$("fMulai").value, k=$("fKembali").value, id=parseInt($("fBarang").value), jml=parseInt($("fJml").value)||1;
    if (m && k) {
      const hr = utils.hari(m, k);
      if (hr <= 0) { $("infoDurasi").style.display=$("infoHarga").style.display="none"; return; }
      $("infoDurasi").style.display  = "block";
      $("iMulai").textContent   = utils.tanggal(m);
      $("iKembali").textContent = utils.tanggal(k);
      $("iHari").textContent    = hr + " Hari";
      if (id) {
        const brg = data.cariId(id);
        if (brg) {
          $("infoHarga").style.display = "block";
          $("hSatuan").textContent = utils.rupiah(brg.harga);
          $("hJml").textContent    = jml + " unit";
          $("hHari").textContent   = hr  + " hari";
          $("hTotal").textContent  = utils.rupiah(brg.total(jml, hr));
        }
      } else { $("infoHarga").style.display = "none"; }
    } else { $("infoDurasi").style.display=$("infoHarga").style.display="none"; }
  };

  /** Bind semua event listener */
  const _events = () => {
    ["fMulai","fKembali","fBarang","fJml"].forEach(id => $(id).addEventListener("change", _preview));
    $("fJml").addEventListener("input", _preview);
    $("btnTambah").addEventListener("click", tambah);
    $("btnBuat").addEventListener("click", buat);
    $("btnKosong").addEventListener("click", () => { if(confirm("Kosongkan keranjang?")){ keranjang.kosongkan(); ui.keranjang(keranjang); } });
    $("cariPesanan").addEventListener("input", e => { cariQ = e.target.value; _muatPesanan(); });
    $("filterStatus").addEventListener("change", e => { filterSt = e.target.value; _muatPesanan(); });
    $("modalClose").addEventListener("click", ui.tutupModal);
    $("modalOverlay").addEventListener("click", e => { if(e.target===$("modalOverlay")) ui.tutupModal(); });
    $("btnTambahBarang").addEventListener("click", kelola.bukaTambah);
  };

  /** Tambah barang ke keranjang */
  const tambah = () => {
    const m=$("fMulai").value, k=$("fKembali").value, id=parseInt($("fBarang").value), jml=parseInt($("fJml").value)||1;
    if (!m)       { ui.toast("Tanggal mulai wajib diisi!","error"); return; }
    else if (!k)  { ui.toast("Tanggal kembali wajib diisi!","error"); return; }
    else if (!id) { ui.toast("Pilih barang!","error"); return; }
    const hr = utils.hari(m, k);
    if (hr <= 0)          { ui.toast("Tanggal tidak valid!","error"); return; }
    const brg = data.cariId(id);
    if (!brg)             { ui.toast("Barang tidak ditemukan!","error"); return; }
    if (brg.stok <= 0)    { ui.toast("Stok habis!","error"); return; }
    if (jml > brg.stok)   { ui.toast(`Stok hanya ${brg.stok} unit!`,"error"); return; }
    keranjang.tambah({ id:brg.id, nama:brg.nama, ico:brg.ico, harga:brg.harga, jml, hari:hr, subtotal:brg.total(jml,hr) });
    ui.keranjang(keranjang);
    ui.toast(`${brg.nama} ditambahkan ✅`,"success");
    $("fBarang").value=""; $("fJml").value=1; $("infoHarga").style.display="none";
  };

  /** Buat pesanan — kirim ke API PHP dengan Promise chain */
  const buat = () => {
    const nama=$("fNama").value.trim(), telp=$("fTelp").value.trim(), event=$("fEvent").value.trim(), m=$("fMulai").value, k=$("fKembali").value;
    if (!utils.notEmpty(nama))  { ui.toast("Nama wajib diisi!","error"); return; }
    if (!utils.validHp(telp))   { ui.toast("No. HP tidak valid!","error"); return; }
    if (!m || !k)               { ui.toast("Tanggal wajib diisi!","error"); return; }
    if (keranjang.jumlah === 0) { ui.toast("Keranjang kosong!","error"); return; }

    const btn = $("btnBuat"); btn.textContent="⏳ Menyimpan ke database..."; btn.disabled=true;

    // ── PROMISE + .then() + .then() + .catch() + .finally() ──
    api.postPesanan({ nama_penyewa:nama, no_telp:telp, nama_event:event, tgl_mulai:m, tgl_kembali:k, items:keranjang.items })
      .then(res => {
        if (!res.sukses) throw new Error(res.pesan);
        return res;
      })
      .then(res => {
        keranjang.kosongkan(); ui.keranjang(keranjang);
        ["fNama","fTelp","fEvent","fMulai","fKembali"].forEach(id => $(id).value="");
        $("infoDurasi").style.display=$("infoHarga").style.display="none";
        ui.toast(`✅ ${res.pesan} Kode: ${res.kode} | Total: ${utils.rupiah(res.grand_total)}`,"success");
        _muatPesanan();
        setTimeout(()=>$("pesanan").scrollIntoView({behavior:"smooth"}), 600);
      })
      .catch(e => ui.toast("❌ "+e.message,"error"))
      .finally(() => { btn.textContent="✔ Buat Pesanan"; btn.disabled=false; });
  };

  const pilih = id => { $("fBarang").value=id; $("booking").scrollIntoView({behavior:"smooth"}); _preview(); ui.toast("Barang dipilih!","info"); };

  const hapusKeranjang = i => { keranjang.hapus(i); ui.keranjang(keranjang); };

  const detail = kode => {
    let target = null;
    for (const p of allPesanan) { if (p.kode===kode) { target=p; break; } } // for...of
    if (!target) { ui.toast("Pesanan tidak ditemukan!","error"); return; }
    ui.bukaModal(report.detail(target));
  };

  /** Tandai selesai — PUT */
  const selesai = kode => {
    if (!confirm("Tandai pesanan ini SELESAI?")) return;
    api.putStatus(kode, 'selesai')
      .then(res => { ui.toast(res.pesan, res.sukses?"success":"error"); if(res.sukses) _muatPesanan(); })
      .catch(e  => ui.toast("❌ "+e.message,"error"));
  };

  /** Hapus pesanan — DELETE */
  const hapus = kode => {
    if (!confirm(`Hapus pesanan ${kode}?`)) return;
    api.delPesanan(kode)
      .then(res => { ui.toast(res.pesan, res.sukses?"success":"error"); if(res.sukses) _muatPesanan(); })
      .catch(e  => ui.toast("❌ "+e.message,"error"));
  };

  return { init, pilih, hapusKeranjang, detail, selesai, hapus };
})();

// ── ENTRY POINT ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  auth.init(); // ① tampilkan login overlay / skip jika sudah login
  app.init();  // ② load katalog + pesanan dari database
});
