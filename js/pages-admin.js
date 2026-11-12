/* Halaman Admin: dashboard sistem, pengguna, pengaturan aplikasi, aturan XP,
   import data anggota, log aktivitas. */
(function () {
  'use strict';
  const { esc, attr, fmt, toast, L } = UI;
  const S = API.Session;
  const R = Pages.route, AD = ['admin'];
  R('/a/home', 'aHome', AD); R('/a/users', 'aUsers', AD); R('/a/settings', 'aSettings', AD);
  R('/a/rules', 'aRules', AD); R('/a/import', 'aImport', AD); R('/a/audit', 'aAudit', AD);
  const fail = (v, e) => { v.innerHTML = UI.errBox(e.message, true); const b = v.querySelector('[data-retry]'); if (b) b.onclick = () => App.route(); };
  const head = (t, sub, tools) => `<div class="view-h"><div><h2 class="h1">${esc(t)}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="row">${tools || ''}</div></div>`;

  /* ============================== DASHBOARD ADMIN ============================== */
  Pages.aHome = async function (v, p, ctx) {
    App.setTitle('Dashboard Admin', [['Administrasi']]);
    API.warm('admin');
    v.innerHTML = `<div class="grid g-4">${UI.skel(4, 110)}</div>${UI.skel(1, 260)}`;
    try {
      await API.swr('a.dashboard', {}, d => {
        if (!ctx.alive()) return;
        const c = d.counts, sys = d.system;
        v.innerHTML = `${head('Administrasi sistem', 'Akun, keamanan, dan konfigurasi English Club Hub.', `<button class="btn btn-outline" id="flush">${ic('refresh', 'i-sm')} Segarkan data</button><a class="btn" href="#/a/users?new">${ic('userplus', 'i-sm')} Buat akun</a>`)}
          <div class="grid g-4 kpis">
            ${UI.metric({ icon: 'users', tone: 'ic-blue', label: 'Total akun', value: c.total, sub: `${c.active} aktif · ${c.inactive} nonaktif` })}
            ${UI.metric({ icon: 'cap', tone: 'ic-purple', label: 'Siswa', value: c.student })}
            ${UI.metric({ icon: 'shield', tone: 'ic-gold', label: 'Pembina & Admin', value: c.mentor + c.admin, sub: `${c.mentor} pembina · ${c.admin} admin` })}
            ${UI.metric({ icon: 'login', tone: 'ic-green', label: 'Masuk 7 hari terakhir', value: c.login7, sub: c.neverLogin ? `${c.neverLogin} akun belum pernah masuk` : 'Semua akun pernah masuk' })}
          </div>
          <div class="grid g-3">
            <div class="card"><h3 class="h3" style="margin-bottom:12px">Akun per peran</h3>${UI.chart.donut([{ l: 'Siswa', v: c.student, c: 'var(--primary)' }, { l: 'Pembina', v: c.mentor, c: 'var(--purple)' }, { l: 'Admin', v: c.admin, c: 'var(--gold)' }], { sub: 'akun' })}</div>
            <div class="card"><h3 class="h3" style="margin-bottom:12px">Status akun</h3>${UI.chart.donut([{ l: 'Aktif', v: c.active, c: 'var(--success)' }, { l: 'Nonaktif', v: c.inactive, c: '#CBD5E1' }], { center: c.total ? Math.round(c.active / c.total * 100) + '%' : '0%', sub: 'aktif' })}</div>
            <div class="card"><h3 class="h3" style="margin-bottom:4px">Siswa aktif 7 hari</h3><p class="xs muted">Jumlah siswa yang mendapat XP per hari</p>${UI.chart.bars(d.series.map(s => ({ v: s.active, l: fmt.ymdDay(s.d) })), { h: 170 })}</div>
          </div>
          <div class="split"><div class="card pad-0"><div class="card-h" style="padding:18px 18px 0"><h3 class="h3">${ic('activity')} Aktivitas terbaru</h3><a class="small" href="#/a/audit">Semua log</a></div>
            <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Objek</th></tr></thead><tbody>${d.audit.map(a => `<tr><td class="small muted nowrap">${fmt.dt(a.at)}</td><td class="small">${esc(a.actor)} <span class="xs muted">${esc(L.role[a.role] || a.role)}</span></td><td><span class="chip ${/GAGAL|HAPUS/.test(a.action) ? 'chip-red' : 'chip-blue'}">${esc(a.action)}</span></td><td class="small">${esc(a.entity)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted small">Belum ada aktivitas.</td></tr>'}</tbody></table></div></div>
            <div class="stack"><div class="card stack-sm"><h3 class="h3">${ic('database')} Sistem</h3><dl class="kv"><dt>Versi backend</dt><dd>${esc(sys.version)}</dd><dt>Pemanasan server</dt><dd>${sys.keepWarm === 'off' ? 'Mati' : 'Aktif (tiap 5 menit)'}</dd><dt>Pemanasan terakhir</dt><dd>${sys.warm ? fmt.ago(sys.warm.at) : '-'}</dd></dl>
              <a class="btn btn-outline btn-sm" href="${attr(sys.spreadsheetUrl)}" target="_blank" rel="noopener">${ic('external', 'i-sm')} Buka spreadsheet database</a><a class="btn btn-outline btn-sm" href="${attr(sys.driveUrl)}" target="_blank" rel="noopener">${ic('external', 'i-sm')} Buka folder Google Drive</a>
              <p class="xs muted">Jangan bagikan spreadsheet database. Kata sandi tidak disimpan di sana.</p></div>
              <div class="card stack-sm"><h3 class="h3">Pintasan</h3><a class="btn btn-ghost" href="#/a/settings" style="justify-content:flex-start">${ic('palette', 'i-sm')} Identitas & tema aplikasi</a><a class="btn btn-ghost" href="#/a/import" style="justify-content:flex-start">${ic('database', 'i-sm')} Import data anggota</a><a class="btn btn-ghost" href="#/m/reports" style="justify-content:flex-start">${ic('printer', 'i-sm')} Laporan</a></div></div></div>`;
        v.querySelector('#flush').onclick = e => UI.busy(e.currentTarget, async () => { const r = await API.act('a.cache.flush', {}); API.SWR.clear(); toast(r.message); App.route(); });
      }, 30000);
    } catch (e) { fail(v, e); }
  };

  /* ============================== PENGGUNA ============================== */
  Pages.aUsers = async function (v, p, ctx) {
    App.setTitle('Pengguna', [['Administrasi']]);
    v.innerHTML = UI.skel(1, 400);
    let rows; try { rows = await API.get('a.users', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const reload = async () => { rows = await API.get('a.users', {}); tbl.rows = rows; };
    v.innerHTML = head('Manajemen pengguna', 'Akun dibuat oleh Admin. Siswa masuk dengan username dan kata sandi, tanpa email.', `<a class="btn btn-outline" href="#/a/import">${ic('database', 'i-sm')} Import anggota</a><button class="btn" id="add">${ic('userplus', 'i-sm')} Buat akun</button>`) + '<div id="t"></div>';
    const classes = [...new Set(rows.map(r => r.class).filter(Boolean))].sort();
    const tbl = UI.table(v.querySelector('#t'), { rows, search: ['name', 'username', 'class', 'wa'], placeholder: 'Cari nama, username, kelas, atau nomor WA',
      filters: [{ key: 'role', label: 'Peran', options: [{ v: 'student', l: 'Siswa' }, { v: 'mentor', l: 'Pembina' }, { v: 'admin', l: 'Admin' }] }, { key: 'status', label: 'Status', options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Nonaktif' }] }, { key: 'class', label: 'Kelas', options: classes }],
      columns: [
        { key: 'name', label: 'Nama', render: r => `<div class="person">${UI.avatar(r.name, '', 'av-sm')}<div><div class="nm">${esc(r.name)}</div><div class="sb">@${esc(r.username)}${r.must_change ? ' · <span style="color:var(--warn-ink)">belum ganti sandi</span>' : ''}</div></div></div>` },
        { key: 'role', label: 'Peran', render: r => `<span class="chip ${r.role === 'admin' ? 'chip-gold' : r.role === 'mentor' ? 'chip-purple' : 'chip-blue'}">${esc(L.role[r.role])}</span>` },
        { key: 'class', label: 'Kelas', render: r => esc(r.class || '-') },
        { key: 'wa', label: 'WhatsApp', render: r => r.wa ? `<span class="small">${esc(r.wa)}</span>` : '<span class="faint">-</span>' },
        { key: 'last_login', label: 'Masuk terakhir', render: r => r.last_login ? `<span class="small">${fmt.ago(r.last_login)}</span>` : '<span class="faint small">Belum pernah</span>' },
        { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
        { label: '', sort: false, render: r => `<div class="row-sm end" style="flex-wrap:nowrap"><button class="icon-btn" data-edit="${attr(r.id)}" aria-label="Ubah">${ic('edit', 'i-sm')}</button><button class="icon-btn" data-reset="${attr(r.id)}" aria-label="Reset kata sandi">${ic('key', 'i-sm')}</button>${r.id !== S.me.id ? `<button class="icon-btn" data-del="${attr(r.id)}" aria-label="Hapus">${ic('trash', 'i-sm')}</button>` : ''}</div>` }] });
    v.querySelector('#add').onclick = () => userForm(null, classes, reload);
    if (/\?new/.test(location.hash)) userForm(null, classes, reload);
    v.addEventListener('click', async e => {
      const ed = e.target.closest('[data-edit]'); if (ed) userForm(rows.find(r => r.id === ed.dataset.edit), classes, reload);
      const rs = e.target.closest('[data-reset]'); if (rs) {
        const u = rows.find(r => r.id === rs.dataset.reset);
        if (!(await UI.confirmBox({ title: 'Reset kata sandi?', text: `Kata sandi ${u.name} akan diganti dan semua sesinya berakhir. Pengguna wajib membuat kata sandi baru saat masuk.`, ok: 'Reset' }))) return;
        try { const r = await API.act('a.user.reset', { id: u.id }); credModal([{ name: u.name, username: r.data.username, password: r.data.password, class: u.class, role: u.role }], 'Kata sandi baru'); reload(); } catch (x) { toast(x.message, 'err'); }
      }
      const dl = e.target.closest('[data-del]'); if (dl) {
        const u = rows.find(r => r.id === dl.dataset.del);
        const val = await UI.confirmBox({ title: 'Hapus akun ' + u.name + '?', danger: true, ok: 'Hapus permanen',
          text: 'Akun akan hilang dari daftar. Untuk anggota yang sudah tidak aktif, sebaiknya pilih Nonaktifkan agar riwayat XP dan nilainya tetap terlihat.',
          extra: `<div class="field"><label for="cfu">Ketik <b>${esc(u.username)}</b> untuk konfirmasi</label><input class="input" id="cfu" autocomplete="off"></div>`,
          collect: el => el.querySelector('#cfu').value });
        if (!val) return;
        try { const r = await API.act('a.user.delete', { id: u.id, confirm: val }); toast(r.message); reload(); } catch (x) { toast(x.message, 'err'); }
      }
    });
  };
  function userForm(u, classes, done) {
    u = u || { role: 'student', status: 'active' };
    const md = UI.modal({ title: u.id ? 'Ubah akun' : 'Buat akun', size: 'lg', sticky: true, body: `<form class="form-grid" id="uf">
      ${UI.field({ name: 'name', label: 'Nama lengkap', value: u.name, required: true, max: 80 })}
      <div class="field"><label for="f_username">Username <span class="req">*</span></label><input class="input" id="f_username" name="username" value="${attr(u.username || '')}" autocapitalize="none" spellcheck="false" maxlength="30" required><span class="hint" id="uh">3–30 karakter: huruf kecil, angka, titik, garis bawah, strip.</span></div>
      ${UI.field({ name: 'role', type: 'select', label: 'Peran', options: [{ v: 'student', l: 'Siswa' }, { v: 'mentor', l: 'Pembina' }, { v: 'admin', l: 'Admin' }], value: u.role })}
      ${UI.field({ name: 'status', type: 'select', label: 'Status', options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Nonaktif (tidak bisa masuk)' }], value: u.status })}
      <div class="field" data-st><label for="f_class">Kelas</label><input class="input" id="f_class" name="class" value="${attr(u.class || '')}" list="cls" placeholder="Contoh: XI-A" maxlength="30"><datalist id="cls">${classes.map(c => `<option value="${attr(c)}">`).join('')}</datalist></div>
      <div data-st>${UI.field({ name: 'grade', type: 'select', label: 'Tingkat', options: ['', '10', '11', '12'], value: u.grade || '' })}</div>
      ${UI.field({ name: 'wa', type: 'tel', label: 'Nomor WhatsApp (opsional)', value: u.wa, hint: 'Hanya untuk kontak, tidak dipakai untuk masuk.' })}
      ${u.id ? '' : UI.field({ name: 'password', label: 'Kata sandi awal (opsional)', hint: 'Kosongkan agar dibuat otomatis. Pengguna wajib menggantinya saat masuk pertama.' })}
    </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
    const f = md.el.querySelector('#uf');
    const tg = () => md.el.querySelectorAll('[data-st]').forEach(x => x.hidden = f.querySelector('[name=role]').value !== 'student'); tg();
    f.querySelector('[name=role]').onchange = tg;
    const un = f.querySelector('[name=username]'), nm = f.querySelector('[name=name]');
    if (!u.id) nm.addEventListener('input', () => { if (!un.dataset.touched) un.value = nm.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 24); });
    un.addEventListener('input', () => { un.dataset.touched = '1'; un.value = un.value.toLowerCase().replace(/\s/g, ''); });
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f); if (u.id) d.id = u.id;
      const r = await API.act('a.user.save', d); md.close(); toast(r.message); done();
      if (r.data.password) credModal([{ name: r.data.user.name, username: r.data.user.username, password: r.data.password, class: r.data.user.class, role: r.data.user.role }], 'Akun berhasil dibuat');
    });
  }
  /** Tampilkan kredensial sekali (salin, unduh CSV, atau cetak kartu). */
  function credModal(list, title) {
    const s = App.settings || {};
    const md = UI.modal({ title, size: list.length > 1 ? 'lg' : '', sticky: true, body: `<div class="warn-box">${ic('alert')}<span>Kata sandi ini <b>hanya ditampilkan sekali</b>. Salin, unduh, atau cetak sekarang lalu berikan kepada pengguna secara pribadi.</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Nama</th><th>Username</th><th>Kata sandi awal</th></tr></thead><tbody>${list.map(c => `<tr><td class="small">${esc(c.name)}${c.class ? ` <span class="xs muted">${esc(c.class)}</span>` : ''}</td><td><code>${esc(c.username)}</code></td><td><code style="font-size:15px;letter-spacing:.04em">${esc(c.password)}</code></td></tr>`).join('')}</tbody></table></div>
      <div class="print-only" id="cards">${list.map(c => `<div style="border:1px dashed #999;padding:12px;margin:8px 0;page-break-inside:avoid"><b>${esc(s.app_name)} · ${esc(s.school_name)}</b><br>Nama: ${esc(c.name)}${c.class ? ' (' + esc(c.class) + ')' : ''}<br>Username: <b>${esc(c.username)}</b><br>Kata sandi awal: <b>${esc(c.password)}</b><br><small>Buka aplikasi, masuk, lalu buat kata sandi baru. Jangan bagikan kepada siapa pun.</small></div>`).join('')}</div>`,
      foot: `<button class="btn btn-outline" data-copy>${ic('copy', 'i-sm')} Salin</button><button class="btn btn-outline" data-csv>${ic('download', 'i-sm')} CSV</button><button class="btn btn-outline" data-print>${ic('printer', 'i-sm')} Cetak kartu</button><button class="btn" data-close>Selesai</button>` });
    md.el.querySelector('[data-copy]').onclick = () => UI.copyText(list.map(c => `${c.name}${c.class ? ' (' + c.class + ')' : ''}\nUsername: ${c.username}\nKata sandi: ${c.password}`).join('\n\n'));
    md.el.querySelector('[data-csv]').onclick = () => UI.csvDownload([['Nama', 'Kelas', 'Peran', 'Username', 'Kata sandi awal']].concat(list.map(c => [c.name, c.class, L.role[c.role] || c.role, c.username, c.password])), 'akun-baru.csv');
    md.el.querySelector('[data-print]').onclick = () => {
      const w = window.open('', '_blank', 'width=720,height=900');
      if (!w) return toast('Izinkan pop-up untuk mencetak kartu akun.', 'warn');
      w.document.write(`<!doctype html><meta charset="utf-8"><title>Kartu akun</title><body style="font-family:sans-serif;font-size:14px;padding:16px">${md.el.querySelector('#cards').innerHTML}<script>print()<\/script></body>`);
      w.document.close();
    };
  }
  window.credModal = credModal;

  /* ============================== PENGATURAN APLIKASI ============================== */
  Pages.aSettings = async function (v, p, ctx) {
    App.setTitle('Pengaturan aplikasi', [['Administrasi']]);
    v.innerHTML = UI.skel(1, 500);
    let s; try { s = await API.get('a.settings.get', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    let tab = 'id', draft = Object.assign({}, s);
    let slides = []; try { slides = JSON.parse(s.hero_slides || '[]').filter(x => x && x.u).map(x => ({ u: x.u, c: x.c || '' })); } catch (e) { slides = []; }
    const driveImg = u => { const m = String(u).match(/(?:drive|docs)\.google\.com\/.*?(?:\/d\/|[?&]id=)([\w-]{20,})/); return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600' : u; };
    const advInit = n => String(n || 'Pembina').replace(/,.*$/, '').split(/\s+/).filter(w => /^[A-Za-z]/.test(w) && !/^(ibu|bapak|pak|bu|mr|mrs|ms|miss)\.?$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'P';
    const DEF = { color_primary: '#2F5BFF', color_gamify: '#8B5CF6', color_gold: '#F5B93A', color_navy: '#0A1633', color_bg: '#F6F9FF' };
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const color = (k, label, hint) => `<div class="field"><label for="c_${k}">${esc(label)}</label><div class="color-in"><input type="color" id="cp_${k}" data-cp="${k}" value="${attr(draft[k])}" aria-label="${attr(label)}"><input class="input" id="c_${k}" data-hex="${k}" value="${attr(draft[k])}" maxlength="7" style="width:120px;font-family:ui-monospace,monospace"></div>${hint ? `<span class="hint">${esc(hint)}</span>` : ''}<span class="err" data-cw="${k}" hidden></span></div>`;
    const preview = () => `<div class="card pad-0" style="overflow:hidden;position:sticky;top:calc(var(--top-h) + 16px)"><div style="padding:12px 14px;border-bottom:1px solid var(--border)" class="eyebrow">Pratinjau langsung</div>
      <div style="display:grid;grid-template-columns:110px 1fr;min-height:260px;background:${attr(draft.color_bg)}">
        <div style="background:${attr(draft.color_navy)};padding:12px 8px;display:grid;gap:8px;align-content:start">
          <div class="row-sm" style="flex-wrap:nowrap"><span style="width:26px;height:26px;border-radius:8px;background:${attr(draft.color_primary)};display:grid;place-items:center;overflow:hidden;color:#fff;flex:none">${draft.logo_thumb ? `<img src="${attr(draft.logo_thumb)}" style="width:100%;height:100%;object-fit:cover" alt="">` : ic('cap', 'i-sm')}</span><b style="color:#fff;font-size:10px;line-height:1.2">${esc(draft.app_name)}</b></div>
          <span style="background:${attr(draft.color_primary)};color:#fff;font-size:10px;padding:6px 8px;border-radius:7px">Overview</span><span style="color:#9FB0D6;font-size:10px;padding:0 8px">Challenges</span><span style="color:#9FB0D6;font-size:10px;padding:0 8px">Quiz Arena</span></div>
        <div style="padding:12px;display:grid;gap:10px;align-content:start">
          <div style="background:#fff;border:1px solid #DCE3F0;border-radius:10px;padding:10px;display:grid;gap:6px"><span style="font-size:10px;color:#5B6577">Level 5 → 6</span><div style="height:7px;border-radius:9px;background:#E5E8EE;overflow:hidden"><i style="display:block;width:68%;height:100%;background:linear-gradient(90deg,${attr(draft.color_primary)},${attr(draft.color_gamify)})"></i></div></div>
          <div class="row-sm"><span style="background:${attr(draft.color_primary)};color:#fff;font-size:11px;font-weight:600;padding:7px 10px;border-radius:8px">Mulai</span><span style="background:color-mix(in srgb, ${attr(draft.color_gamify)} 14%, #fff);color:${attr(draft.color_gamify)};font-size:11px;font-weight:700;padding:5px 9px;border-radius:99px">+40 XP</span><span style="background:${attr(draft.color_gold)};width:22px;height:22px;border-radius:50%;display:inline-block"></span></div>
          <div style="width:70px">${Leo.svg('wave')}</div></div></div></div>`;
    const paint = () => {
      const body = {
        id: `<div class="form-grid">
          ${UI.field({ name: 'app_name', label: 'Nama aplikasi', value: draft.app_name, max: 60 })}
          ${UI.field({ name: 'school_name', label: 'Nama sekolah', value: draft.school_name, max: 80 })}
          ${UI.field({ name: 'tagline', label: 'Tagline', value: draft.tagline, max: 80 })}
          ${UI.field({ name: 'philosophy', label: 'Filosofi', value: draft.philosophy, max: 60 })}
          ${UI.field({ name: 'academic_year', label: 'Tahun ajaran', value: draft.academic_year, max: 20 })}
          ${UI.field({ name: 'mascot_enabled', type: 'switch', label: 'Tampilkan maskot Leo untuk semua pengguna', value: draft.mascot_enabled !== 'false' })}
          <div class="field full"><span class="lbl-f">Logo</span><div class="row"><div class="row-sm">${draft.logo ? `<img src="${attr(draft.logo)}" alt="Logo besar" style="width:72px;height:72px;border-radius:16px;border:1px solid var(--border);object-fit:cover"><img src="${attr(draft.logo_thumb)}" alt="Thumbnail" style="width:36px;height:36px;border-radius:10px;border:1px solid var(--border)">` : `<span class="ic sq ic-navy" style="width:72px;height:72px">${ic('cap', 'i-lg')}</span>`}</div>
            <div class="stack-sm"><label class="btn btn-outline btn-sm" style="cursor:pointer">${ic('image', 'i-sm')} Unggah logo<input type="file" accept="image/png,image/jpeg,image/webp" id="lg" hidden></label>${draft.logo ? '<button type="button" class="btn btn-ghost btn-sm" id="lgx">Hapus logo</button>' : ''}<span class="hint">Gambar persegi disarankan. Aplikasi membuat logo 256 px dan thumbnail 64 px otomatis.</span></div></div></div>
          <div class="full"><div class="row between" style="margin:6px 0 10px"><b class="h3">Warna tema</b><button type="button" class="btn btn-ghost btn-sm" id="cdef">${ic('retry', 'i-sm')} Kembalikan warna bawaan</button></div>
            <div class="form-grid">${color('color_primary', 'Warna utama (tombol, progres)', 'Teks putih di atasnya harus tetap terbaca.')}${color('color_gamify', 'Aksen gamifikasi (XP, level)')}${color('color_gold', 'Aksen pencapaian (badge, juara)')}${color('color_navy', 'Navy (sidebar, kartu gelap)')}${color('color_bg', 'Latar halaman')}</div></div></div>`,
        pub: `<div class="set-secs">
          <p class="small muted">Perubahan di tab ini tampil di halaman utama setelah Anda menekan <b>Simpan perubahan</b>. <a href="#/" target="_blank" rel="noopener">Buka halaman utama ${ic('external', 'i-sm')}</a></p>
          <section class="set-sec">
            <div class="set-h"><div class="stack-sm"><h3 class="h3">${ic('image')} Slide foto sampul</h3><p class="small muted">Bergeser otomatis di bawah judul halaman utama. Foto mendatar (16:9) paling pas.</p></div><span class="chip">${slides.length}/12 foto</span></div>
            <div class="warn-box">${ic('shield')}<span>Tampilkan foto anggota hanya bila siswa dan orang tua/wali sudah memberi izin sesuai aturan sekolah. Foto di sini bisa dilihat siapa saja.</span></div>
            ${slides.length ? `<div class="slide-eds">${slides.map((x, i) => `<div class="slide-ed">
              <div class="slide-ed-img"><img src="${attr(x.u)}" alt="Foto ${i + 1}" loading="lazy" referrerpolicy="no-referrer"><span class="slide-ed-n">${i + 1}</span></div>
              <input class="input" data-sc="${i}" value="${attr(x.c)}" maxlength="140" placeholder="Keterangan foto (opsional)" aria-label="Keterangan foto ${i + 1}">
              <div class="row-sm"><button type="button" class="icon-btn" data-sm="${i}" data-dir="-1" aria-label="Pindahkan foto ${i + 1} ke depan" ${i === 0 ? 'disabled' : ''}>${ic('chevl', 'i-sm')}</button><button type="button" class="icon-btn" data-sm="${i}" data-dir="1" aria-label="Pindahkan foto ${i + 1} ke belakang" ${i === slides.length - 1 ? 'disabled' : ''}>${ic('chevr', 'i-sm')}</button><span style="flex:1"></span><button type="button" class="icon-btn" data-sx="${i}" aria-label="Hapus foto ${i + 1}">${ic('trash', 'i-sm')}</button></div>
            </div>`).join('')}</div>` : `<div class="empty slide-empty">${ic('image')}<b>Belum ada foto</b><span class="small">Bagian slide di halaman utama disembunyikan sampai ada foto.</span></div>`}
            <div class="row">${slides.length < 12 ? `<label class="btn btn-outline btn-sm" id="sl-btn" style="cursor:pointer">${ic('upload', 'i-sm')} <span>Unggah foto</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple id="sl-up" hidden></label><button type="button" class="btn btn-ghost btn-sm" id="sl-link">${ic('link', 'i-sm')} Tambah dari tautan</button><span class="hint">Foto diperkecil otomatis sebelum diunggah.</span>` : '<span class="small muted">Sudah 12 foto. Hapus salah satu untuk menambah.</span>'}</div>
          </section>
          <section class="set-sec">
            <div class="set-h"><h3 class="h3">${ic('filetext')} Teks tentang English Club</h3></div>
            <div class="form-grid">
              ${UI.field({ name: 'about', type: 'textarea', label: 'Tentang English Club', value: draft.about, rows: 7, full: true, hint: 'Kalimat pertama tampil di bagian judul. Sisanya tampil di bagian Tentang dan otomatis dibagi menjadi paragraf. Tekan Enter bila ingin menentukan paragraf sendiri.' })}
              ${UI.field({ name: 'vision', type: 'textarea', label: 'Visi', value: draft.vision, rows: 2, full: true })}
              ${UI.field({ name: 'mission', type: 'textarea', label: 'Misi (satu per baris)', value: draft.mission, rows: 4, full: true })}
            </div>
          </section>
          <section class="set-sec">
            <div class="set-h"><div class="stack-sm"><h3 class="h3">${ic('video')} Video profil sekolah</h3><p class="small muted">Tautan YouTube paling disarankan: cepat diputar di HP maupun laptop. Kosongkan bila tidak ingin menampilkan video.</p></div></div>
            <div class="form-grid">
              ${UI.field({ name: 'profile_video', label: 'Tautan video (YouTube atau Google Drive)', value: draft.profile_video, full: true, max: 800, placeholder: 'https://youtu.be/…' })}
              <div class="field full"><div class="row"><label class="btn btn-outline btn-sm" id="vd-btn" style="cursor:pointer">${ic('upload', 'i-sm')} <span>Unggah video sendiri</span><input type="file" accept="video/mp4,video/webm,video/quicktime" id="vd-up" hidden></label><span class="hint">Maksimal 25 MB (.mp4, .webm, .mov). Video disimpan di Google Drive dan butuh beberapa menit diproses sebelum bisa diputar.</span></div></div>
              ${UI.field({ name: 'video_caption', type: 'textarea', label: 'Keterangan singkat', value: draft.video_caption, rows: 2, full: true, max: 300, placeholder: 'Contoh: Lihat suasana belajar, fasilitas, dan kegiatan siswa di sekolah kami.' })}
            </div>
          </section>
          <section class="set-sec">
            <div class="set-h"><h3 class="h3">${ic('trophy')} Kegiatan & prestasi</h3></div>
            <div class="form-grid">
              ${UI.field({ name: 'activities', type: 'textarea', label: 'Kegiatan (satu per baris: Nama | Jadwal | Deskripsi)', value: draft.activities, rows: 5, full: true })}
              ${UI.field({ name: 'achievements', type: 'textarea', label: 'Prestasi (satu per baris: Prestasi | Tahun | Keterangan)', value: draft.achievements, rows: 4, full: true, hint: 'Kosongkan bila belum ada. Bagian Prestasi disembunyikan bila kosong.' })}
            </div>
          </section>
          <section class="set-sec">
            <div class="set-h"><h3 class="h3">${ic('user')} Pembina & cara bergabung</h3></div>
            <div class="form-grid">
              <div class="field full"><span class="lbl-f">Foto Pembina</span><div class="row">
                ${draft.advisor_photo ? `<img src="${attr(draft.advisor_photo)}" alt="Foto Pembina" class="adv-prev">` : `<span class="adv-prev adv-prev-i" aria-hidden="true">${esc(advInit(draft.advisor_name))}</span>`}
                <div class="stack-sm"><div class="row-sm"><label class="btn btn-outline btn-sm" style="cursor:pointer">${ic('image', 'i-sm')} ${draft.advisor_photo ? 'Ganti foto' : 'Unggah foto'}<input type="file" accept="image/png,image/jpeg,image/webp" id="ap-up" hidden></label>${draft.advisor_photo ? '<button type="button" class="btn btn-ghost btn-sm" id="ap-x">Hapus foto</button>' : ''}</div><span class="hint">Foto dipotong persegi otomatis dan tampil bulat di kartu Pembina. Tanpa foto, inisial nama yang tampil.</span></div>
              </div></div>
              ${UI.field({ name: 'advisor_name', label: 'Nama Pembina', value: draft.advisor_name })}
              ${UI.field({ name: 'advisor_contact', label: 'Kontak resmi (nomor WhatsApp atau email sekolah)', value: draft.advisor_contact })}
              ${UI.field({ name: 'meeting_info', label: 'Jadwal pertemuan rutin', value: draft.meeting_info, full: true, placeholder: 'Contoh: Setiap Jumat, 14.00–15.30, Lab Bahasa' })}
              ${UI.field({ name: 'join_steps', type: 'textarea', label: 'Langkah bergabung (satu per baris)', value: draft.join_steps, rows: 3, full: true })}
            </div>
          </section></div>`,
        up: `<div class="form-grid">${UI.field({ name: 'max_upload_mb', type: 'number', label: 'Batas ukuran unggah langsung (MB)', value: draft.max_upload_mb, min: 1, maxv: 25, hint: 'Maksimal 25 MB. Video besar sebaiknya lewat tautan Google Drive atau YouTube.' })}
          <div class="field full"><span class="lbl-f">Format yang diizinkan</span><div class="chips-f">${['mp3', 'm4a', 'wav', 'mp4', 'webm', 'pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png', 'webp'].map(x => `<button type="button" data-ext="${x}" aria-pressed="${String(draft.allowed_ext).split(',').indexOf(x) > -1}">.${x}</button>`).join('')}</div></div></div>`
      }[tab];
      v.innerHTML = `${head('Pengaturan aplikasi', 'Ubah identitas, warna, dan isi halaman publik tanpa mengubah kode.', `<button class="btn" id="save">${ic('check', 'i-sm')} Simpan perubahan</button>`)}
        <div class="tabs" role="tablist" style="width:max-content;max-width:100%">${[['id', 'Identitas & tema'], ['pub', 'Halaman publik'], ['up', 'Unggahan']].map(t => `<button role="tab" data-t="${t[0]}" aria-selected="${t[0] === tab}">${t[1]}</button>`).join('')}</div>
        <div class="${tab === 'id' ? 'split' : ''}"><form class="card" id="sf">${body}</form>${tab === 'id' ? preview() : ''}</div>`;
      const f = v.querySelector('#sf');
      v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { collect(); tab = b.dataset.t; paint(); });
      f.addEventListener('input', e => {
        if (e.target.dataset.cp) { const k = e.target.dataset.cp; draft[k] = e.target.value.toUpperCase(); f.querySelector(`[data-hex="${k}"]`).value = draft[k]; check(); refreshPv(); }
        else if (e.target.dataset.hex) { const k = e.target.dataset.hex, val = e.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(val)) { draft[k] = val.toUpperCase(); f.querySelector(`[data-cp="${k}"]`).value = val; check(); refreshPv(); } }
        else if (tab === 'id') { collect(); refreshPv(); }
      });
      const check = () => {
        [['color_primary', 4.5], ['color_navy', 4.5], ['color_gamify', 3]].forEach(([k, min]) => {
          const w = f.querySelector(`[data-cw="${k}"]`); if (!w) return; const r = contrast(draft[k], '#FFFFFF');
          w.hidden = r >= min; w.innerHTML = `${ic('alert', 'i-sm')} Kontras dengan teks putih ${r.toFixed(1)}:1, disarankan minimal ${min}:1. Pilih warna lebih gelap.`;
        });
      };
      const refreshPv = () => { const pv = v.querySelector('.split > .card.pad-0'); if (pv) pv.outerHTML = preview(); };
      if (tab === 'id') check();
      f.querySelectorAll('[data-ext]').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); draft.allowed_ext = [...f.querySelectorAll('[data-ext][aria-pressed=true]')].map(x => x.dataset.ext).join(','); });
      const cd = f.querySelector('#cdef'); if (cd) cd.onclick = () => { Object.assign(draft, DEF); paint(); };
      const lg = f.querySelector('#lg'); if (lg) lg.onchange = async e => { const file = e.target.files[0]; if (!file) return; try { collect(); draft.logo = await UI.squareThumb(file, 256); draft.logo_thumb = await UI.squareThumb(file, 64); paint(); } catch (x) { toast(x.message, 'err'); } };
      const lx = f.querySelector('#lgx'); if (lx) lx.onclick = () => { draft.logo = ''; draft.logo_thumb = ''; paint(); };
      if (tab === 'pub') bindPub();
      v.querySelector('#save').onclick = e => UI.busy(e.currentTarget, async () => {
        collect();
        const changes = {}; Object.keys(draft).forEach(k => { if (String(draft[k]) !== String(s[k])) changes[k] = draft[k]; });
        if (!Object.keys(changes).length) return toast('Tidak ada perubahan.', 'warn');
        const r = await API.act('a.settings.save', changes);
        s = Object.assign({}, s, changes); App.applySettings(Object.assign({}, App.settings, r.data));
        toast(r.message);
        document.querySelector('.shell') && (document.getElementById('app').innerHTML = '', App.route());
      });
      function collect() {
        const d = UI.formData(v.querySelector('#sf') || f);
        Object.keys(d).forEach(k => { if (k in s) draft[k] = k === 'mascot_enabled' ? String(!!d[k]) : String(d[k]); });
        draft.hero_slides = slides.length ? JSON.stringify(slides.map(x => ({ u: x.u, c: x.c || '' }))) : '';
      }
      /* ---------- slide foto, video profil, foto Pembina ---------- */
      function bindPub() {
        const again = () => { if (!ctx.alive() || tab !== 'pub') return; collect(); paint(); };
        f.querySelectorAll('[data-sc]').forEach(el => el.addEventListener('input', () => { slides[+el.dataset.sc].c = el.value; }));
        f.querySelectorAll('[data-sm]').forEach(b => b.onclick = () => { const i = +b.dataset.sm, j = i + +b.dataset.dir; collect(); [slides[i], slides[j]] = [slides[j], slides[i]]; paint(); });
        f.querySelectorAll('[data-sx]').forEach(b => b.onclick = () => { collect(); slides.splice(+b.dataset.sx, 1); paint(); });
        const label = (id, text) => { const el = f.querySelector(id); if (el) { el.classList.add('loading'); el.style.pointerEvents = 'none'; el.querySelector('span').textContent = text; } };
        const up = f.querySelector('#sl-up');
        if (up) up.onchange = async e => {
          const files = [...e.target.files].slice(0, 12 - slides.length); if (!files.length) return;
          let done = 0;
          for (const file of files) {
            label('#sl-btn', `Mengunggah ${done + 1}/${files.length}…`);
            try {
              const data = await UI.resizeImage(file, 1600, 'image/jpeg', 0.82);
              const r = await API.act('a.media.save', { kind: 'slide', file: { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', mime: 'image/jpeg', b64: data.split(',')[1] } }, { timeout: 120000 });
              slides.push({ u: r.data.url, c: '' }); done++;
            } catch (x) { toast(file.name + ': ' + x.message, 'err'); }
          }
          if (done) toast(done + ' foto ditambahkan. Tekan Simpan perubahan agar tampil di halaman utama.');
          again();
        };
        const ln = f.querySelector('#sl-link');
        if (ln) ln.onclick = async () => {
          const u = await UI.confirmBox({ title: 'Tambah foto dari tautan', text: 'Tempel tautan gambar yang diawali https://. Tautan Google Drive juga bisa, asalkan aksesnya "Siapa saja yang memiliki link".', extra: '<input class="input" id="sl-url" placeholder="https://…" style="margin-top:12px" aria-label="Tautan gambar">', ok: 'Tambah', collect: el => el.querySelector('#sl-url').value.trim() });
          if (!u) return;
          if (!/^https:\/\//i.test(u)) return toast('Tautan harus diawali https://', 'err');
          collect(); slides.push({ u: driveImg(u), c: '' }); paint();
        };
        const vd = f.querySelector('#vd-up');
        if (vd) vd.onchange = async e => {
          const file = e.target.files[0]; if (!file) return;
          if (file.size > 25 * 1048576) return toast('Video lebih dari 25 MB. Unggah ke YouTube atau Google Drive, lalu tempel tautannya.', 'err');
          label('#vd-btn', 'Mengunggah video…');
          try {
            const r = await API.act('a.media.save', { kind: 'video', file: { name: file.name, mime: file.type, b64: await UI.readB64(file) } }, { timeout: 300000 });
            if (ctx.alive() && tab === 'pub') { collect(); draft.profile_video = r.data.url; paint(); } else draft.profile_video = r.data.url;
            toast(r.message);
          } catch (x) { toast(x.message, 'err'); again(); }
        };
        const ap = f.querySelector('#ap-up');
        if (ap) ap.onchange = async e => { const file = e.target.files[0]; if (!file) return; try { collect(); draft.advisor_photo = await UI.squareThumb(file, 320); paint(); } catch (x) { toast(x.message, 'err'); } };
        const ax = f.querySelector('#ap-x'); if (ax) ax.onclick = () => { collect(); draft.advisor_photo = ''; paint(); };
      }
    };
    paint();
  };

  /* ============================== ATURAN XP & LEVEL ============================== */
  Pages.aRules = async function (v, p, ctx) {
    App.setTitle('Aturan XP & level', [['Administrasi']]);
    v.innerHTML = UI.skel(2, 260);
    let d; try { d = await API.get('a.rules.get', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    let rules = d.rules.map(r => Object.assign({}, r)), levels = d.levels.map(l => Object.assign({}, l));
    const paint = () => {
      v.innerHTML = `${head('Aturan XP & level', 'XP materi, tantangan, dan kuis juga bisa diatur per item saat Pembina membuatnya. Aturan di sini dipakai sebagai nilai bawaan.', `<button class="btn" id="save">${ic('check', 'i-sm')} Simpan aturan</button>`)}
        <div class="split-r"><div class="card pad-0"><div class="card-h" style="padding:18px 18px 0"><h3 class="h3">${ic('zap')} Aturan perolehan XP</h3></div>
          <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Aktivitas</th><th style="width:110px">XP</th><th style="width:90px">Aktif</th></tr></thead><tbody>${rules.map((r, i) => `<tr><td><div class="small" style="font-weight:600">${esc(r.label)}</div><code class="xs muted">${esc(r.key)}</code></td><td><input class="input num" type="number" min="0" max="1000" data-rx="${i}" value="${r.xp}" style="width:90px" aria-label="XP ${attr(r.label)}"></td><td><label class="switch"><input type="checkbox" data-ra="${i}" ${r.active ? 'checked' : ''} aria-label="Aktif"><span class="tr"></span></label></td></tr>`).join('')}</tbody></table></div></div>
          <div class="card"><div class="card-h"><h3 class="h3">${ic('shield')} Level</h3><button class="btn btn-ghost btn-sm" id="ladd">${ic('plus', 'i-sm')} Tambah level</button></div>
            <div class="stack-sm">${levels.map((l, i) => `<div class="row-sm" style="flex-wrap:nowrap"><span class="lvl-badge" style="width:34px;height:34px;font-size:13px">${i + 1}</span><input class="input" data-ln="${i}" value="${attr(l.name)}" maxlength="40" aria-label="Nama level ${i + 1}"><input class="input num" type="number" data-lx="${i}" value="${l.xp}" min="0" style="width:110px" ${i === 0 ? 'disabled' : ''} aria-label="XP minimal level ${i + 1}"><span class="xs muted">XP</span>${i > 0 && i === levels.length - 1 ? `<button class="icon-btn" data-lr aria-label="Hapus level">${ic('x', 'i-sm')}</button>` : '<span style="width:40px"></span>'}</div>`).join('')}</div>
            <p class="xs muted" style="margin-top:10px">Level pengguna dihitung ulang otomatis saat aturan disimpan.</p></div></div>`;
      v.querySelector('#ladd').onclick = () => { const last = levels[levels.length - 1]; levels.push({ name: 'Level ' + (levels.length + 1), xp: last.xp + 500 }); paint(); };
      const lr = v.querySelector('[data-lr]'); if (lr) lr.onclick = () => { levels.pop(); paint(); };
      v.querySelector('#save').onclick = e => UI.busy(e.currentTarget, async () => { const r = await API.act('a.rules.save', { rules, levels }); toast(r.message); });
    };
    function onIn(e) {
      const t = e.target;
      if (t.dataset.rx) rules[+t.dataset.rx].xp = +t.value; if (t.dataset.ra) rules[+t.dataset.ra].active = t.checked;
      if (t.dataset.ln) levels[+t.dataset.ln].name = t.value; if (t.dataset.lx) levels[+t.dataset.lx].xp = +t.value;
    }
    v.addEventListener('change', onIn); v.addEventListener('input', onIn);
    paint();
  };

  /* ============================== IMPORT DATA ============================== */
  Pages.aImport = async function (v, p, ctx) {
    App.setTitle('Import data anggota', [['Administrasi']]);
    let mode = 'sheet', rows = [], last = null;
    const paint = () => {
      v.innerHTML = `${head('Import data anggota', 'Pindahkan daftar anggota dari Google Sheets atau berkas CSV menjadi akun. Data sumber hanya dibaca, tidak diubah.', '')}
        <div class="split"><div class="stack">
          <div class="tabs" role="tablist" style="width:max-content">${[['sheet', 'Dari Google Sheets'], ['csv', 'Dari berkas CSV']].map(t => `<button role="tab" data-m="${t[0]}" aria-selected="${t[0] === mode}">${t[1]}</button>`).join('')}</div>
          <form class="card stack" id="if">
            ${mode === 'sheet' ? `${UI.field({ name: 'source', label: 'URL atau ID spreadsheet sumber', placeholder: 'https://docs.google.com/spreadsheets/d/…', required: true, hint: 'Spreadsheet harus bisa dibuka oleh akun Google pemilik aplikasi.' })}${UI.field({ name: 'sheetName', label: 'Nama sheet (opsional)', placeholder: 'Kosongkan untuk sheet pertama' })}`
              : `<div class="row"><button type="button" class="btn btn-outline btn-sm" id="tpl">${ic('download', 'i-sm')} Unduh template CSV</button></div><label class="drop"><input type="file" accept=".csv,text/csv" id="cf">${ic('cloud')}<b class="small">Pilih berkas CSV</b><span class="xs muted" id="cfn">Kolom: Nama, Username, Kelas, Tingkat, WA, Peran</span></label>`}
            ${UI.field({ name: 'overwrite', type: 'switch', label: 'Perbarui data akun yang sudah ada (nama, kelas, tingkat, WA)', hint: 'Bila mati, username yang sudah ada dilewati. Peran dan status akun tidak pernah ditimpa.' })}
            <div class="row"><button type="button" class="btn btn-outline" id="scan">${ic('search', 'i-sm')} Pindai (tanpa menyimpan)</button><button type="button" class="btn" id="run" ${last && last.report.inserted + last.report.updated ? '' : 'disabled'}>${ic('database', 'i-sm')} Jalankan import</button></div>
          </form>
          <div id="res">${last ? result(last) : ''}</div></div>
          <aside class="card stack-sm"><h3 class="h3">${ic('info')} Cara kerja</h3><ol class="small stack-sm" style="padding-left:18px;margin:0">
            <li>Judul kolom di baris pertama dikenali otomatis: <b>Nama</b>, Username, Kelas, Tingkat, WA/No HP, Peran.</li>
            <li>Bila username kosong, dibuat dari nama (contoh: <code>nabila.kusuma</code>).</li>
            <li>Tekan <b>Pindai</b> untuk melihat hasil tanpa menyimpan apa pun.</li>
            <li>Import aman diulang: username yang sama tidak dibuat dua kali.</li>
            <li>Baris berperan Admin tidak diimpor. Nomor WA dirapikan agar diawali 0.</li>
            <li>Setiap akun baru mendapat kata sandi awal acak yang ditampilkan sekali.</li></ol></aside></div>`;
      v.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; last = null; rows = []; paint(); });
      const f = v.querySelector('#if');
      const tpl = v.querySelector('#tpl'); if (tpl) tpl.onclick = () => UI.csvDownload([['Nama', 'Username', 'Kelas', 'Tingkat', 'WA', 'Peran'], ['Nabila Kusuma', '', 'XI-A', '11', '081234567890', 'Siswa'], ['Dimas Wahyudi', 'dimas', 'XI-B', '11', '', 'Siswa']], 'template-anggota.csv');
      const cf = v.querySelector('#cf'); if (cf) cf.onchange = async e => {
        const file = e.target.files[0]; if (!file) return;
        const data = UI.parseCSV(await file.text());
        const alias = { nama: 'name', 'nama lengkap': 'name', name: 'name', username: 'username', kelas: 'class', class: 'class', tingkat: 'grade', grade: 'grade', wa: 'wa', whatsapp: 'wa', 'no hp': 'wa', 'no wa': 'wa', 'nomor wa': 'wa', hp: 'wa', peran: 'role', role: 'role' };
        const h = data[0].map(x => alias[x.toLowerCase()] || '');
        if (h.indexOf('name') === -1) return toast('Kolom "Nama" tidak ditemukan di baris pertama.', 'err');
        rows = data.slice(1).map(r => { const o = {}; h.forEach((k, i) => { if (k) o[k] = r[i]; }); return o; });
        v.querySelector('#cfn').textContent = `${file.name} · ${rows.length} baris`;
      };
      const send = async dry => {
        const d = UI.formData(f);
        const payload = mode === 'csv' ? { mode: 'csv', rows, dryRun: dry, overwrite: d.overwrite } : { mode: 'sheet', source: d.source, sheetName: d.sheetName, dryRun: dry, overwrite: d.overwrite };
        if (mode === 'csv' && !rows.length) throw new Error('Pilih berkas CSV terlebih dahulu.');
        const r = await API.act('a.import', payload, { timeout: 300000 });
        return r;
      };
      v.querySelector('#scan').onclick = e => UI.busy(e.currentTarget, async () => { const r = await send(true); last = r.data; const keep = UI.formData(f); paint(); restore(keep); });
      v.querySelector('#run').onclick = async e => {
        if (!(await UI.confirmBox({ title: 'Jalankan import?', text: `${last.report.inserted} akun baru akan dibuat${last.report.updated ? ' dan ' + last.report.updated + ' diperbarui' : ''}.`, ok: 'Jalankan' }))) return;
        UI.busy(e.currentTarget, async () => { const r = await send(false); toast(r.message); last = null; const keep = UI.formData(f); paint(); restore(keep); if (r.data.credentials.length) credModal(r.data.credentials, 'Akun hasil import'); });
      };
      function restore(k) { const ff = v.querySelector('#if'); Object.keys(k).forEach(n => { const el = ff.querySelector(`[name="${n}"]`); if (!el) return; if (el.type === 'checkbox') el.checked = k[n]; else el.value = k[n]; }); }
    };
    const result = d => `<div class="card stack"><div class="row between"><h3 class="h3">Hasil pindai</h3><span class="chip chip-blue">Belum disimpan</span></div>
      <div class="grid g-4">${[['Baris sumber', d.report.source, 'ic-slate'], ['Akun baru', d.report.inserted, 'ic-green'], ['Diperbarui', d.report.updated, 'ic-blue'], ['Dilewati', d.report.skipped, 'ic-orange']].map(x => `<div class="card tint pad-sm"><div class="xs muted">${x[0]}</div><div class="stat-lg">${x[1]}</div></div>`).join('')}</div>
      ${d.preview.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Kelas</th><th>WA</th></tr></thead><tbody>${d.preview.map(r => `<tr><td class="small">${esc(r.name)}</td><td><code>${esc(r.username)}</code></td><td class="small">${esc(L.role[r.role])}</td><td class="small">${esc(r.class)}</td><td class="small">${esc(r.wa)}</td></tr>`).join('')}</tbody></table></div>${d.report.inserted > d.preview.length ? `<p class="xs muted">Menampilkan ${d.preview.length} dari ${d.report.inserted} akun baru.</p>` : ''}` : ''}
      ${d.warnings.length ? `<div class="warn-box">${ic('alert')}<ul class="small" style="margin:0;padding-left:16px">${d.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}</div>`;
    paint();
  };

  /* ============================== LOG AKTIVITAS ============================== */
  Pages.aAudit = async function (v, p, ctx) {
    App.setTitle('Log aktivitas', [['Administrasi']]);
    v.innerHTML = UI.skel(1, 400);
    let rows; try { rows = await API.get('a.audit', { limit: 1000 }); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    rows = rows.map((r, i) => Object.assign({ id: String(i) }, r));
    v.innerHTML = head('Log aktivitas', '1.000 catatan terakhir: login, perubahan akun, pengaturan, penilaian, dan import. Kata sandi tidak pernah dicatat.', '') + '<div id="t"></div>';
    UI.table(v.querySelector('#t'), { rows, per: 50, search: ['actor', 'action', 'entity', 'detail'], placeholder: 'Cari pengguna, aksi, atau objek', sort: 'at', dir: -1,
      filters: [{ key: 'action', label: 'Aksi', options: [...new Set(rows.map(r => r.action))].sort() }, { key: 'role', label: 'Peran', options: [{ v: 'admin', l: 'Admin' }, { v: 'mentor', l: 'Pembina' }, { v: 'student', l: 'Siswa' }, { v: '-', l: 'Tanpa login' }] }],
      columns: [
        { key: 'at', label: 'Waktu', render: r => `<span class="small nowrap">${fmt.dt(r.at)}</span>` },
        { key: 'actor', label: 'Pengguna', render: r => `<span class="small">${esc(r.actor)}</span> <span class="xs muted">${esc(L.role[r.role] || r.role)}</span>` },
        { key: 'action', label: 'Aksi', render: r => `<span class="chip ${/GAGAL|HAPUS/.test(r.action) ? 'chip-red' : /LOGIN/.test(r.action) ? 'chip-green' : 'chip-blue'}">${esc(r.action)}</span>` },
        { key: 'entity', label: 'Objek', render: r => `<span class="small">${esc(r.entity)}</span>` },
        { key: 'detail', label: 'Detail', render: r => `<span class="xs muted">${esc(r.detail)}</span>` }] });
  };
})();
