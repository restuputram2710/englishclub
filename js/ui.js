/* ==========================================================================
   Komponen UI bersama: escape, format, toast, modal, laci, tabel, formulir,
   grafik SVG, markdown aman, unggah berkas, dan efek hadiah (XP/level/badge).
   ========================================================================== */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = v => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const attr = esc;

  /* ---------- format ---------- */
  const nf = new Intl.NumberFormat('id-ID');
  const fmt = {
    n: v => nf.format(Math.round(Number(v) || 0)),
    date: ms => ms ? new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
    dt: ms => ms ? new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-',
    time: ms => ms ? new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    ymd: n => { if (!n) return '-'; const s = String(n); return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); },
    ymdDay: n => { const s = String(n); return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).toLocaleDateString('id-ID', { weekday: 'short' }); },
    ago: ms => {
      if (!ms) return '-';
      const d = (Date.now() - ms) / 1000;
      if (d < 60) return 'baru saja';
      if (d < 3600) return Math.floor(d / 60) + ' menit lalu';
      if (d < 86400) return Math.floor(d / 3600) + ' jam lalu';
      if (d < 604800) return Math.floor(d / 86400) + ' hari lalu';
      return fmt.date(ms);
    },
    left: ms => {
      if (!ms) return 'Tanpa batas waktu';
      const d = (ms - Date.now()) / 1000;
      if (d <= 0) return 'Berakhir';
      if (d < 3600) return Math.ceil(d / 60) + ' menit lagi';
      if (d < 86400) return Math.floor(d / 3600) + ' jam ' + Math.floor((d % 3600) / 60) + ' menit lagi';
      return Math.ceil(d / 86400) + ' hari lagi';
    },
    dur: s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
    size: b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB',
    first: name => String(name || '').split(' ')[0],
    initials: name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  };

  /* ---------- label & warna domain ---------- */
  const L = {
    status: { submitted: 'Dikirim', reviewed: 'Dinilai', revision: 'Perlu revisi', completed: 'Selesai', open: 'Terbuka', expired: 'Berakhir', upcoming: 'Segera', draft: 'Draf', published: 'Terbit', active: 'Aktif', inactive: 'Nonaktif', none: 'Belum mengerjakan' },
    type: { daily: 'Daily Challenge', weekly: 'Weekly Mission', monthly: 'Monthly Challenge', special: 'Special Challenge' },
    typeShort: { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', special: 'Spesial' },
    role: { admin: 'Admin', mentor: 'Pembina', student: 'Siswa' },
    sub: { file_or_link: 'Berkas atau tautan', text: 'Jawaban tulisan', quiz: 'Kuis' }
  };
  const SKILL = {
    Speaking: { icon: 'mic', tone: 'blue', desc: 'Berbicara dengan percaya diri: perkenalan, presentasi, dan debat.' },
    Listening: { icon: 'headphones', tone: 'green', desc: 'Menangkap informasi penting dari percakapan dan rekaman.' },
    Reading: { icon: 'book', tone: 'gold', desc: 'Memahami teks dengan teknik skimming dan scanning.' },
    Writing: { icon: 'pen', tone: 'orange', desc: 'Menulis paragraf dan esai yang runtut dan jelas.' },
    Vocabulary: { icon: 'languages', tone: 'purple', desc: 'Memperkaya kosakata untuk berbagai situasi.' },
    Grammar: { icon: 'spell', tone: 'navy', desc: 'Menguasai tenses dan struktur kalimat yang tepat.' },
    Pronunciation: { icon: 'volume', tone: 'blue', desc: 'Melatih pengucapan bunyi dan intonasi.' },
    Idiom: { icon: 'quote', tone: 'gold', desc: 'Ungkapan sehari-hari agar terdengar natural.' }
  };
  const SKILLS6 = ['Speaking', 'Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar'];
  const toneIc = t => ({ blue: 'ic-blue', green: 'ic-green', gold: 'ic-gold', orange: 'ic-orange', purple: 'ic-purple', navy: 'ic-navy' }[t] || 'ic-blue');
  const toneBar = t => ({ blue: '', green: 'green', gold: 'gold', orange: 'orange', purple: 'purple', navy: '' }[t] || '');
  const pill = s => `<span class="chip pill-${attr(s)}">${esc(L.status[s] || s)}</span>`;
  const xpChip = (n, pre) => `<span class="chip xp-chip">${ic('zap')}${pre === false ? '' : '+'}${fmt.n(n)} XP</span>`;
  const skillChip = s => `<span class="chip chip-${({ blue: 'blue', green: 'green', gold: 'gold', orange: 'orange', purple: 'purple', navy: 'navy' })[(SKILL[s] || {}).tone] || 'blue'}">${esc(s)}</span>`;
  const avatar = (name, photo, cls) => `<span class="av ${cls || ''}" aria-hidden="true">${photo ? `<img src="${attr(photo)}" alt="">` : esc(fmt.initials(name))}</span>`;
  const bar = (pct, cls) => `<div class="bar ${cls || ''}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
  const metric = (o) => `<div class="card"><div class="metric"><div class="mtop"><span class="ic ${o.tone || 'ic-blue'}">${ic(o.icon)}</span><span class="lbl">${esc(o.label)}</span></div>
    <div class="stat-xl">${o.value}</div>${o.sub ? `<div class="sub ${o.up ? 'up' : ''}">${o.sub}</div>` : ''}</div></div>`;

  /* ---------- toast ---------- */
  function toast(msg, type, ms) {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.innerHTML = (typeof msg === 'string' ? `${ic(type === 'err' ? 'alert' : type === 'warn' ? 'info' : 'checkcircle')}<span>${esc(msg)}</span>` : msg.html) + `<button class="x" aria-label="Tutup">${ic('x', 'i-sm')}</button>`;
    el.querySelector('.x').onclick = () => el.remove();
    box.appendChild(el);
    setTimeout(() => el.remove(), ms || (type === 'err' ? 6000 : 3500));
    return el;
  }

  /* ---------- modal & konfirmasi ---------- */
  function modal(o) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${o.size || ''}" role="dialog" aria-modal="true" aria-labelledby="mdl-t">
      <div class="modal-h"><div class="stack-sm"><h2 class="h2" id="mdl-t">${esc(o.title || '')}</h2>${o.sub ? `<p class="muted small">${esc(o.sub)}</p>` : ''}</div>
      <button class="icon-btn plain" data-close aria-label="Tutup">${ic('x')}</button></div>
      <div class="modal-b">${o.body || ''}</div>${o.foot !== false ? `<div class="modal-f">${o.foot || '<button class="btn btn-outline" data-close>Tutup</button>'}</div>` : ''}</div>`;
    const prev = document.activeElement;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); if (o.onClose) o.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    back.addEventListener('click', e => { if (e.target === back && !o.sticky) close(); if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    const f = back.querySelector('input,select,textarea,button:not([data-close])'); if (f) setTimeout(() => f.focus(), 30);
    return { el: back, body: back.querySelector('.modal-b'), close };
  }
  function confirmBox(o) {
    return new Promise(res => {
      const m = modal({ title: o.title, size: 'sm', body: `<p>${esc(o.text || '')}</p>${o.extra || ''}`,
        foot: `<button class="btn btn-outline" data-close>Batal</button><button class="btn ${o.danger ? 'btn-danger' : ''}" data-ok>${esc(o.ok || 'Lanjutkan')}</button>`,
        onClose: () => res(false) });
      m.el.querySelector('[data-ok]').onclick = () => { const v = o.collect ? o.collect(m.el) : true; m.el.remove(); res(v); };
    });
  }
  function drawer(o) {
    const back = document.createElement('div'); back.className = 'drawer-back';
    const d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = `<div class="modal-h" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><div class="stack-sm"><h2 class="h2">${esc(o.title || '')}</h2>${o.sub ? `<p class="muted small">${o.sub}</p>` : ''}</div><button class="icon-btn plain" data-close aria-label="Tutup">${ic('x')}</button></div><div class="modal-b" style="flex:1">${o.body || ''}</div>${o.foot ? `<div class="modal-f">${o.foot}</div>` : ''}`;
    const close = () => { back.remove(); d.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    back.onclick = close; d.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.append(back, d);
    return { el: d, body: d.querySelector('.modal-b'), close };
  }

  /* ---------- status muat ---------- */
  const skel = (n, h) => Array.from({ length: n || 3 }, () => `<div class="sk" style="height:${h || 120}px"></div>`).join('');
  function empty(o) {
    return `<div class="empty"><div class="art">${window.Leo ? Leo.svg(o.expr || 'think') : ''}</div><b>${esc(o.title)}</b>${o.text ? `<p>${esc(o.text)}</p>` : ''}${o.action || ''}</div>`;
  }
  const errBox = (msg, retry) => `<div class="err-box">${ic('alert')}<div class="stack-sm"><b>Gagal memuat</b><span>${esc(msg)}</span>${retry ? `<div><button class="btn btn-sm btn-outline" data-retry>${ic('refresh', 'i-sm')} Coba lagi</button></div>` : ''}</div></div>`;

  /* ---------- markdown aman (subset) ---------- */
  function md(src) {
    const lines = esc(src || '').split(/\r?\n/);
    const out = []; let list = null;
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const flush = () => { if (list) { out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
    let para = [];
    const flushP = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
    lines.forEach(l => {
      const t = l.trim();
      let m;
      if (!t) { flushP(); flush(); return; }
      if ((m = t.match(/^(#{2,3})\s+(.*)$/))) { flushP(); flush(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); return; }
      if ((m = t.match(/^[-*]\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); return; }
      if ((m = t.match(/^\d+\.\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); return; }
      if ((m = t.match(/^&gt;\s?(.*)$/))) { flushP(); flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); return; }
      flush(); para.push(t);
    });
    flushP(); flush();
    return out.join('');
  }

  /* ---------- grafik SVG ---------- */
  const chart = {
    radar(values, labels, o) {
      o = o || {}; const n = labels.length, W = 320, H = 280, cx = W / 2, cy = H / 2 + 4, R = 96;
      const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
      let g = '';
      [0.25, 0.5, 0.75, 1].forEach(f => { g += `<polygon points="${labels.map((_, i) => pt(i, R * f).join(',')).join(' ')}" fill="none" stroke="#DCE3F0" stroke-width="1"/>`; });
      labels.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#DCE3F0"/>`; });
      const poly = values.map((v, i) => pt(i, R * Math.max(0.02, Math.min(100, v) / 100)).join(',')).join(' ');
      g += `<polygon points="${poly}" fill="color-mix(in srgb, var(--purple) 22%, transparent)" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round"/>`;
      values.forEach((v, i) => { const [x, y] = pt(i, R * Math.max(0.02, Math.min(100, v) / 100)); g += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--primary)"/>`; });
      labels.forEach((l, i) => { const [x, y] = pt(i, R + 22); g += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11.5" font-weight="600" fill="#5B6577">${esc(l)}</text><text x="${x}" y="${y + 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#171C20" font-family="Space Grotesk, sans-serif">${Math.round(values[i])}</text>`; });
      return `<svg viewBox="0 0 ${W} ${H + 12}" role="img" aria-label="${attr(o.label || 'Grafik radar keterampilan')}" style="width:100%;max-width:${o.max || 360}px;display:block;margin:auto">${g}</svg>`;
    },
    line(points, o) {
      o = o || {}; const W = 560, H = o.h || 200, pl = 34, pr = 10, pt = 14, pb = 26;
      const vals = points.map(p => p.v), max = Math.max(o.min || 10, ...vals), nice = Math.ceil(max / 5) * 5 || 10;
      const x = i => pl + (points.length === 1 ? 0 : i * (W - pl - pr) / (points.length - 1)), y = v => pt + (H - pt - pb) * (1 - v / nice);
      let g = '';
      [0, 0.5, 1].forEach(f => { const v = Math.round(nice * f); g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#E5E8EE"/><text x="${pl - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle" font-size="10.5" fill="#8A93A6">${v}</text>`; });
      const d = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join('');
      g += `<path d="${d}L${x(points.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z" fill="color-mix(in srgb, var(--primary) 12%, transparent)"/>`;
      g += `<path d="${d}" fill="none" stroke="var(--primary)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      const step = Math.ceil(points.length / (o.ticks || 7));
      points.forEach((p, i) => { if (i % step === 0 || i === points.length - 1) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="#8A93A6">${esc(p.l)}</text>`; });
      const li = points.length - 1; g += `<circle cx="${x(li)}" cy="${y(points[li].v)}" r="4.5" fill="var(--primary)" stroke="#fff" stroke-width="2"/>`;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${attr(o.label || 'Grafik garis')}" style="width:100%;display:block">${g}</svg>`;
    },
    bars(items, o) {
      o = o || {}; const W = 560, H = o.h || 200, pl = 30, pb = 26, pt = 18;
      const max = Math.max(1, ...items.map(i => i.v)), bw = (W - pl - 10) / Math.max(items.length, 1);
      let g = '';
      items.forEach((it, i) => {
        const h = (H - pt - pb) * it.v / max, x = pl + i * bw + bw * 0.18, w = bw * 0.64;
        g += `<rect x="${x}" y="${H - pb - h}" width="${w}" height="${Math.max(h, 1)}" rx="6" fill="${it.c || 'var(--primary)'}"/>`;
        g += `<text x="${x + w / 2}" y="${H - pb - h - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#171C20">${esc(it.t !== undefined ? it.t : it.v)}</text>`;
        g += `<text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" font-size="10.5" fill="#5B6577">${esc(it.l)}</text>`;
      });
      g += `<line x1="${pl}" x2="${W - 10}" y1="${H - pb}" y2="${H - pb}" stroke="#DCE3F0"/>`;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${attr(o.label || 'Grafik batang')}" style="width:100%;display:block">${g}</svg>`;
    },
    donut(parts, o) {
      o = o || {}; const total = parts.reduce((a, p) => a + p.v, 0) || 1, R = 52, C = 2 * Math.PI * R; let off = 0, g = '';
      parts.forEach(p => { const len = C * p.v / total; g += `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${p.c}" stroke-width="18" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`; off += len; });
      const legend = parts.map(p => `<div class="row-sm small"><span class="dot" style="color:${p.c}"></span><span class="grow">${esc(p.l)}</span><b class="num">${fmt.n(p.v)}</b></div>`).join('');
      return `<div class="row" style="gap:18px;flex-wrap:nowrap"><svg viewBox="0 0 140 140" width="130" height="130" role="img" aria-label="${attr(o.label || 'Diagram donat')}"><circle r="${R}" cx="70" cy="70" fill="none" stroke="#EEF2F8" stroke-width="18"/>${g}<text x="70" y="66" text-anchor="middle" font-size="22" font-weight="700" font-family="Space Grotesk, sans-serif" fill="#171C20">${esc(o.center || fmt.n(total))}</text><text x="70" y="86" text-anchor="middle" font-size="10.5" fill="#5B6577">${esc(o.sub || 'total')}</text></svg><div class="stack-sm grow">${legend}</div></div>`;
    }
  };

  /* ---------- tabel data (cari, saring, urut, halaman) ---------- */
  function table(host, o) {
    const st = { q: '', page: 1, sort: o.sort || null, dir: o.dir || 1, filters: {} };
    const per = o.per || 25;
    function rows() {
      let r = o.rows.slice();
      if (st.q) { const q = st.q.toLowerCase(); r = r.filter(x => (o.search || []).some(k => String(typeof k === 'function' ? k(x) : x[k] || '').toLowerCase().includes(q))); }
      Object.keys(st.filters).forEach(k => { const v = st.filters[k]; if (v) r = r.filter(x => String(x[k]) === v); });
      if (st.sort) { const c = o.columns.find(c => c.key === st.sort); const val = c && c.sortVal ? c.sortVal : (x => x[st.sort]); r.sort((a, b) => { const A = val(a), B = val(b); return (A > B ? 1 : A < B ? -1 : 0) * st.dir; }); }
      return r;
    }
    function render() {
      const all = rows(), pages = Math.max(1, Math.ceil(all.length / per)); st.page = Math.min(st.page, pages);
      const show = all.slice((st.page - 1) * per, st.page * per);
      const body = show.length ? show.map(r => `<tr class="${o.onRow ? 'click' : ''} ${o.rowClass ? o.rowClass(r) : ''}" data-id="${attr(r[o.id || 'id'])}" ${o.onRow ? 'tabindex="0"' : ''}>${o.columns.map(c => `<td class="${c.cls || ''}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${o.columns.length}">${empty({ title: o.emptyTitle || 'Belum ada data', text: o.emptyText || '', expr: 'idle' })}</td></tr>`;
      host.querySelector('tbody').innerHTML = body;
      host.querySelector('.tbl-foot').innerHTML = `<span>${all.length ? `Menampilkan ${(st.page - 1) * per + 1}–${Math.min(st.page * per, all.length)} dari ${fmt.n(all.length)}` : '0 data'}</span>` +
        (pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, i) => i + 1).filter(p => p === 1 || p === pages || Math.abs(p - st.page) <= 1).map(p => `<button data-pg="${p}" ${p === st.page ? 'aria-current="true"' : ''}>${p}</button>`).join('')}</div>` : '');
      host.querySelectorAll('th[data-k]').forEach(th => th.setAttribute('aria-sort', th.dataset.k === st.sort ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'));
    }
    const filt = (o.filters || []).map(f => `<select class="select" data-f="${attr(f.key)}" aria-label="${attr(f.label)}"><option value="">${esc(f.label)}: semua</option>${f.options.map(op => `<option value="${attr(op.v !== undefined ? op.v : op)}">${esc(op.l || op)}</option>`).join('')}</select>`).join('');
    host.innerHTML = `${o.search ? `<div class="toolbar" style="margin-bottom:12px"><div class="input-wrap">${ic('search')}<input class="input" type="search" placeholder="${attr(o.placeholder || 'Cari…')}" aria-label="Cari"></div>${filt}${o.tools || ''}</div>` : ''}
      <div class="table-wrap"><table class="tbl"><thead><tr>${o.columns.map(c => `<th class="${c.sort !== false && c.key ? 'sortable' : ''} ${c.cls || ''}" ${c.key && c.sort !== false ? `data-k="${attr(c.key)}"` : ''} scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody></tbody></table><div class="tbl-foot"></div></div>`;
    const s = host.querySelector('input[type=search]');
    if (s) s.addEventListener('input', () => { st.q = s.value.trim(); st.page = 1; render(); });
    host.querySelectorAll('select[data-f]').forEach(sel => sel.addEventListener('change', () => { st.filters[sel.dataset.f] = sel.value; st.page = 1; render(); }));
    host.addEventListener('click', e => {
      const th = e.target.closest('th[data-k]'); if (th) { if (st.sort === th.dataset.k) st.dir = -st.dir; else { st.sort = th.dataset.k; st.dir = 1; } render(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg) { st.page = +pg.dataset.pg; render(); return; }
      const tr = e.target.closest('tbody tr[data-id]'); if (tr && o.onRow && !e.target.closest('button,a,input,select')) o.onRow(o.rows.find(r => String(r[o.id || 'id']) === tr.dataset.id));
    });
    host.addEventListener('keydown', e => { if (e.key === 'Enter') { const tr = e.target.closest('tbody tr[data-id]'); if (tr && o.onRow) o.onRow(o.rows.find(r => String(r[o.id || 'id']) === tr.dataset.id)); } });
    render();
    return { render, set rows(v) { o.rows = v; render(); }, state: st, filtered: rows };
  }

  /* ---------- formulir ---------- */
  function field(o) {
    const id = 'f_' + o.name + (o.suffix || '');
    let input;
    const v = o.value === undefined || o.value === null ? '' : o.value;
    const req = o.required ? ' required' : '';
    if (o.type === 'select') input = `<select class="select" id="${id}" name="${attr(o.name)}"${req}>${o.options.map(op => { const val = op.v !== undefined ? op.v : op; return `<option value="${attr(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(op.l || op)}</option>`; }).join('')}</select>`;
    else if (o.type === 'textarea') input = `<textarea class="textarea" id="${id}" name="${attr(o.name)}" rows="${o.rows || 5}" placeholder="${attr(o.placeholder || '')}" maxlength="${o.max || 6000}"${req}>${esc(v)}</textarea>`;
    else if (o.type === 'switch') return `<label class="switch ${o.full ? 'full' : ''}"><input type="checkbox" id="${id}" name="${attr(o.name)}" ${v ? 'checked' : ''}><span class="tr"></span><span>${esc(o.label)}${o.hint ? `<br><span class="hint">${esc(o.hint)}</span>` : ''}</span></label>`;
    else input = `<input class="input" id="${id}" name="${attr(o.name)}" type="${o.type || 'text'}" value="${attr(v)}" placeholder="${attr(o.placeholder || '')}" ${o.min !== undefined ? `min="${o.min}"` : ''} ${o.maxv !== undefined ? `max="${o.maxv}"` : ''} ${o.step ? `step="${o.step}"` : ''} maxlength="${o.max || 300}" autocomplete="${o.autocomplete || 'off'}"${req}>`;
    return `<div class="field ${o.full ? 'full' : ''}"><label for="${id}">${esc(o.label)}${o.required ? ' <span class="req">*</span>' : ''}</label>${input}${o.hint ? `<span class="hint">${esc(o.hint)}</span>` : ''}</div>`;
  }
  function formData(form) {
    const o = {};
    $$('input[name],select[name],textarea[name]', form).forEach(el => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'number') o[el.name] = el.value === '' ? '' : Number(el.value);
      else if (el.type === 'datetime-local') o[el.name] = el.value ? new Date(el.value).getTime() : 0;
      else if (el.type !== 'file' && el.type !== 'radio') o[el.name] = el.value;
      else if (el.type === 'radio' && el.checked) o[el.name] = el.value;
    });
    return o;
  }
  const dtLocal = ms => { if (!ms) return ''; const d = new Date(ms); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  async function busy(btn, fn) {
    if (!btn || btn.disabled) return;
    btn.disabled = true; btn.classList.add('loading');
    try { return await fn(); }
    catch (e) { toast(e.message || 'Terjadi kesalahan.', 'err'); }
    finally { btn.disabled = false; btn.classList.remove('loading'); }
  }

  /* ---------- berkas ---------- */
  const readB64 = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Berkas tidak bisa dibaca.')); r.readAsDataURL(file); });
  async function resizeImage(file, size, type, q) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak bisa dibaca.')); i.src = url; });
      const s = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let out = c.toDataURL(type || 'image/webp', q || 0.85);
      if (!/^data:image\/webp/.test(out) && (type || 'image/webp') === 'image/webp') out = c.toDataURL('image/jpeg', q || 0.85);
      return out;
    } finally { URL.revokeObjectURL(url); }
  }
  /** Potong persegi lalu kecilkan; hasil dijaga di bawah ±44 ribu karakter (batas sel Sheets). */
  async function squareThumb(file, size) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak bisa dibaca.')); i.src = url; });
      let s = size, out = '';
      for (let step = 0; step < 6; step++) {
        const c = document.createElement('canvas'); c.width = c.height = s;
        const g = c.getContext('2d'), k = Math.min(img.width, img.height), sx = (img.width - k) / 2, sy = (img.height - k) / 2;
        g.drawImage(img, sx, sy, k, k, 0, 0, s, s);
        const q = 0.88 - step * 0.1;
        out = c.toDataURL('image/webp', q);
        if (!/^data:image\/webp/.test(out)) { g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); out = c.toDataURL('image/jpeg', q); }
        if (out.length < 44000) return out;
        if (step >= 2) s = Math.round(s * 0.8);
      }
      throw new Error('Gambar terlalu rumit untuk dijadikan logo. Coba gambar yang lebih sederhana.');
    } finally { URL.revokeObjectURL(url); }
  }
  function b64ToBlob(b64, mime) { const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime || 'application/octet-stream' }); }
  const fileCache = {};
  async function loadFile(kind, id) {
    const k = kind + ':' + id; if (fileCache[k]) return fileCache[k];
    const d = await API.get('file.get', { kind, id });
    const blob = b64ToBlob(d.b64, d.mime);
    return (fileCache[k] = { url: URL.createObjectURL(blob), mime: d.mime, name: d.name, blob });
  }
  function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name || 'berkas'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function csvDownload(rows, name) {
    const q = v => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
    saveBlob(new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), name);
  }
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    const sep = (text.split(/\r?\n/)[0].match(/;/g) || []).length > (text.split(/\r?\n/)[0].match(/,/g) || []).length ? ';' : ',';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.join('').trim() !== '').map(r => r.map(x => x.replace(/^﻿/, '').trim()));
  }
  function mediaHTML(f, o) {
    o = o || {};
    if (/^audio\//.test(f.mime) || /\.(mp3|m4a|wav)$/i.test(f.name)) return `<audio controls preload="metadata" src="${f.url}"></audio>`;
    if (/^video\//.test(f.mime) || /\.(mp4|webm)$/i.test(f.name)) return /\.webm$/i.test(f.name) && /audio/.test(f.mime) ? `<audio controls src="${f.url}"></audio>` : `<video controls preload="metadata" src="${f.url}"></video>`;
    if (/^image\//.test(f.mime)) return `<img src="${f.url}" alt="${attr(f.name)}">`;
    if (/pdf/.test(f.mime)) return `<iframe src="${f.url}" title="${attr(f.name)}"></iframe>`;
    return `<div class="row">${ic('file')}<span class="grow">${esc(f.name)}</span></div>`;
  }
  function linkEmbed(url) {
    const yt = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
    if (yt) return `<a class="btn btn-outline" href="${attr(url)}" target="_blank" rel="noopener">${ic('video')} Tonton di YouTube</a>`;
    return `<a class="btn btn-outline" href="${attr(url)}" target="_blank" rel="noopener">${ic('external')} Buka tautan</a>`;
  }

  /* ---------- efek hadiah ---------- */
  function confetti() {
    if (document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#2F5BFF', '#8B5CF6', '#F5B93A', '#10B981', '#FF5722'];
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
      c.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      c.style.animationDelay = (Math.random() * 0.25) + 's';
      box.appendChild(c);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 1900);
  }
  function badgeMedal(b, cls) { return `<span class="medal tone-${attr(b.tone || 'blue')} ${cls || ''}">${ic(b.icon || 'award')}</span>`; }
  /** Tampilkan hadiah dari respons server: {xp, total, level, levelName, leveledUp, badges[], streakBonus} */
  function reward(r, opt) {
    if (!r) return;
    if (window.App) App.applyReward(r);
    if (r.xp > 0 && !(opt && opt.quiet)) toast({ html: `<div class="reward-toast"><span class="bdg">${ic('zap', 'i-lg')}</span><div><b>+${fmt.n(r.xp)} XP</b><div class="xs" style="color:#AEBBDA">Total ${fmt.n(r.total)} XP${r.streakBonus ? ' · bonus streak +' + r.streakBonus : ''}</div></div>` }, 'ok', 3200);
    if (window.Leo && r.xp > 0 && !r.leveledUp) Leo.say(Leo.msg('xp', { xp: r.xp }), 'happy', 3600);
    (r.badges || []).forEach((b, i) => setTimeout(() => {
      toast({ html: `<div class="reward-toast"><span class="bdg"><span class="badge-tile earned" style="padding:0;border:0;background:none">${badgeMedal(b)}</span></span><div><b>Badge baru: ${esc(b.name)}</b><div class="xs" style="color:#AEBBDA">${esc(b.description || '')}</div></div>` }, 'ok', 5000);
      if (window.Leo) Leo.say(Leo.msg('badge', { badge: b.name }), 'celebrate', 4000);
      confetti();
    }, 900 + i * 1400));
    if (r.leveledUp) setTimeout(() => {
      confetti();
      if (window.Leo) Leo.react('celebrate');
      modal({ title: 'Naik level!', size: 'sm', body: `<div class="lvl-up"><div style="width:140px">${window.Leo ? Leo.svg('celebrate', true) : ''}</div><div class="big">Level ${r.level}</div><b class="h3">${esc(r.levelName)}</b><p class="muted">Congratulations! You’ve reached a new level. Total XP kamu sekarang ${fmt.n(r.total)}.</p></div>`,
        foot: '<button class="btn btn-block" data-close>Lanjut belajar</button>' });
    }, 500);
  }

  async function copyText(t, btn) {
    try { await navigator.clipboard.writeText(t); toast('Disalin.'); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Disalin.'); } catch (x) { toast('Salin manual: ' + t, 'warn'); } ta.remove(); }
  }
  function speak(text) {
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }
    catch (e) { toast('Perangkat ini tidak mendukung suara.', 'warn'); }
  }

  window.UI = { $, $$, esc, attr, fmt, L, SKILL, SKILLS6, toneIc, toneBar, pill, xpChip, skillChip, avatar, bar, metric, toast, modal, confirmBox, drawer, skel, empty, errBox,
    md, chart, table, field, formData, dtLocal, busy, readB64, resizeImage, squareThumb, loadFile, saveBlob, csvDownload, parseCSV, mediaHTML, linkEmbed, reward, confetti, badgeMedal, copyText, speak, b64ToBlob };
})();
