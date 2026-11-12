/* Halaman Pembina (mentor) — juga dapat dibuka Admin. */
(function () {
  'use strict';
  const { esc, attr, fmt, toast, L, SKILL } = UI;
  const S = API.Session;
  const R = Pages.route, STAFF = ['mentor', 'admin'];
  R('/m/home', 'mHome', STAFF); R('/m/members', 'mMembers', STAFF); R('/m/member/:id', 'mMember', STAFF, '#/m/members');
  R('/m/materials', 'mMaterials', STAFF); R('/m/challenges', 'mChallenges', STAFF); R('/m/quiz', 'mQuiz', STAFF);
  R('/m/review', 'mReview', STAFF); R('/m/review/:id', 'mReviewOne', STAFF, '#/m/review'); R('/m/xp', 'mXp', STAFF);
  R('/m/announcements', 'mAnn', STAFF); R('/m/reports', 'mReports', STAFF);

  const KAT = ['Speaking', 'Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar', 'Pronunciation', 'Idiom'];
  const DIFF = ['Beginner', 'Intermediate', 'Advanced'];
  const fail = (v, e) => { v.innerHTML = UI.errBox(e.message, true); const b = v.querySelector('[data-retry]'); if (b) b.onclick = () => App.route(); };
  const head = (title, sub, tools) => `<div class="view-h"><div><h2 class="h1">${esc(title)}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="row no-print">${tools || ''}</div></div>`;
  const actBtns = (id, extra) => `<div class="row-sm end" style="flex-wrap:nowrap">${extra || ''}<button class="icon-btn" data-edit="${attr(id)}" aria-label="Ubah">${ic('edit', 'i-sm')}</button><button class="icon-btn" data-del="${attr(id)}" aria-label="Hapus">${ic('trash', 'i-sm')}</button></div>`;
  const person = (name, sub, photo) => `<div class="person">${UI.avatar(name, photo, 'av-sm')}<div style="min-width:0"><div class="nm">${esc(name)}</div>${sub ? `<div class="sb">${sub}</div>` : ''}</div></div>`;
  async function delFlow(btn, what, action, id, after) {
    const ok = await UI.confirmBox({ title: 'Hapus ' + what + '?', text: 'Tindakan ini tidak bisa dibatalkan.', ok: 'Hapus', danger: true });
    if (!ok) return;
    try { const r = await API.act(action, { id }); toast(r.message); after(); } catch (e) { toast(e.message, 'err'); }
  }

  /* ============================== DASHBOARD PEMBINA ============================== */
  Pages.mHome = async function (v, p, ctx) {
    App.setTitle('Dashboard Pembina', [['Kegiatan klub']]);
    v.innerHTML = `<div class="grid g-4">${UI.skel(4, 110)}</div><div class="grid g-3">${UI.skel(3, 240)}</div>`;
    Leo.setHint('Periksa tugas yang paling lama menunggu terlebih dahulu.');
    try {
      await API.swr('m.dashboard', {}, d => {
        if (!ctx.alive()) return;
        App.setBadge('review', d.kpi.pending);
        const k = d.kpi;
        v.innerHTML = `${head('Halo, ' + fmt.first(S.me.name), 'Ringkasan kegiatan English Club hari ini.', `<a class="btn btn-outline" href="#/m/announcements">${ic('megaphone', 'i-sm')} Pengumuman</a><a class="btn" href="#/m/challenges">${ic('plus', 'i-sm')} Tantangan baru</a>`)}
          <div class="grid g-4 kpis">
            ${UI.metric({ icon: 'users', tone: 'ic-blue', label: 'Anggota aktif', value: `${k.active}<span class="h3 muted"> / ${k.total}</span>`, sub: `${k.activeToday} siswa beraktivitas hari ini` })}
            <a class="card hover" href="#/m/review" style="color:inherit;text-decoration:none;${k.pending ? 'border-color:var(--primary)' : ''}"><div class="metric"><div class="mtop"><span class="ic ic-purple">${ic('inbox')}</span><span class="lbl">Tugas menunggu penilaian</span>${k.pending ? '<span class="chip chip-purple" style="margin-left:auto">Perlu tindakan</span>' : ''}</div><div class="stat-xl">${k.pending}</div><div class="sub">Buka antrean pemeriksaan ${ic('arrowr', 'i-sm')}</div></div></a>
            ${UI.metric({ icon: 'target', tone: 'ic-gold', label: 'Rata-rata skor kuis', value: k.quizAvg, sub: `${k.quizCount} percobaan dalam 30 hari` })}
            ${UI.metric({ icon: 'flag', tone: 'ic-green', label: 'Penyelesaian tantangan', value: k.completion + '%', sub: `${k.completionDone} dari ${k.completionExpected} target (30 hari)` })}
          </div>
          <div class="grid g-3">
            <div class="card"><div class="card-h"><div><h3 class="h3">Partisipasi harian</h3><p class="xs muted">Siswa yang mendapat XP, 14 hari terakhir</p></div></div>${UI.chart.line(d.series.map(s => ({ v: s.active, l: fmt.ymd(s.d) })), { label: 'Siswa aktif per hari', min: 5, ticks: 5 })}</div>
            <div class="card"><div class="card-h"><div><h3 class="h3">Sebaran level</h3><p class="xs muted">Jumlah siswa per level</p></div></div>${d.levels.length ? UI.chart.bars(d.levels.map(l => ({ v: l.count, l: 'Lv ' + l.level, c: 'var(--purple)' })), { label: 'Sebaran level' }) : '<p class="muted small">Belum ada siswa.</p>'}</div>
            <div class="card"><div class="card-h"><div><h3 class="h3">Rata-rata 6 keterampilan</h3><p class="xs muted">Seluruh siswa aktif</p></div></div>${UI.chart.radar(UI.SKILLS6.map(s => d.skills[s] || 0), UI.SKILLS6, { max: 300 })}</div>
          </div>
          <div class="split"><div class="card pad-0"><div class="card-h" style="padding:18px 18px 0"><h3 class="h3">${ic('inbox')} Tugas menunggu penilaian</h3><a class="small" href="#/m/review">Lihat semua</a></div>
            ${d.pending.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Siswa</th><th>Tantangan</th><th>Dikirim</th><th></th></tr></thead><tbody>${d.pending.map(s => `<tr><td>${person(s.student, esc(s.class))}</td><td><div class="small" style="font-weight:600">${esc(s.challenge)}</div><div class="xs muted">${esc(s.skill)} · ${s.kind === 'audio' ? 'Audio' : s.kind === 'video' ? 'Video' : s.kind === 'link' ? 'Tautan' : s.kind === 'text' ? 'Tulisan' : 'Berkas'}</div></td><td class="small ${Date.now() - s.at > 2 * 864e5 ? 'muted' : ''}">${fmt.ago(s.at)}</td><td><a class="btn btn-sm" href="#/m/review/${attr(s.id)}">Nilai</a></td></tr>`).join('')}</tbody></table></div>` : `<div style="padding:0 18px 18px">${UI.empty({ title: 'Semua tugas sudah dinilai', expr: 'happy' })}</div>`}</div>
            <div class="stack">
              <div class="card"><div class="card-h"><h3 class="h3">${ic('trend')} Paling aktif 7 hari</h3></div>${d.topActive.length ? `<div class="stack-sm">${d.topActive.map((t, i) => `<a class="lb-row top${i + 1}" href="#/m/member/${attr(t.id)}" style="color:inherit;text-decoration:none"><span class="rank r${i + 1}">${i + 1}</span><div class="grow small" style="font-weight:600">${esc(t.name)} <span class="xs muted">${esc(t.class)}</span></div><span class="xp">${fmt.n(t.xp)} XP</span></a>`).join('')}</div>` : '<p class="muted small">Belum ada aktivitas minggu ini.</p>'}</div>
              <div class="card"><div class="card-h"><h3 class="h3">${ic('alert')} Perlu pendampingan</h3><span class="chip chip-orange">${d.support.length}</span></div>${d.support.length ? `<div class="stack-sm">${d.support.map(s => `<a class="row between" href="#/m/member/${attr(s.id)}" style="color:inherit;text-decoration:none;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:nowrap"><div style="min-width:0"><div class="small" style="font-weight:600">${esc(s.name)} <span class="xs muted">${esc(s.class)}</span></div><div class="xs muted">${esc(s.reason)}</div></div>${ic('chevr', 'i-sm')}</a>`).join('')}</div>` : '<p class="muted small">Semua anggota aktif belajar.</p>'}</div>
            </div></div>
          <div class="card dashed row" style="flex-wrap:nowrap"><span class="ic ic-slate">${ic('calendar')}</span><div class="grow"><b class="small">Absensi pertemuan</b><p class="xs muted">Pencatatan kehadiran Hadir/Izin/Sakit/Alfa hadir di Fase 2.</p></div><span class="chip">Segera hadir</span></div>`;
      }, 30000);
    } catch (e) { fail(v, e); }
  };

  /* ============================== ANGGOTA ============================== */
  Pages.mMembers = async function (v, p, ctx) {
    App.setTitle('Anggota', [['Kegiatan klub']]);
    v.innerHTML = UI.skel(1, 400);
    try {
      const rows = await API.get('m.members', {});
      if (!ctx.alive()) return;
      const classes = [...new Set(rows.map(r => r.class).filter(Boolean))].sort();
      v.innerHTML = head('Anggota English Club', `${rows.filter(r => r.status === 'active').length} anggota aktif dari ${rows.length} terdaftar.`, S.me.role === 'admin' ? `<a class="btn" href="#/a/users">${ic('userplus', 'i-sm')} Kelola akun</a>` : '') + '<div id="t"></div>';
      UI.table(v.querySelector('#t'), {
        rows, search: ['name', 'username', 'class'], placeholder: 'Cari nama, username, atau kelas',
        filters: [{ key: 'class', label: 'Kelas', options: classes }, { key: 'status', label: 'Status', options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Nonaktif' }] }],
        sort: 'name',
        columns: [
          { key: 'name', label: 'Anggota', render: r => person(r.name, '@' + esc(r.username)) },
          { key: 'class', label: 'Kelas' },
          { key: 'xp', label: 'Level / XP', render: r => `<div class="small"><b>Lv ${r.level}</b> · <span class="num">${fmt.n(r.xp)}</span> XP</div><div class="xs muted">${esc(r.levelName)}</div>` },
          { key: 'streak', label: 'Streak', render: r => r.streak ? `<span class="chip streak-chip">${ic('flame')} ${r.streak}</span>` : '<span class="faint">0</span>' },
          { key: 'materials', label: 'Materi', cls: 'num' },
          { key: 'quizAvg', label: 'Kuis', render: r => r.quizzes ? `${r.quizAvg} <span class="xs muted">(${r.quizzes}×)</span>` : '<span class="faint">-</span>' },
          { key: 'challenges', label: 'Tantangan', render: r => `${r.challenges}${r.pending ? ` <span class="chip chip-purple">${r.pending} menunggu</span>` : ''}` },
          { key: 'last_active', label: 'Aktif terakhir', render: r => r.last_active ? fmt.ymd(r.last_active) : '<span class="faint">Belum</span>' },
          { key: 'status', label: 'Status', render: r => UI.pill(r.status) }
        ],
        onRow: r => App.go('#/m/member/' + r.id)
      });
    } catch (e) { fail(v, e); }
  };

  Pages.mMember = async function (v, p, ctx) {
    v.innerHTML = UI.skel(2, 220);
    let d, tab = 'progress';
    try { d = await API.get('m.member', { id: p[0] }); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const m = d.member;
    App.setTitle(m.name, [['Anggota', '#/m/members'], [m.name]]);
    const paint = () => {
      const tabs = { progress: 'Progres', quiz: `Kuis (${d.quizzes.length})`, subs: `Tugas (${d.submissions.length})`, badges: `Badge (${d.badges.length})`, xp: 'Riwayat XP' };
      let body = '';
      if (tab === 'progress') body = `<div class="grid g-2"><div class="card"><h3 class="h3">Kemampuan</h3>${UI.chart.radar(UI.SKILLS6.map(s => d.skills[s] || 0), UI.SKILLS6)}</div><div class="card"><h3 class="h3">XP 30 hari</h3>${UI.chart.line(d.series.map(s => ({ v: s.xp, l: fmt.ymd(s.d) })), { ticks: 6 })}</div></div>`;
      if (tab === 'quiz') body = d.quizzes.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Kuis</th><th>Skor</th><th>Benar</th><th>Durasi</th><th>XP</th><th>Waktu</th></tr></thead><tbody>${d.quizzes.map(q => `<tr><td>${esc(q.quiz)}</td><td><b class="num">${q.score}</b></td><td>${q.correct}/${q.total}</td><td>${fmt.dur(q.duration)}</td><td>${q.xp}</td><td class="small muted">${fmt.dt(q.at)}</td></tr>`).join('')}</tbody></table></div>` : UI.empty({ title: 'Belum mengerjakan kuis' });
      if (tab === 'subs') body = d.submissions.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Tantangan</th><th>Status</th><th>Nilai</th><th>XP</th><th>Dikirim</th><th></th></tr></thead><tbody>${d.submissions.map(s => `<tr><td>${esc(s.challenge)}${s.feedback ? `<div class="xs muted clamp-2">${esc(s.feedback)}</div>` : ''}</td><td>${UI.pill(s.status)}</td><td class="num">${s.status === 'submitted' ? '-' : s.score}</td><td>${s.xp || '-'}</td><td class="small muted">${fmt.dt(s.at)}</td><td><a class="btn btn-sm btn-outline" href="#/m/review/${attr(s.id)}">Buka</a></td></tr>`).join('')}</tbody></table></div>` : UI.empty({ title: 'Belum ada tugas' });
      if (tab === 'badges') body = d.badges.length ? `<div class="grid g-5">${d.badges.map(b => `<div class="badge-tile earned">${UI.badgeMedal(b)}<b>${esc(b.name)}</b><small>${fmt.date(b.at)}</small></div>`).join('')}</div>` : UI.empty({ title: 'Belum ada badge' });
      if (tab === 'xp') body = d.xplog.length ? `<div class="card pad-0">${d.xplog.map(x => `<div class="row between" style="padding:10px 16px;border-bottom:1px solid var(--border);flex-wrap:nowrap"><div style="min-width:0"><div class="small">${esc(x.reason)}</div><div class="xs muted">${esc(x.source)} · ${fmt.dt(x.at)}</div></div><b class="num" style="color:${x.amount >= 0 ? 'var(--success-ink)' : 'var(--danger-ink)'}">${x.amount > 0 ? '+' : ''}${x.amount}</b></div>`).join('')}</div>` : UI.empty({ title: 'Belum ada riwayat XP' });
      v.innerHTML = `<div class="card row" style="gap:18px">${UI.avatar(m.name, m.photo, 'av-lg')}
          <div class="stack-sm grow"><h2 class="h1">${esc(m.name)}</h2><div class="row-sm"><span class="chip">@${esc(m.username)}</span>${m.class ? `<span class="chip chip-blue">${esc(m.class)}</span>` : ''}${UI.pill(m.status)}${m.wa ? `<span class="chip">${ic('phone')} ${esc(m.wa)}</span>` : ''}</div></div>
          <div class="row" style="gap:20px"><div class="center"><div class="stat-lg">${fmt.n(m.xp)}</div><div class="xs muted">XP · Lv ${m.level}</div></div><div class="center"><div class="stat-lg">${m.streak}</div><div class="xs muted">streak</div></div><div class="center"><div class="stat-lg">${m.challenges}</div><div class="xs muted">tantangan</div></div></div>
          <div class="row-sm"><button class="btn btn-outline btn-sm" id="axp">${ic('zap', 'i-sm')} Sesuaikan XP</button><button class="btn btn-sm" id="abd">${ic('award', 'i-sm')} Beri badge</button></div></div>
        <div class="tabs" role="tablist" style="width:max-content;max-width:100%">${Object.keys(tabs).map(k => `<button role="tab" data-t="${k}" aria-selected="${k === tab}">${tabs[k]}</button>`).join('')}</div>${body}`;
      v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; paint(); });
      v.querySelector('#axp').onclick = () => xpModal(m, () => App.route());
      v.querySelector('#abd').onclick = () => badgeModal(m, () => App.route());
    };
    paint();
  };
  function xpModal(m, done) {
    const md = UI.modal({ title: 'Sesuaikan XP', sub: m.name, size: 'sm', body: `<div class="chips-f">${[10, 25, 50, 100, -10, -25].map(x => `<button type="button" data-x="${x}" aria-pressed="false">${x > 0 ? '+' : ''}${x}</button>`).join('')}</div>
      ${UI.field({ name: 'amount', type: 'number', label: 'Jumlah XP', hint: 'Gunakan angka negatif untuk mengurangi.', value: 25 })}${UI.field({ name: 'reason', label: 'Alasan', required: true, placeholder: 'Contoh: aktif bertanya di sesi debat' })}`,
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Terapkan</button>' });
    md.el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { md.el.querySelector('[name=amount]').value = b.dataset.x; });
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const f = UI.formData(md.body); const r = await API.act('m.xp.adjust', { userId: m.id, amount: f.amount, reason: f.reason }); toast(r.message); md.close(); done && done(); });
  }
  async function badgeModal(m, done) {
    const badges = (await API.get('m.badges', {})).filter(b => b.active);
    const md = UI.modal({ title: 'Beri badge', sub: m.name, size: 'sm', body: `${UI.field({ name: 'badgeId', type: 'select', label: 'Badge', options: badges.map(b => ({ v: b.id, l: b.name + (b.criteria === 'manual' ? ' (manual)' : '') })), value: (badges.find(b => b.criteria === 'manual') || {}).id })}${UI.field({ name: 'note', label: 'Catatan untuk siswa (opsional)', placeholder: 'Contoh: semangat luar biasa di lomba debat' })}`,
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Berikan badge</button>' });
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const f = UI.formData(md.body); const r = await API.act('m.badge.award', { userId: m.id, badgeId: f.badgeId, note: f.note }); toast(r.message); md.close(); done && done(); });
  }

  /* ============================== MATERI ============================== */
  Pages.mMaterials = async function (v, p, ctx) {
    App.setTitle('Materi', [['Pembelajaran']]);
    v.innerHTML = UI.skel(1, 400);
    let rows;
    const reload = async () => { rows = await API.get('m.materials', {}); if (!ctx.alive()) return; tbl.rows = rows; };
    try { rows = await API.get('m.materials', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    v.innerHTML = head('Materi pembelajaran', 'Materi terbit tampil di English Skill Zone. Centang “Tampilkan di Digital Library” agar muncul di perpustakaan.', `<button class="btn" id="add">${ic('plus', 'i-sm')} Tambah materi</button>`) + '<div id="t"></div>';
    const tbl = UI.table(v.querySelector('#t'), {
      rows, search: ['title', 'summary'], placeholder: 'Cari judul materi',
      filters: [{ key: 'skill', label: 'Kategori', options: KAT }, { key: 'status', label: 'Status', options: [{ v: 'published', l: 'Terbit' }, { v: 'draft', l: 'Draf' }] }],
      columns: [
        { key: 'title', label: 'Judul', render: r => `<div class="small" style="font-weight:600">${esc(r.title)}</div><div class="xs muted clamp-2">${esc(r.summary)}</div>` },
        { key: 'skill', label: 'Kategori', render: r => UI.skillChip(r.skill) },
        { key: 'difficulty', label: 'Level' },
        { key: 'type', label: 'Tipe', render: r => `<span class="row-sm small">${ic(({ audio: 'music', video: 'video', file: 'file', link: 'link' })[r.type] || 'filetext', 'i-sm')} ${r.in_library ? '<span class="chip chip-blue" title="Ada di Digital Library">Library</span>' : ''}</span>` },
        { key: 'completions', label: 'Selesai', cls: 'num' },
        { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
        { label: '', render: r => actBtns(r.id, `<a class="icon-btn" href="#/material/${attr(r.id)}" aria-label="Pratinjau">${ic('eye', 'i-sm')}</a>`), sort: false }
      ]
    });
    v.querySelector('#add').onclick = () => matForm(null, reload);
    v.addEventListener('click', async e => {
      const ed = e.target.closest('[data-edit]'); if (ed) { const full = await API.get('m.material.get', { id: ed.dataset.edit }); matForm(full, reload); }
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'materi', 'm.material.delete', dl.dataset.del, reload);
    });
  };
  function matForm(m, done) {
    m = m || { skill: 'Speaking', difficulty: 'Beginner', type: 'text', status: 'draft', in_library: true, xp: 10, sort: 0 };
    let file = null;
    const md = UI.modal({ title: m.id ? 'Ubah materi' : 'Materi baru', size: 'lg', sticky: true, body: `<form class="form-grid" id="mf">
      ${UI.field({ name: 'title', label: 'Judul', required: true, value: m.title, full: true, max: 160 })}
      ${UI.field({ name: 'skill', type: 'select', label: 'Kategori keterampilan', options: KAT, value: m.skill })}
      ${UI.field({ name: 'difficulty', type: 'select', label: 'Tingkat', options: DIFF, value: m.difficulty })}
      ${UI.field({ name: 'type', type: 'select', label: 'Jenis konten', options: [{ v: 'text', l: 'Bacaan (teks)' }, { v: 'audio', l: 'Audio' }, { v: 'video', l: 'Video' }, { v: 'file', l: 'Dokumen (PDF, DOCX, PPTX)' }, { v: 'link', l: 'Tautan luar' }], value: m.type })}
      ${UI.field({ name: 'xp', type: 'number', label: 'XP saat selesai', value: m.xp, min: 0, maxv: 500 })}
      ${UI.field({ name: 'summary', label: 'Ringkasan singkat', value: m.summary, full: true, max: 400 })}
      <div class="field full"><div class="row between"><label for="f_body">Isi materi</label><div class="tabs" style="padding:2px"><button type="button" data-pv="0" aria-selected="true">Tulis</button><button type="button" data-pv="1" aria-selected="false">Pratinjau</button></div></div>
        <textarea class="textarea" id="f_body" name="body" rows="12" maxlength="45000" placeholder="## Judul bagian&#10;Tulis penjelasan…&#10;- poin pertama&#10;- **tebal** dan *miring*">${esc(m.body || '')}</textarea><div class="card tint prose" id="bpv" hidden></div>
        <span class="hint">Format sederhana: ## judul, - daftar, 1. langkah, **tebal**, *miring*, [teks](https://tautan).</span></div>
      ${UI.field({ name: 'url', type: 'url', label: 'Tautan (YouTube, Google Drive, situs)', value: m.url, full: true, placeholder: 'https://…', hint: 'Disarankan untuk video berukuran besar.' })}
      <div class="field full"><span class="lbl-f">Berkas (audio, video, PDF, DOCX, PPTX, gambar)</span>
        ${m.has_file ? `<div class="row-sm small" id="curf">${ic('file', 'i-sm')} ${esc(m.file_name)} <span class="muted">${fmt.size(m.file_size)}</span><label class="check" style="margin-left:auto"><input type="checkbox" name="removeFile"> Hapus berkas</label></div>` : ''}
        <label class="drop"><input type="file" id="mfi">${ic('cloud')}<span class="small"><b>Pilih berkas</b> untuk ${m.has_file ? 'mengganti' : 'diunggah'}</span><span class="xs muted" id="mfn">Maksimal sesuai batas unggah di pengaturan (bawaan 10 MB)</span></label></div>
      ${UI.field({ name: 'sort', type: 'number', label: 'Urutan tampil', value: m.sort, min: 0 })}
      ${UI.field({ name: 'status', type: 'select', label: 'Status', options: [{ v: 'draft', l: 'Draf (belum terlihat siswa)' }, { v: 'published', l: 'Terbit' }], value: m.status })}
      ${UI.field({ name: 'in_library', type: 'switch', label: 'Tampilkan di Digital Library', value: m.in_library, full: true })}
    </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan materi</button>' });
    const f = md.el.querySelector('#mf');
    md.el.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { const pv = b.dataset.pv === '1'; md.el.querySelectorAll('[data-pv]').forEach(x => x.setAttribute('aria-selected', String(x === b))); f.querySelector('#f_body').hidden = pv; const box = f.querySelector('#bpv'); box.hidden = !pv; if (pv) box.innerHTML = UI.md(f.querySelector('#f_body').value) || '<p class="muted">Belum ada isi.</p>'; });
    f.querySelector('#mfi').onchange = e => { file = e.target.files[0] || null; f.querySelector('#mfn').textContent = file ? file.name + ' · ' + fmt.size(file.size) : ''; };
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f); if (m.id) d.id = m.id;
      if (file) d.file = { name: file.name, mime: file.type, b64: await UI.readB64(file) };
      const r = await API.act('m.material.save', d, { timeout: 180000 }); toast(r.message); md.close(); done();
    });
  }

  /* ============================== TANTANGAN ============================== */
  Pages.mChallenges = async function (v, p, ctx) {
    App.setTitle('Tantangan', [['Pembelajaran']]);
    v.innerHTML = UI.skel(1, 400);
    let rows, quizzes;
    try { [rows, quizzes] = await Promise.all([API.get('m.challenges', {}), API.get('m.quizzes', {})]); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const reload = async () => { rows = await API.get('m.challenges', {}); tbl.rows = rows; };
    v.innerHTML = head('Tantangan & misi', 'Saat tantangan diterbitkan, semua siswa aktif mendapat notifikasi.', `<button class="btn" id="add">${ic('plus', 'i-sm')} Tantangan baru</button>`) + '<div id="t"></div>';
    const tbl = UI.table(v.querySelector('#t'), {
      rows, search: ['title', 'description'], placeholder: 'Cari tantangan',
      filters: [{ key: 'type', label: 'Jenis', options: Object.keys(L.type).map(k => ({ v: k, l: L.type[k] })) }, { key: 'status', label: 'Status', options: [{ v: 'published', l: 'Terbit' }, { v: 'draft', l: 'Draf' }] }],
      columns: [
        { key: 'title', label: 'Tantangan', render: r => `<div class="small" style="font-weight:600">${esc(r.title)}</div><div class="xs muted">${esc(L.type[r.type])} · ${esc(r.skill)} · ${esc(L.sub[r.sub_type] || '')}</div>` },
        { key: 'deadline', label: 'Batas waktu', render: r => r.deadline ? `<div class="small">${fmt.dt(r.deadline)}</div><div class="xs ${r.deadline < Date.now() ? 'muted' : ''}">${fmt.left(r.deadline)}</div>` : '<span class="faint">-</span>' },
        { key: 'xp', label: 'XP', cls: 'num' },
        { key: 'completed', label: 'Selesai', render: r => `<div class="small"><b>${r.completed}</b>/${r.students}${r.pending ? ` · <span class="chip chip-purple">${r.pending} menunggu</span>` : ''}</div>${UI.bar(r.students ? r.completed / r.students * 100 : 0, 'thin green')}` },
        { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
        { label: '', sort: false, render: r => actBtns(r.id, `<button class="icon-btn" data-part="${attr(r.id)}" aria-label="Peserta">${ic('users', 'i-sm')}</button>`) }
      ]
    });
    v.querySelector('#add').onclick = () => chForm(null, quizzes, reload);
    v.addEventListener('click', e => {
      const ed = e.target.closest('[data-edit]'); if (ed) chForm(rows.find(r => r.id === ed.dataset.edit), quizzes, reload);
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'tantangan', 'm.challenge.delete', dl.dataset.del, reload);
      const pt = e.target.closest('[data-part]'); if (pt) participants(rows.find(r => r.id === pt.dataset.part));
    });
  };
  async function participants(c) {
    const dr = UI.drawer({ title: c.title, sub: 'Peserta tantangan', body: UI.skel(4, 40) });
    try {
      const list = await API.get('m.challenge.participants', { id: c.id });
      const cnt = s => list.filter(x => x.status === s).length;
      dr.body.innerHTML = `<div class="row-sm"><span class="chip chip-green">${cnt('completed')} selesai</span><span class="chip chip-purple">${cnt('submitted') + cnt('reviewed')} menunggu</span><span class="chip pill-revision">${cnt('revision')} revisi</span><span class="chip">${cnt('none')} belum</span></div>
        <div class="stack-sm">${list.map(x => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:nowrap"><div style="min-width:0"><div class="small" style="font-weight:600">${esc(x.name)}</div><div class="xs muted">${esc(x.class)}${x.at ? ' · ' + fmt.ago(x.at) : ''}</div></div><div class="row-sm" style="flex-wrap:nowrap">${x.status !== 'none' && x.status !== 'submitted' ? `<b class="num small">${x.score}</b>` : ''}${UI.pill(x.status)}${x.submission ? `<a class="icon-btn" href="#/m/review/${attr(x.submission)}" aria-label="Buka tugas">${ic('chevr', 'i-sm')}</a>` : ''}</div></div>`).join('')}</div>`;
    } catch (e) { dr.body.innerHTML = UI.errBox(e.message); }
  }
  function chForm(c, quizzes, done) {
    c = c || { type: 'daily', skill: 'Speaking', difficulty: 'Beginner', xp: 40, sub_type: 'file_or_link', status: 'draft', rubric: [{ name: 'Isi & ketepatan tugas', max: 25 }, { name: 'Kelancaran', max: 25 }, { name: 'Kosakata', max: 25 }, { name: 'Tata bahasa & pengucapan', max: 25 }],
      start_at: Date.now(), deadline: (() => { const d = new Date(); d.setHours(23, 59, 0, 0); return d.getTime(); })() };
    let rubric = (c.rubric || []).map(r => Object.assign({}, r));
    const md = UI.modal({ title: c.id ? 'Ubah tantangan' : 'Tantangan baru', size: 'lg', sticky: true, body: `<form class="form-grid" id="cf">
      ${UI.field({ name: 'type', type: 'select', label: 'Jenis', options: Object.keys(L.type).map(k => ({ v: k, l: L.type[k] })), value: c.type })}
      ${UI.field({ name: 'skill', type: 'select', label: 'Keterampilan', options: UI.SKILLS6, value: c.skill })}
      ${UI.field({ name: 'title', label: 'Judul', required: true, value: c.title, full: true, max: 160 })}
      ${UI.field({ name: 'description', label: 'Deskripsi singkat', value: c.description, full: true, max: 400 })}
      ${UI.field({ name: 'instructions', type: 'textarea', label: 'Instruksi pengerjaan', value: c.instructions, full: true, rows: 6, hint: 'Boleh memakai format: - daftar, **tebal**.' })}
      ${UI.field({ name: 'difficulty', type: 'select', label: 'Tingkat', options: DIFF, value: c.difficulty })}
      ${UI.field({ name: 'xp', type: 'number', label: 'XP hadiah', value: c.xp, min: 0, maxv: 1000 })}
      ${UI.field({ name: 'start_at', type: 'datetime-local', label: 'Mulai', value: UI.dtLocal(c.start_at) })}
      ${UI.field({ name: 'deadline', type: 'datetime-local', label: 'Batas waktu', value: UI.dtLocal(c.deadline) })}
      ${UI.field({ name: 'sub_type', type: 'select', label: 'Cara pengumpulan', options: [{ v: 'file_or_link', l: 'Rekaman / berkas / tautan' }, { v: 'text', l: 'Jawaban tulisan' }, { v: 'quiz', l: 'Selesaikan kuis (otomatis)' }], value: c.sub_type })}
      <div id="qsel">${UI.field({ name: 'quiz_id', type: 'select', label: 'Kuis yang dipakai', options: [{ v: '', l: '— pilih kuis —' }].concat(quizzes.map(q => ({ v: q.id, l: q.title + (q.status !== 'published' ? ' (draf)' : '') }))), value: c.quiz_id })}</div>
      <div class="field full" id="rubw"><div class="row between"><span class="lbl-f">Rubrik penilaian</span><span class="xs muted" id="rsum"></span></div><div class="stack-sm" id="rub"></div><button type="button" class="btn btn-ghost btn-sm" id="radd" style="justify-self:start">${ic('plus', 'i-sm')} Tambah kriteria</button></div>
      ${UI.field({ name: 'status', type: 'select', label: 'Status', options: [{ v: 'draft', l: 'Draf' }, { v: 'published', l: 'Terbitkan & beri tahu siswa' }], value: c.status, full: true })}
    </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
    const f = md.el.querySelector('#cf');
    const drawRub = () => {
      f.querySelector('#rub').innerHTML = rubric.map((r, i) => `<div class="row-sm" style="flex-wrap:nowrap"><input class="input" data-rn="${i}" value="${attr(r.name)}" aria-label="Nama kriteria" maxlength="60"><input class="input" type="number" data-rm="${i}" value="${r.max}" min="1" max="100" style="width:90px" aria-label="Poin maksimal"><button type="button" class="icon-btn" data-rx="${i}" aria-label="Hapus kriteria">${ic('x', 'i-sm')}</button></div>`).join('');
      f.querySelector('#rsum').textContent = 'Total ' + rubric.reduce((a, r) => a + (+r.max || 0), 0) + ' poin (nilai akhir dikonversi ke 0–100)';
    };
    const toggle = () => { const q = f.querySelector('[name=sub_type]').value === 'quiz'; f.querySelector('#qsel').hidden = !q; f.querySelector('#rubw').hidden = q; };
    drawRub(); toggle();
    f.querySelector('[name=sub_type]').onchange = toggle;
    f.addEventListener('input', e => { if (e.target.dataset.rn) rubric[+e.target.dataset.rn].name = e.target.value; if (e.target.dataset.rm) { rubric[+e.target.dataset.rm].max = +e.target.value; f.querySelector('#rsum').textContent = 'Total ' + rubric.reduce((a, r) => a + (+r.max || 0), 0) + ' poin (nilai akhir dikonversi ke 0–100)'; } });
    f.addEventListener('click', e => { const x = e.target.closest('[data-rx]'); if (x) { rubric.splice(+x.dataset.rx, 1); drawRub(); } });
    f.querySelector('#radd').onclick = () => { if (rubric.length < 8) { rubric.push({ name: '', max: 25 }); drawRub(); } };
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f); delete d[''];
      Object.keys(d).forEach(k => { if (/^\d+$/.test(k)) delete d[k]; });
      d.rubric = rubric.filter(r => r.name.trim()); if (c.id) d.id = c.id;
      const r = await API.act('m.challenge.save', d); toast(r.message); md.close(); done();
    });
  }

  /* ============================== QUIZ BUILDER ============================== */
  Pages.mQuiz = async function (v, p, ctx) {
    App.setTitle('Quiz Builder', [['Pembelajaran']]);
    let tab = API.store.get('ech_qtab') || 'quiz';
    const paint = async () => {
      API.store.set('ech_qtab', tab);
      v.innerHTML = `${head('Quiz Builder', 'Susun bank soal, rakit kuis, dan kelola Word of the Day.', '')}
        <div class="tabs" role="tablist" style="width:max-content;max-width:100%">${[['quiz', 'Kuis'], ['bank', 'Bank soal'], ['vocab', 'Word of the Day']].map(t => `<button role="tab" data-t="${t[0]}" aria-selected="${t[0] === tab}">${t[1]}</button>`).join('')}</div><div id="qb">${UI.skel(1, 300)}</div>`;
      v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; paint(); });
      const box = v.querySelector('#qb');
      try { if (tab === 'quiz') await quizTab(box, ctx); else if (tab === 'bank') await bankTab(box, ctx); else await vocabTab(box, ctx); } catch (e) { box.innerHTML = UI.errBox(e.message); }
    };
    paint();
  };
  async function quizTab(box, ctx) {
    let [rows, bank] = await Promise.all([API.get('m.quizzes', {}), API.get('m.questions', {})]);
    if (!ctx.alive()) return;
    const reload = async () => { rows = await API.get('m.quizzes', {}); tbl.rows = rows; };
    box.innerHTML = `<div class="row end" style="margin-bottom:12px"><button class="btn" id="qadd">${ic('plus', 'i-sm')} Kuis baru</button></div><div id="qt"></div>`;
    const tbl = UI.table(box.querySelector('#qt'), { rows, search: ['title'], placeholder: 'Cari kuis',
      columns: [
        { key: 'title', label: 'Kuis', render: r => `<div class="small" style="font-weight:600">${esc(r.title)}</div><div class="xs muted">${esc(r.category)}</div>` },
        { key: 'questions', label: 'Soal', cls: 'num' },
        { key: 'time_limit', label: 'Waktu', render: r => r.time_limit ? r.time_limit + ' mnt' : 'Bebas' },
        { key: 'attempts', label: 'Kesempatan', render: r => r.attempts || '∞' },
        { key: 'xp', label: 'XP', cls: 'num' },
        { key: 'players', label: 'Dikerjakan', render: r => r.players ? `${r.players} siswa · rata-rata <b>${r.avg}</b>` : '<span class="faint">Belum</span>' },
        { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
        { label: '', sort: false, render: r => actBtns(r.id) }] });
    box.querySelector('#qadd').onclick = () => quizForm(null, bank, reload);
    box.onclick = e => {
      const ed = e.target.closest('[data-edit]'); if (ed) quizForm(rows.find(r => r.id === ed.dataset.edit), bank, reload);
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'kuis', 'm.quiz.delete', dl.dataset.del, reload);
    };
  }
  function quizForm(q, bank, done) {
    q = q || { category: 'Grammar', time_limit: 10, attempts: 2, xp: 50, status: 'draft', question_ids: [] };
    let sel = (q.question_ids || []).filter(id => bank.some(b => b.id === id)), fq = '', fc = '';
    const md = UI.modal({ title: q.id ? 'Ubah kuis' : 'Kuis baru', size: 'lg', sticky: true, body: `<form class="form-grid" id="qf">
      ${UI.field({ name: 'title', label: 'Judul kuis', required: true, value: q.title, full: true })}
      ${UI.field({ name: 'category', type: 'select', label: 'Kategori', options: UI.SKILLS6, value: q.category })}
      ${UI.field({ name: 'xp', type: 'number', label: 'XP maksimal (dikali skor)', value: q.xp, min: 0 })}
      ${UI.field({ name: 'time_limit', type: 'number', label: 'Batas waktu (menit, 0 = bebas)', value: q.time_limit, min: 0, maxv: 180 })}
      ${UI.field({ name: 'attempts', type: 'number', label: 'Kesempatan (0 = tanpa batas)', value: q.attempts, min: 0, maxv: 20 })}
      ${UI.field({ name: 'description', label: 'Deskripsi', value: q.description, full: true })}
      <div class="full grid g-2"><div class="card tint pad-sm stack-sm"><div class="row between"><b class="small">Bank soal</b><span class="xs muted">klik untuk menambah</span></div>
        <div class="row-sm"><input class="input" id="bq" placeholder="Cari soal" style="min-height:36px"><select class="select" id="bc" style="min-height:36px;width:auto"><option value="">Semua</option>${UI.SKILLS6.map(s => `<option>${s}</option>`).join('')}</select></div><div id="bl" style="max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:8px"></div></div>
        <div class="card pad-sm stack-sm"><div class="row between"><b class="small">Soal dalam kuis</b><span class="chip chip-blue" id="sc"></span></div><div id="sl" class="stack-sm" style="max-height:340px;overflow:auto"></div></div></div>
      ${UI.field({ name: 'status', type: 'select', label: 'Status', options: [{ v: 'draft', l: 'Draf' }, { v: 'published', l: 'Terbit' }], value: q.status, full: true })}
    </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan kuis</button>' });
    const f = md.el.querySelector('#qf');
    const draw = () => {
      const avail = bank.filter(b => sel.indexOf(b.id) === -1 && (!fc || b.category === fc) && (!fq || b.text.toLowerCase().includes(fq)));
      f.querySelector('#bl').innerHTML = avail.map(b => `<button type="button" class="opt" style="min-height:44px;flex:none;padding:8px 10px;font-size:13px" data-add="${attr(b.id)}"><span class="k">${ic('plus', 'i-sm')}</span><span class="grow">${esc(b.text)}<br><span class="xs muted">${esc(b.category)} · ${esc(b.difficulty)}</span></span></button>`).join('') || '<p class="xs muted">Tidak ada soal. Tambahkan di tab Bank soal.</p>';
      f.querySelector('#sl').innerHTML = sel.map((id, i) => { const b = bank.find(x => x.id === id); return `<div class="row-sm" style="flex-wrap:nowrap;padding:6px 8px;border:1px solid var(--border);border-radius:10px"><span class="k num xs" style="width:22px">${i + 1}</span><span class="small grow">${esc(b.text)}</span><button type="button" class="icon-btn plain" data-up="${i}" aria-label="Naikkan" ${i ? '' : 'disabled'}>${ic('chevu', 'i-sm')}</button><button type="button" class="icon-btn plain" data-rm="${i}" aria-label="Keluarkan">${ic('x', 'i-sm')}</button></div>`; }).join('') || '<p class="xs muted">Belum ada soal dipilih.</p>';
      f.querySelector('#sc').textContent = sel.length + ' soal';
    };
    draw();
    f.querySelector('#bq').addEventListener('input', e => { fq = e.target.value.toLowerCase(); draw(); });
    f.querySelector('#bc').onchange = e => { fc = e.target.value; draw(); };
    f.addEventListener('click', e => {
      const a = e.target.closest('[data-add]'); if (a) { sel.push(a.dataset.add); draw(); }
      const r = e.target.closest('[data-rm]'); if (r) { sel.splice(+r.dataset.rm, 1); draw(); }
      const u = e.target.closest('[data-up]'); if (u) { const i = +u.dataset.up; [sel[i - 1], sel[i]] = [sel[i], sel[i - 1]]; draw(); }
    });
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f); delete d['']; d.question_ids = sel; if (q.id) d.id = q.id;
      const r = await API.act('m.quiz.save', d); toast(r.message); md.close(); done();
    });
  }
  async function bankTab(box, ctx) {
    let rows = await API.get('m.questions', {});
    if (!ctx.alive()) return;
    const reload = async () => { rows = await API.get('m.questions', {}); tbl.rows = rows; };
    box.innerHTML = `<div class="row end" style="margin-bottom:12px"><button class="btn btn-outline" id="qimp">${ic('upload', 'i-sm')} Impor CSV</button><button class="btn" id="qadd">${ic('plus', 'i-sm')} Soal baru</button></div><div id="qt"></div>`;
    const tbl = UI.table(box.querySelector('#qt'), { rows, search: ['text'], placeholder: 'Cari soal',
      filters: [{ key: 'category', label: 'Kategori', options: UI.SKILLS6 }, { key: 'difficulty', label: 'Tingkat', options: DIFF }],
      columns: [
        { key: 'text', label: 'Soal', render: r => `<div class="small" style="font-weight:600">${esc(r.text)}</div><div class="xs muted">Jawaban: ${String.fromCharCode(65 + r.answer)}. ${esc(r.options[r.answer] || '')}</div>` },
        { key: 'category', label: 'Kategori', render: r => UI.skillChip(r.category) },
        { key: 'difficulty', label: 'Tingkat' },
        { key: 'used', label: 'Dipakai', render: r => r.used ? r.used + ' kuis' : '<span class="faint">-</span>' },
        { label: '', sort: false, render: r => actBtns(r.id) }] });
    box.querySelector('#qadd').onclick = () => qForm(null, reload);
    box.querySelector('#qimp').onclick = () => qImport(reload);
    box.onclick = e => {
      const ed = e.target.closest('[data-edit]'); if (ed) qForm(rows.find(r => r.id === ed.dataset.edit), reload);
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'soal', 'm.question.delete', dl.dataset.del, reload);
    };
  }
  function qForm(q, done) {
    q = q || { options: ['', '', '', ''], answer: 0, category: 'Grammar', difficulty: 'Beginner' };
    let opts = q.options.slice(), ans = q.answer;
    const md = UI.modal({ title: q.id ? 'Ubah soal' : 'Soal baru', size: 'lg', sticky: true, body: `<form class="form-grid" id="qf">
      ${UI.field({ name: 'text', type: 'textarea', label: 'Pertanyaan', value: q.text, rows: 3, full: true, required: true, max: 1000 })}
      <div class="field full"><span class="lbl-f">Pilihan jawaban (pilih yang benar)</span><div id="ol" class="stack-sm"></div><button type="button" class="btn btn-ghost btn-sm" id="oadd" style="justify-self:start">${ic('plus', 'i-sm')} Tambah pilihan</button></div>
      ${UI.field({ name: 'category', type: 'select', label: 'Kategori', options: UI.SKILLS6, value: q.category })}
      ${UI.field({ name: 'difficulty', type: 'select', label: 'Tingkat', options: DIFF, value: q.difficulty })}
      ${UI.field({ name: 'explain', type: 'textarea', label: 'Pembahasan (tampil setelah kuis selesai)', value: q.explain, rows: 2, full: true, max: 600 })}
    </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan soal</button>' });
    const f = md.el.querySelector('#qf');
    const draw = () => { f.querySelector('#ol').innerHTML = opts.map((o, i) => `<div class="row-sm" style="flex-wrap:nowrap"><label class="check" title="Jawaban benar"><input type="radio" name="ans" value="${i}" ${i === ans ? 'checked' : ''}><b class="num">${String.fromCharCode(65 + i)}</b></label><input class="input" data-o="${i}" value="${attr(o)}" maxlength="300" aria-label="Pilihan ${String.fromCharCode(65 + i)}">${opts.length > 2 ? `<button type="button" class="icon-btn" data-ox="${i}" aria-label="Hapus pilihan">${ic('x', 'i-sm')}</button>` : ''}</div>`).join(''); };
    draw();
    f.addEventListener('input', e => { if (e.target.dataset.o !== undefined) opts[+e.target.dataset.o] = e.target.value; });
    f.addEventListener('change', e => { if (e.target.name === 'ans') ans = +e.target.value; });
    f.addEventListener('click', e => { const x = e.target.closest('[data-ox]'); if (x) { const i = +x.dataset.ox; opts.splice(i, 1); if (ans >= opts.length) ans = 0; else if (ans > i) ans--; draw(); } });
    f.querySelector('#oadd').onclick = () => { if (opts.length < 6) { opts.push(''); draw(); } };
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f); const clean = opts.map(o => o.trim());
      if (clean.some(o => !o)) throw new Error('Isi semua pilihan jawaban atau hapus yang kosong.');
      const r = await API.act('m.question.save', { id: q.id, text: d.text, options: clean, answer: ans, category: d.category, difficulty: d.difficulty, explain: d.explain });
      toast(r.message); md.close(); done();
    });
  }
  function qImport(done) {
    let parsed = [];
    const md = UI.modal({ title: 'Impor soal dari CSV', size: 'lg', body: `<div class="info-box">${ic('info')}<span>Kolom: <b>text, a, b, c, d, answer, category, difficulty, explain</b>. Kolom <b>answer</b> diisi huruf A–D. Simpan dari Google Sheets lewat File → Download → CSV.</span></div>
      <div class="row"><button class="btn btn-outline btn-sm" id="tpl">${ic('download', 'i-sm')} Unduh template</button></div>
      <label class="drop"><input type="file" accept=".csv,text/csv" id="cf">${ic('cloud')}<b class="small">Pilih berkas CSV</b></label><div id="cr"></div>`,
      foot: '<button class="btn btn-outline" data-close>Tutup</button><button class="btn" data-ok disabled>Impor</button>' });
    md.el.querySelector('#tpl').onclick = () => UI.csvDownload([['text', 'a', 'b', 'c', 'd', 'answer', 'category', 'difficulty', 'explain'], ['She ___ to school every day.', 'go', 'goes', 'going', 'gone', 'B', 'Grammar', 'Beginner', 'Subjek she memakai kata kerja + s/es.']], 'template-soal.csv');
    md.el.querySelector('#cf').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const rows = UI.parseCSV(await file.text()); const h = rows[0].map(x => x.toLowerCase());
      parsed = rows.slice(1).map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
      const r = await API.act('m.questions.import', { rows: parsed, dryRun: true });
      md.el.querySelector('#cr').innerHTML = `<div class="${r.data.errors.length ? 'warn-box' : 'info-box'}">${ic(r.data.errors.length ? 'alert' : 'checkcircle')}<div><b>${r.data.valid} soal siap diimpor.</b>${r.data.errors.length ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${r.data.errors.slice(0, 10).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div>`;
      md.el.querySelector('[data-ok]').disabled = !r.data.valid;
    };
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const r = await API.act('m.questions.import', { rows: parsed, dryRun: false }); toast(r.message); md.close(); done(); });
  }
  async function vocabTab(box, ctx) {
    let d = await API.get('m.vocab', {});
    if (!ctx.alive()) return;
    const reload = async () => { d = await API.get('m.vocab', {}); tbl.rows = d.items; };
    box.innerHTML = `<div class="row between" style="margin-bottom:12px"><p class="muted small">Word of the Day bergilir otomatis setiap hari dari daftar ini (${d.items.length} kata).</p><button class="btn" id="vadd">${ic('plus', 'i-sm')} Kata baru</button></div><div id="vt"></div>`;
    const tbl = UI.table(box.querySelector('#vt'), { rows: d.items, search: ['word', 'meaning'], placeholder: 'Cari kata', rowClass: r => r.id === d.today ? 'me' : '',
      columns: [
        { key: 'word', label: 'Kata', render: r => `<b>${esc(r.word)}</b> ${r.id === d.today ? '<span class="chip chip-green">Hari ini</span>' : ''}<div class="xs muted">${esc(r.phonetic)} · ${esc(r.pos)}</div>` },
        { key: 'meaning', label: 'Arti' }, { key: 'example', label: 'Contoh', render: r => `<span class="small muted">${esc(r.example)}</span>` },
        { label: '', sort: false, render: r => actBtns(r.id) }] });
    const form = w => {
      w = w || {};
      const md = UI.modal({ title: w.id ? 'Ubah kata' : 'Kata baru', body: `<form class="form-grid" id="vf">${UI.field({ name: 'word', label: 'Kata', value: w.word, required: true })}${UI.field({ name: 'phonetic', label: 'Pelafalan (IPA)', value: w.phonetic, placeholder: '/ˈwɜːd/' })}${UI.field({ name: 'pos', type: 'select', label: 'Jenis kata', options: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom'], value: w.pos || 'noun' })}${UI.field({ name: 'meaning', label: 'Arti', value: w.meaning })}${UI.field({ name: 'example', type: 'textarea', rows: 2, label: 'Contoh kalimat', value: w.example, full: true })}</form>`,
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
      md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const f = UI.formData(md.el.querySelector('#vf')); if (w.id) f.id = w.id; const r = await API.act('m.vocab.save', f); toast(r.message); md.close(); reload(); });
    };
    box.querySelector('#vadd').onclick = () => form();
    box.onclick = e => {
      const ed = e.target.closest('[data-edit]'); if (ed) form(d.items.find(r => r.id === ed.dataset.edit));
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'kata', 'm.vocab.delete', dl.dataset.del, reload);
    };
  }

  /* ============================== PEMERIKSAAN TUGAS ============================== */
  Pages.mReview = async function (v, p, ctx) {
    App.setTitle('Pemeriksaan tugas', [['Kegiatan klub']]);
    v.innerHTML = UI.skel(1, 400);
    let rows; try { rows = await API.get('m.submissions', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    let st = 'submitted';
    const cnt = s => rows.filter(r => r.status === s).length;
    App.setBadge('review', cnt('submitted'));
    const paint = () => {
      v.innerHTML = head('Pemeriksaan tugas', 'Nilai tugas siswa dengan rubrik dan beri feedback. Yang paling lama menunggu tampil di atas.', '') +
        `<div class="tabs" role="tablist" style="width:max-content;max-width:100%">${[['submitted', 'Menunggu'], ['reviewed', 'Dinilai'], ['revision', 'Revisi'], ['completed', 'Selesai'], ['', 'Semua']].map(t => `<button role="tab" data-s="${t[0]}" aria-selected="${t[0] === st}">${t[1]}${t[0] ? ` <span class="${t[0] === 'submitted' && cnt(t[0]) ? 'cnt' : 'faint'}">${cnt(t[0])}</span>` : ''}</button>`).join('')}</div><div id="t"></div>`;
      v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { st = b.dataset.s; paint(); });
      const list = rows.filter(r => !st || r.status === st);
      UI.table(v.querySelector('#t'), { rows: list, search: ['student', 'challenge', 'class'], placeholder: 'Cari siswa atau tantangan', sort: 'at', dir: st === 'submitted' ? 1 : -1,
        filters: [{ key: 'class', label: 'Kelas', options: [...new Set(rows.map(r => r.class).filter(Boolean))].sort() }, { key: 'skill', label: 'Skill', options: UI.SKILLS6 }],
        emptyTitle: st === 'submitted' ? 'Tidak ada tugas yang menunggu' : 'Tidak ada data',
        columns: [
          { key: 'student', label: 'Siswa', render: r => person(r.student, esc(r.class)) },
          { key: 'challenge', label: 'Tantangan', render: r => `<div class="small" style="font-weight:600">${esc(r.challenge)}</div><div class="xs muted">${esc(r.skill)} · ${esc(L.typeShort[r.type] || '')}</div>` },
          { key: 'kind', label: 'Jenis', render: r => `<span class="row-sm small">${ic(({ audio: 'music', video: 'video', image: 'image', application: 'file', link: 'link', text: 'filetext' })[r.kind] || 'file', 'i-sm')} ${({ audio: 'Audio', video: 'Video', image: 'Gambar', application: 'Dokumen', link: 'Tautan', text: 'Tulisan' })[r.kind] || 'Berkas'}</span>` },
          { key: 'at', label: 'Dikirim', render: r => `<span class="small">${fmt.ago(r.at)}</span>${r.attempt > 1 ? `<div class="xs muted">percobaan ${r.attempt}</div>` : ''}` },
          { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
          { key: 'score', label: 'Nilai', render: r => r.status === 'submitted' ? '<span class="faint">-</span>' : `<b class="num">${r.score}</b>` },
          { label: '', sort: false, render: r => `<a class="btn btn-sm ${r.status === 'submitted' ? '' : 'btn-outline'}" href="#/m/review/${attr(r.id)}">${r.status === 'submitted' ? 'Nilai' : 'Buka'}</a>` }],
        onRow: r => App.go('#/m/review/' + r.id) });
    };
    paint();
  };

  Pages.mReviewOne = async function (v, p, ctx) {
    v.innerHTML = `<div class="split">${UI.skel(1, 420)}${UI.skel(1, 420)}</div>`;
    let d; try { d = await API.get('m.submission.get', { id: p[0] }); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const s = d.submission, c = d.challenge, u = d.student;
    App.setTitle('Nilai: ' + c.title, [['Pemeriksaan tugas', '#/m/review'], [u.name]]);
    const prev = s.rubric_scores.length ? s.rubric_scores : c.rubric.map(() => '');
    const maxSum = c.rubric.reduce((a, r) => a + r.max, 0);
    const phrases = ['Great pronunciation!', 'Clear structure.', 'Speak a little slower.', 'Use more linking words.', 'Check your verb tenses.', 'Nice vocabulary choice!', 'Add a stronger conclusion.'];
    v.innerHTML = `<div class="split"><div class="stack">
        <div class="card row" style="flex-wrap:nowrap">${UI.avatar(u.name, '', '')}<div class="grow" style="min-width:0"><b>${esc(u.name)}</b><div class="xs muted">${esc(u.class || '')} · Level ${u.level} · ${fmt.n(u.xp)} XP</div></div><a class="btn btn-outline btn-sm" href="#/m/member/${attr(u.id)}">Profil</a></div>
        <div class="card stack-sm"><div class="row-sm">${UI.skillChip(c.skill)}<span class="chip">${esc(L.type[c.type] || '')}</span>${UI.pill(s.status)}<span class="chip">Percobaan ${s.attempt}</span></div><h2 class="h2">${esc(c.title)}</h2>
          <div class="xs muted">Dikirim ${fmt.dt(s.submitted_at)}${c.deadline ? ` · batas ${fmt.dt(c.deadline)}${s.submitted_at > c.deadline ? ' <b style="color:var(--danger-ink)">(terlambat)</b>' : ''}` : ''}</div>
          <details><summary class="small" style="cursor:pointer">Lihat instruksi</summary><div class="prose small" style="margin-top:8px">${UI.md(c.instructions)}</div></details></div>
        <div class="card stack"><h3 class="h3">${ic('inbox')} Hasil kerja siswa</h3>
          ${s.has_file ? `<div class="media-box" id="mbox"><div class="row-sm small">${ic('file', 'i-sm')} ${esc(s.file_name)} · ${fmt.size(s.file_size)}</div><div class="sk" style="height:54px"></div></div>` : ''}
          ${s.link ? `<div class="stack-sm"><span class="small">${ic('link', 'i-sm')} <a href="${attr(s.link)}" target="_blank" rel="noopener" style="word-break:break-all">${esc(s.link)}</a></span>${UI.linkEmbed(s.link)}</div>` : ''}
          ${s.text ? `<div class="card tint" style="white-space:pre-wrap;line-height:1.7">${esc(s.text)}</div><div class="xs muted">${(s.text.match(/\S+/g) || []).length} kata</div>` : ''}
          ${s.note ? `<div class="info-box">${ic('message')}<span><b>Catatan siswa:</b> ${esc(s.note)}</span></div>` : ''}
          <div class="row-sm xs muted">${ic(s.consent ? 'checkcircle' : 'lock', 'i-sm')} ${s.consent ? 'Siswa bersedia karya ditampilkan bila terpilih (perlu persetujuan orang tua/wali).' : 'Siswa memilih karya tetap privat.'}</div></div>
        ${d.history.length ? `<div class="card"><h3 class="h3" style="margin-bottom:8px">Percobaan sebelumnya</h3>${d.history.map(h => `<div class="stack-sm" style="padding:8px 0;border-bottom:1px solid var(--border)"><div class="row between small"><span>Percobaan ${h.attempt} · ${fmt.dt(h.at)}</span>${UI.pill(h.status)}</div>${h.feedback ? `<p class="xs muted">${esc(h.feedback)}</p>` : ''}</div>`).join('')}</div>` : ''}
      </div>
      <aside class="card stack" style="position:sticky;top:calc(var(--top-h) + 16px)">
        <div class="row between"><h3 class="h3">${ic('clipcheck')} Rubrik</h3><span class="chip chip-blue">${maxSum} poin</span></div>
        <form id="rf" class="stack-sm">${c.rubric.map((r, i) => `<div class="row-sm" style="flex-wrap:nowrap"><label class="small grow" for="sc${i}">${esc(r.name)}</label><input class="input num" type="number" id="sc${i}" data-sc="${i}" min="0" max="${r.max}" value="${prev[i] === '' ? '' : prev[i]}" style="width:78px;text-align:right" inputmode="numeric"><span class="xs muted" style="width:34px">/ ${r.max}</span></div>`).join('')}
          <div class="card tint pad-sm row between"><span class="small">Nilai akhir</span><span class="stat-lg" id="tot">-</span></div>
          <div class="field"><label for="fb">Feedback untuk siswa</label><textarea class="textarea" id="fb" rows="4" maxlength="3000" placeholder="Tulis apa yang sudah baik dan apa yang perlu diperbaiki.">${esc(s.feedback || '')}</textarea>
            <div class="chips-f">${phrases.map(x => `<button type="button" data-ph="${attr(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div></div>
          ${s.status === 'completed' ? `<div class="info-box">${ic('zap')}<span>XP sudah diberikan (${s.xp}). Mengubah nilai tidak menambah XP lagi.</span></div>` : UI.field({ name: 'xp', type: 'number', label: 'XP untuk siswa bila selesai', value: c.xp, min: 0, maxv: 1000, hint: 'Bawaan sesuai XP tantangan.' })}
          <div class="stack-sm" style="margin-top:6px"><button type="button" class="btn btn-block" data-a="complete">${ic('checkcircle', 'i-sm')} Selesai & beri XP</button>
            <div class="grid g-2 keep"><button type="button" class="btn btn-outline" data-a="revision">${ic('retry', 'i-sm')} Minta revisi</button><button type="button" class="btn btn-ghost" data-a="save">Simpan nilai</button></div></div>
          ${s.reviewer ? `<p class="xs muted">Terakhir dinilai ${esc(s.reviewer)} · ${fmt.dt(s.reviewed_at)}</p>` : ''}</form></aside></div>`;
    const f = v.querySelector('#rf');
    const total = () => { const vals = [...f.querySelectorAll('[data-sc]')].map(i => +i.value || 0); const t = Math.round(vals.reduce((a, b) => a + b, 0) / maxSum * 100); v.querySelector('#tot').textContent = vals.some((x, i) => f.querySelectorAll('[data-sc]')[i].value !== '') ? t : '-'; return vals; };
    f.addEventListener('input', total); total();
    f.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => { const ta = f.querySelector('#fb'); ta.value = (ta.value.trim() + ' ' + b.dataset.ph).trim(); ta.focus(); });
    f.querySelectorAll('[data-a]').forEach(b => b.onclick = () => UI.busy(b, async () => {
      const scores = total();
      if (b.dataset.a !== 'revision' && [...f.querySelectorAll('[data-sc]')].some(i => i.value === '')) throw new Error('Isi semua nilai rubrik terlebih dahulu.');
      const xpIn = f.querySelector('[name=xp]');
      const r = await API.act('m.submission.review', { id: s.id, action: b.dataset.a, scores, feedback: f.querySelector('#fb').value, xp: xpIn ? xpIn.value : undefined });
      toast(r.message);
      const next = (await API.get('m.submissions', {})).filter(x => x.status === 'submitted').sort((a, b) => a.at - b.at)[0];
      App.go(next ? '#/m/review/' + next.id : '#/m/review');
    }));
    if (s.has_file) {
      try { const file = await UI.loadFile('sub', s.id); if (ctx.alive()) v.querySelector('#mbox').innerHTML = `<div class="row between small"><span>${ic('file', 'i-sm')} ${esc(s.file_name)}</span><button class="btn btn-ghost btn-sm" id="dl">${ic('download', 'i-sm')} Unduh</button></div>${UI.mediaHTML(file)}`; const dl = v.querySelector('#dl'); if (dl) dl.onclick = () => UI.saveBlob(file.blob, file.name); }
      catch (e) { const mb = v.querySelector('#mbox'); if (mb) mb.innerHTML = UI.errBox(e.message); }
    }
  };

  /* ============================== XP & BADGE ============================== */
  Pages.mXp = async function (v, p, ctx) {
    App.setTitle('XP & Badge', [['Pembelajaran']]);
    v.innerHTML = UI.skel(2, 260);
    let members, badges, ledger;
    try { [members, badges, ledger] = await Promise.all([API.get('m.members', {}), API.get('m.badges', {}), API.get('m.xp.ledger', {})]); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const act = members.filter(m => m.status === 'active');
    const opts = act.map(m => `<option value="${attr(m.id)}">${esc(m.name)}${m.class ? ' · ' + esc(m.class) : ''}</option>`).join('');
    v.innerHTML = `${head('XP & Badge', 'Beri penghargaan di luar sistem otomatis, misalnya untuk keaktifan di pertemuan atau lomba.', '')}
      <div class="grid g-2">
        <form class="card stack" id="xf"><h3 class="h3">${ic('zap')} Sesuaikan XP</h3>
          <div class="field"><label for="xs">Siswa</label><select class="select" id="xs" name="userId" required><option value="">— pilih siswa —</option>${opts}</select></div>
          <div class="chips-f">${[10, 25, 50, 100, -10].map(x => `<button type="button" data-x="${x}" aria-pressed="false">${x > 0 ? '+' : ''}${x}</button>`).join('')}</div>
          ${UI.field({ name: 'amount', type: 'number', label: 'Jumlah XP', value: 25 })}${UI.field({ name: 'reason', label: 'Alasan', placeholder: 'Contoh: juara 2 lomba speech tingkat kabupaten', required: true })}
          <div><button class="btn" type="submit">Terapkan XP</button></div></form>
        <form class="card stack" id="bf"><h3 class="h3">${ic('award')} Beri badge</h3>
          <div class="field"><label for="bs">Siswa</label><select class="select" id="bs" name="userId" required><option value="">— pilih siswa —</option>${opts}</select></div>
          ${UI.field({ name: 'badgeId', type: 'select', label: 'Badge', options: badges.filter(b => b.active).map(b => ({ v: b.id, l: b.name + (b.criteria === 'manual' ? ' (manual)' : '') })), value: (badges.find(b => b.criteria === 'manual') || {}).id })}
          ${UI.field({ name: 'note', label: 'Catatan untuk siswa (opsional)' })}
          <div><button class="btn" type="submit">Berikan badge</button></div></form>
      </div>
      <div class="card"><div class="card-h"><h3 class="h3">Koleksi badge</h3><button class="btn btn-outline btn-sm" id="badd">${ic('plus', 'i-sm')} Badge baru</button></div>
        <div class="grid g-5">${badges.map(b => `<button type="button" class="badge-tile ${b.active ? 'earned' : 'locked'}" data-be="${attr(b.id)}">${UI.badgeMedal(b)}<b>${esc(b.name)}</b><small>${esc(critText(b))}</small><small>${b.holders} pemilik${b.active ? '' : ' · nonaktif'}</small></button>`).join('')}</div></div>
      <div class="card pad-0"><div class="card-h" style="padding:18px 18px 0"><h3 class="h3">Riwayat XP manual & tantangan</h3></div>
        ${ledger.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Waktu</th><th>Siswa</th><th>XP</th><th>Sumber</th><th>Alasan</th><th>Oleh</th></tr></thead><tbody>${ledger.map(x => `<tr><td class="small muted nowrap">${fmt.dt(x.at)}</td><td class="small">${esc(x.student)}</td><td><b class="num" style="color:${x.amount >= 0 ? 'var(--success-ink)' : 'var(--danger-ink)'}">${x.amount > 0 ? '+' : ''}${x.amount}</b></td><td><span class="chip">${x.source === 'manual' ? 'Manual' : 'Tantangan'}</span></td><td class="small">${esc(x.reason)}</td><td class="small muted">${esc(x.by)}</td></tr>`).join('')}</tbody></table></div>` : `<div style="padding:0 18px 18px"><p class="muted small">Belum ada riwayat.</p></div>`}</div>`;
    v.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { v.querySelector('#xf [name=amount]').value = b.dataset.x; });
    v.querySelector('#xf').onsubmit = e => { e.preventDefault(); const d = UI.formData(e.target); UI.busy(e.target.querySelector('[type=submit]'), async () => { if (!d.userId) throw new Error('Pilih siswa.'); const r = await API.act('m.xp.adjust', d); toast(r.message); App.route(); }); };
    v.querySelector('#bf').onsubmit = e => { e.preventDefault(); const d = UI.formData(e.target); UI.busy(e.target.querySelector('[type=submit]'), async () => { if (!d.userId) throw new Error('Pilih siswa.'); const r = await API.act('m.badge.award', d); toast(r.message); App.route(); }); };
    v.querySelector('#badd').onclick = () => badgeForm(null);
    v.querySelectorAll('[data-be]').forEach(b => b.onclick = () => badgeForm(badges.find(x => x.id === b.dataset.be)));
  };
  const CRIT = { xp: 'Total XP', streak: 'Streak (hari)', materials: 'Materi selesai', vocab: 'Kosakata harian', challenges: 'Tantangan selesai', skill_challenges: 'Tantangan per skill', quizzes: 'Kuis berbeda selesai', quiz_perfect: 'Skor kuis 100', manual: 'Diberikan manual' };
  function critText(b) { return b.criteria === 'manual' ? 'Diberikan Pembina' : `${CRIT[b.criteria] || b.criteria} ≥ ${fmt.n(b.value)}${b.skill ? ' (' + b.skill + ')' : ''}`; }
  function badgeForm(b) {
    b = b || { icon: 'award', tone: 'blue', criteria: 'manual', value: 1, active: true, sort: 10 };
    const icons = ['award', 'trophy', 'star', 'flame', 'zap', 'mic', 'headphones', 'book', 'pen', 'languages', 'spell', 'target', 'flag', 'crown', 'shield', 'message', 'bulb', 'users', 'cap', 'volume'];
    const md = UI.modal({ title: b.id ? 'Ubah badge' : 'Badge baru', size: 'lg', sticky: true, body: `<form class="form-grid" id="bgf">
      ${UI.field({ name: 'name', label: 'Nama badge', value: b.name, required: true, max: 60 })}
      ${UI.field({ name: 'tone', type: 'select', label: 'Warna', options: [{ v: 'blue', l: 'Biru' }, { v: 'purple', l: 'Ungu' }, { v: 'gold', l: 'Emas' }, { v: 'green', l: 'Hijau' }, { v: 'orange', l: 'Oranye' }, { v: 'navy', l: 'Navy' }], value: b.tone })}
      ${UI.field({ name: 'description', label: 'Deskripsi', value: b.description, full: true, max: 200 })}
      <div class="field full"><span class="lbl-f">Ikon</span><div class="chips-f" id="icp">${icons.map(i => `<button type="button" data-ic="${i}" aria-pressed="${i === b.icon}" aria-label="${i}" style="padding:6px 8px">${ic(i, 'i-sm')}</button>`).join('')}</div></div>
      ${UI.field({ name: 'criteria', type: 'select', label: 'Cara mendapatkan', options: Object.keys(CRIT).map(k => ({ v: k, l: CRIT[k] })), value: b.criteria })}
      ${UI.field({ name: 'value', type: 'number', label: 'Target', value: b.value, min: 1 })}
      <div id="skw">${UI.field({ name: 'skill', type: 'select', label: 'Skill', options: UI.SKILLS6, value: b.skill || 'Speaking' })}</div>
      ${UI.field({ name: 'sort', type: 'number', label: 'Urutan', value: b.sort, min: 0 })}
      ${UI.field({ name: 'active', type: 'switch', label: 'Aktif (bisa diraih siswa)', value: b.active, full: true })}
      <div class="full row" id="bpv"></div></form>`,
      foot: `${b.id && !b.holders ? `<button class="btn btn-ghost" data-del style="margin-right:auto;color:var(--danger-ink)">Hapus</button>` : ''}<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan</button>` });
    const f = md.el.querySelector('#bgf'); let icon = b.icon;
    const pv = () => { const d = UI.formData(f); f.querySelector('#bpv').innerHTML = `<div class="badge-tile earned" style="width:160px;cursor:default">${UI.badgeMedal({ icon, tone: d.tone })}<b>${esc(d.name || 'Nama badge')}</b><small>${esc(critText({ criteria: d.criteria, value: d.value, skill: d.criteria === 'skill_challenges' ? d.skill : '' }))}</small></div>`; f.querySelector('#skw').hidden = d.criteria !== 'skill_challenges'; };
    f.addEventListener('input', pv); f.addEventListener('change', pv); pv();
    f.querySelectorAll('[data-ic]').forEach(x => x.onclick = () => { icon = x.dataset.ic; f.querySelectorAll('[data-ic]').forEach(y => y.setAttribute('aria-pressed', String(y === x))); pv(); });
    md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const d = UI.formData(f); d.icon = icon; if (b.id) d.id = b.id; if (d.criteria !== 'skill_challenges') d.skill = ''; const r = await API.act('m.badge.save', d); toast(r.message); md.close(); App.route(); });
    const del = md.el.querySelector('[data-del]'); if (del) del.onclick = () => UI.busy(del, async () => { const r = await API.act('m.badge.delete', { id: b.id }); toast(r.message); md.close(); App.route(); });
  }

  /* ============================== PENGUMUMAN ============================== */
  Pages.mAnn = async function (v, p, ctx) {
    App.setTitle('Pengumuman', [['Pembelajaran']]);
    v.innerHTML = UI.skel(1, 300);
    let rows; try { rows = await API.get('m.announcements', {}); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const isAdmin = S.me.role === 'admin';
    const reload = async () => { rows = await API.get('m.announcements', {}); tbl.rows = rows; };
    v.innerHTML = head('Pengumuman & jadwal', 'Pengumuman terbit dikirim sebagai notifikasi ke semua siswa.' + (isAdmin ? ' Centang “Tampilkan di halaman publik” agar muncul di beranda.' : ''), `<button class="btn" id="add">${ic('plus', 'i-sm')} Pengumuman baru</button>`) + '<div id="t"></div>';
    const tbl = UI.table(v.querySelector('#t'), { rows, search: ['title', 'body'],
      columns: [
        { key: 'title', label: 'Judul', render: r => `<div class="small" style="font-weight:600">${esc(r.title)}</div><div class="xs muted clamp-2">${esc(r.body)}</div>` },
        { key: 'type', label: 'Jenis', render: r => `<span class="chip ${r.type === 'meeting' ? 'chip-purple' : 'chip-blue'}">${r.type === 'meeting' ? 'Jadwal pertemuan' : 'Pengumuman'}</span>` },
        { key: 'event_at', label: 'Waktu acara', render: r => r.event_at ? `<span class="small">${fmt.dt(r.event_at)}</span>${r.location ? `<div class="xs muted">${esc(r.location)}</div>` : ''}` : '<span class="faint">-</span>' },
        { key: 'public', label: 'Publik', render: r => r.public ? `<span class="chip chip-green">${ic('globe')} Ya</span>` : '<span class="faint">Tidak</span>' },
        { key: 'status', label: 'Status', render: r => UI.pill(r.status) },
        { key: 'created_at', label: 'Dibuat', render: r => `<span class="small muted">${fmt.date(r.created_at)}</span>` },
        { label: '', sort: false, render: r => actBtns(r.id) }] });
    const form = a => {
      a = a || { type: 'announcement', status: 'published', public: false };
      const md = UI.modal({ title: a.id ? 'Ubah pengumuman' : 'Pengumuman baru', size: 'lg', body: `<form class="form-grid" id="af">
        ${UI.field({ name: 'title', label: 'Judul', value: a.title, required: true, full: true, max: 160 })}
        ${UI.field({ name: 'body', type: 'textarea', label: 'Isi', value: a.body, rows: 5, full: true, max: 4000 })}
        ${UI.field({ name: 'type', type: 'select', label: 'Jenis', options: [{ v: 'announcement', l: 'Pengumuman' }, { v: 'meeting', l: 'Jadwal pertemuan' }], value: a.type })}
        ${UI.field({ name: 'event_at', type: 'datetime-local', label: 'Waktu acara (opsional)', value: UI.dtLocal(a.event_at) })}
        ${UI.field({ name: 'location', label: 'Tempat (opsional)', value: a.location, placeholder: 'Contoh: Lab Bahasa' })}
        ${UI.field({ name: 'status', type: 'select', label: 'Status', options: [{ v: 'published', l: 'Terbit & beri tahu siswa' }, { v: 'draft', l: 'Draf' }], value: a.status })}
        ${isAdmin ? UI.field({ name: 'public', type: 'switch', label: 'Tampilkan di halaman publik (dapat dilihat tanpa login)', value: a.public, full: true }) : ''}
      </form>`, foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
      md.el.querySelector('[data-ok]').onclick = e => UI.busy(e.currentTarget, async () => { const d = UI.formData(md.el.querySelector('#af')); if (a.id) d.id = a.id; const r = await API.act('m.announcement.save', d); toast(r.message); md.close(); reload(); });
    };
    v.querySelector('#add').onclick = () => form();
    v.addEventListener('click', e => {
      const ed = e.target.closest('[data-edit]'); if (ed) form(rows.find(r => r.id === ed.dataset.edit));
      const dl = e.target.closest('[data-del]'); if (dl) delFlow(dl, 'pengumuman', 'm.announcement.delete', dl.dataset.del, reload);
    });
  };

  /* ============================== LAPORAN ============================== */
  Pages.mReports = async function (v, p, ctx) {
    App.setTitle('Laporan', [['Pantau']]);
    let tab = 'members', period = 'month';
    const s = App.settings || {};
    const paint = async () => {
      v.innerHTML = `${head('Laporan', 'Cari, saring, lalu cetak atau simpan sebagai PDF lewat dialog cetak browser. Laporan PDF resmi berlogo hadir di Fase 2.', `<button class="btn btn-outline" id="csv">${ic('download', 'i-sm')} Unduh CSV</button><button class="btn" id="prt">${ic('printer', 'i-sm')} Cetak / PDF</button>`)}
        <div class="print-only"><h1 class="h2">${esc(s.app_name)} — ${esc(s.school_name)}</h1><p id="ptitle"></p></div>
        <div class="row between no-print"><div class="tabs" role="tablist">${[['members', 'Data anggota'], ['leaderboard', 'Pencapaian & leaderboard'], ['challenges', 'Penyelesaian tantangan']].map(t => `<button role="tab" data-t="${t[0]}" aria-selected="${t[0] === tab}">${t[1]}</button>`).join('')}</div>
        ${tab === 'leaderboard' ? `<select class="select" id="per" style="width:auto">${[['day', 'Hari ini'], ['week', 'Minggu ini'], ['month', 'Bulan ini'], ['all', 'Sepanjang waktu']].map(x => `<option value="${x[0]}" ${x[0] === period ? 'selected' : ''}>${x[1]}</option>`).join('')}</select>` : ''}</div><div id="t">${UI.skel(1, 300)}</div>`;
      v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; paint(); });
      const per = v.querySelector('#per'); if (per) per.onchange = () => { period = per.value; paint(); };
      let rows; try { rows = await API.get('m.report', { tab, period }); } catch (e) { v.querySelector('#t').innerHTML = UI.errBox(e.message); return; }
      if (!ctx.alive()) return;
      const pLabel = { day: 'hari ini', week: 'minggu ini', month: 'bulan ini', all: 'sepanjang waktu' }[period];
      v.querySelector('#ptitle').textContent = ({ members: 'Laporan data & perkembangan anggota', leaderboard: 'Laporan leaderboard ' + pLabel, challenges: 'Laporan penyelesaian tantangan' })[tab] + ' · dicetak ' + new Date().toLocaleString('id-ID');
      let cfg;
      if (tab === 'members') cfg = { search: ['name', 'username', 'class'], filters: [{ key: 'class', label: 'Kelas', options: [...new Set(rows.map(r => r.class).filter(Boolean))].sort() }, { key: 'status', label: 'Status', options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Nonaktif' }] }, { key: 'level', label: 'Level', options: [...new Set(rows.map(r => r.level))].sort((a, b) => a - b).map(String) }],
        columns: [{ key: 'name', label: 'Nama' }, { key: 'class', label: 'Kelas' }, { key: 'level', label: 'Level', cls: 'num' }, { key: 'xp', label: 'XP', cls: 'num', render: r => fmt.n(r.xp) }, { key: 'streak', label: 'Streak', cls: 'num' }, { key: 'materials', label: 'Materi', cls: 'num' }, { key: 'quizzes', label: 'Kuis', cls: 'num' }, { key: 'quizAvg', label: 'Rata kuis', cls: 'num' }, { key: 'challenges', label: 'Tantangan', cls: 'num' }, { key: 'badges', label: 'Badge', cls: 'num' }, { key: 'last_active', label: 'Aktif terakhir', render: r => r.last_active ? fmt.ymd(r.last_active) : '-' }, { key: 'status', label: 'Status', render: r => UI.pill(r.status) }],
        csv: r => [r.name, r.username, r.class, r.level, r.xp, r.streak, r.materials, r.quizzes, r.quizAvg, r.challenges, r.badges, r.last_active, r.status], head: ['Nama', 'Username', 'Kelas', 'Level', 'XP', 'Streak', 'Materi', 'Kuis', 'Rata kuis', 'Tantangan', 'Badge', 'Aktif terakhir', 'Status'] };
      if (tab === 'leaderboard') cfg = { search: ['name', 'class'], sort: 'rank', filters: [{ key: 'class', label: 'Kelas', options: [...new Set(rows.map(r => r.class).filter(Boolean))].sort() }],
        columns: [{ key: 'rank', label: '#', render: r => `<span class="rank ${r.rank <= 3 ? 'r' + r.rank : ''}">${r.rank}</span>` }, { key: 'name', label: 'Nama' }, { key: 'class', label: 'Kelas' }, { key: 'level', label: 'Level', cls: 'num' }, { key: 'xp', label: 'XP periode', cls: 'num', render: r => fmt.n(r.xp) }, { key: 'total', label: 'Total XP', cls: 'num', render: r => fmt.n(r.total) }, { key: 'badges', label: 'Badge', cls: 'num' }, { key: 'streak', label: 'Streak', cls: 'num' }],
        csv: r => [r.rank, r.name, r.class, r.level, r.xp, r.total, r.badges, r.streak], head: ['Peringkat', 'Nama', 'Kelas', 'Level', 'XP periode', 'Total XP', 'Badge', 'Streak'] };
      if (tab === 'challenges') cfg = { search: ['title'], filters: [{ key: 'type', label: 'Jenis', options: Object.keys(L.type).map(k => ({ v: k, l: L.type[k] })) }, { key: 'skill', label: 'Skill', options: UI.SKILLS6 }],
        columns: [{ key: 'title', label: 'Tantangan' }, { key: 'type', label: 'Jenis', render: r => esc(L.typeShort[r.type] || r.type) }, { key: 'skill', label: 'Skill' }, { key: 'deadline', label: 'Batas', render: r => r.deadline ? fmt.date(r.deadline) : '-' }, { key: 'submitted', label: 'Mengumpulkan', cls: 'num' }, { key: 'completed', label: 'Selesai', cls: 'num' }, { key: 'rate', label: 'Penyelesaian', render: r => `<div class="row-sm" style="flex-wrap:nowrap"><span class="num small" style="width:36px">${r.rate}%</span><div style="width:80px">${UI.bar(r.rate, 'thin green')}</div></div>` }, { key: 'avg', label: 'Rata nilai', cls: 'num' }],
        csv: r => [r.title, r.type, r.skill, r.deadline ? new Date(r.deadline).toLocaleDateString('id-ID') : '', r.students, r.submitted, r.completed, r.rate, r.avg], head: ['Tantangan', 'Jenis', 'Skill', 'Batas', 'Jumlah siswa', 'Mengumpulkan', 'Selesai', 'Penyelesaian (%)', 'Rata nilai'] };
      const t = UI.table(v.querySelector('#t'), Object.assign({ rows, per: 500, id: tab === 'leaderboard' ? 'id' : 'id' }, cfg));
      v.querySelector('#csv').onclick = () => UI.csvDownload([cfg.head].concat(t.filtered().map(cfg.csv)), 'laporan-' + tab + '.csv');
      v.querySelector('#prt').onclick = () => window.print();
    };
    paint();
  };
})();
