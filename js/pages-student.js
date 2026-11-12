/* Halaman siswa: dashboard, Skill Zone, materi, tantangan, kuis, leaderboard,
   badge, perpustakaan, tugas, notifikasi, profil. */
(function () {
  'use strict';
  const { esc, attr, fmt, toast, L, SKILL } = UI;
  const S = API.Session;
  const R = Pages.route;
  const ST = ['student'], ALL = ['student', 'mentor', 'admin'];
  R('/home', 'stHome', ST);
  R('/skills', 'skills', ALL, '#/skills');
  R('/skills/:skill', 'skillList', ALL, '#/skills');
  R('/material/:id', 'material', ALL, '#/skills');
  R('/challenges', 'challenges', ST);
  R('/challenge/:id', 'challenge', ALL, '#/challenges');
  R('/quiz', 'quiz', ST);
  R('/quiz/:id', 'quizPlay', ST, '#/quiz');
  R('/leaderboard', 'leaderboard', ALL);
  R('/badges', 'badges', ST);
  R('/library', 'library', ALL);
  R('/submissions', 'mySubs', ST);
  R('/notifications', 'notifs', ALL);
  R('/profile', 'profile', ALL);

  const load = (v, n) => { v.innerHTML = `<div class="grid g-4">${UI.skel(4, 110)}</div><div class="grid g-2">${UI.skel(2, 240)}</div>`; };
  const fail = (v, e) => { v.innerHTML = UI.errBox(e.message, true); const b = v.querySelector('[data-retry]'); if (b) b.onclick = () => App.route(); };
  const typeChip = t => `<span class="chip ${t === 'daily' ? 'chip-blue' : t === 'weekly' ? 'chip-purple' : t === 'monthly' ? 'chip-gold' : 'chip-orange'}">${esc(L.type[t] || t)}</span>`;
  const leftChip = c => c.deadline ? `<span class="chip ${c.deadline - Date.now() < 864e5 && c.deadline > Date.now() ? 'chip-orange' : ''} countdown" data-dl="${c.deadline}">${ic('clock')} <span>${fmt.left(c.deadline)}</span></span>` : '';
  function tickCountdowns(v, ctx) {
    const t = setInterval(() => { if (!ctx.alive()) return clearInterval(t); v.querySelectorAll('[data-dl] span').forEach(s => { s.textContent = fmt.left(+s.parentElement.dataset.dl); }); }, 30000);
  }
  const chAction = c => {
    if (c.state === 'completed') return `<a class="btn btn-outline btn-sm" href="#/challenge/${attr(c.id)}">${ic('checkcircle', 'i-sm')} Lihat hasil</a>`;
    if (c.state === 'submitted' || c.state === 'reviewed') return `<a class="btn btn-outline btn-sm" href="#/challenge/${attr(c.id)}">Menunggu penilaian</a>`;
    if (c.state === 'revision') return `<a class="btn btn-sm" href="#/challenge/${attr(c.id)}">${ic('retry', 'i-sm')} Revisi</a>`;
    if (c.state === 'expired') return `<a class="btn btn-ghost btn-sm" href="#/challenge/${attr(c.id)}">Detail</a>`;
    if (c.state === 'upcoming') return `<span class="chip">Dibuka ${fmt.dt(c.start_at)}</span>`;
    return `<a class="btn btn-sm ${c.sub_type === 'quiz' ? 'btn-purple' : ''}" href="#/challenge/${attr(c.id)}">${c.sub_type === 'quiz' ? ic('target', 'i-sm') + ' Mulai kuis' : ic('play', 'i-sm') + ' Mulai'}</a>`;
  };

  /* ============================== DASHBOARD SISWA ============================== */
  Pages.stHome = async function (v, p, ctx) {
    App.setTitle('Overview', [['Dashboard']]);
    load(v);
    let lb = null, data = null, chartMode = 7, skillMode = 'bar';
    Leo.setHint('Kerjakan Daily Challenge dan pelajari Word of the Day agar streak-mu tidak putus.');
    const paint = () => {
      if (!ctx.alive() || !data) return;
      const d = data, me = d.me;
      Object.assign(S.me, me); App.paintMe();
      const span = me.next ? me.next - me.floor : 1, pct = me.next ? ((me.xp - me.floor) / span) * 100 : 100;
      const series = d.series.slice(-chartMode).map(x => ({ v: x.xp, l: chartMode === 7 ? fmt.ymdDay(x.d) : fmt.ymd(x.d) }));
      const weekXp = d.series.slice(-7).reduce((a, x) => a + x.xp, 0);
      const skillVals = UI.SKILLS6.map(k => d.skills[k] || 0);
      const avgSkill = Math.round(skillVals.reduce((a, b) => a + b, 0) / skillVals.length);
      v.innerHTML = `
        <div class="view-h"><div><h2 class="h1">Hi, ${esc(fmt.first(me.name))}</h2><p class="muted">${me.class ? `<span class="chip chip-blue">${esc(me.class)}</span> ` : ''}Keep your learning momentum going today.</p></div></div>
        <div class="grid g-5 kpis">
          ${UI.metric({ icon: 'zap', tone: 'ic-purple', label: 'Total XP', value: fmt.n(me.xp), sub: weekXp ? `${ic('trend', 'i-sm')} +${fmt.n(weekXp)} XP 7 hari terakhir` : 'Mulai kumpulkan XP hari ini', up: weekXp > 0 })}
          ${UI.metric({ icon: 'shield', tone: 'ic-blue', label: 'Level', value: 'Level ' + me.level, sub: esc(me.levelName) })}
          ${UI.metric({ icon: 'flame', tone: 'ic-orange', label: 'Streak', value: me.streak + ' <span class="h3">hari</span>', sub: me.streak ? 'Pertahankan besok!' : 'Belajar hari ini untuk memulai' })}
          ${UI.metric({ icon: 'award', tone: 'ic-gold', label: 'Badge', value: d.badges.earned + '<span class="h3 muted"> / ' + d.badges.total + '</span>', sub: 'badge diraih' })}
          ${UI.metric({ icon: 'flag', tone: 'ic-green', label: 'Tantangan selesai', value: fmt.n(d.challenges.completed), sub: `Harian ${d.challenges.daily}/${d.challenges.dailyTotal} · Mingguan ${d.challenges.weekly}/${d.challenges.weeklyTotal}` })}
        </div>
        <div class="card">
          <div class="row between" style="margin-bottom:12px"><div class="row-sm"><span class="lvl-badge">${me.level}</span><div><span class="eyebrow">Perjalanan level</span><div class="h3">Level ${me.level}: ${esc(me.levelName)}${me.next ? ` <span style="color:var(--purple-ink)">→ Level ${me.level + 1}: ${esc(me.nextName)}</span>` : ''}</div></div></div>
          <a class="btn btn-outline btn-sm" href="#/badges">${ic('award', 'i-sm')} Lihat badge</a></div>
          ${UI.bar(pct, 'grad')}
          <div class="row between xs muted" style="margin-top:6px"><span class="num">${fmt.n(me.xp)} XP</span><span>${me.next ? fmt.n(me.next - me.xp) + ' XP lagi menuju level berikutnya' : 'Level tertinggi tercapai'}</span><span class="num">${me.next ? fmt.n(me.next) + ' XP' : ''}</span></div>
        </div>
        <div class="grid g-3">
          ${dailyCard(d.daily)}
          ${vocabCard(d.vocab)}
          ${weeklyCard(d.weekly)}
        </div>
        <div class="split-r">
          <div class="card">
            <div class="card-h"><div><h3 class="h3">Kemampuan bahasa Inggris</h3><p class="xs muted">Dari materi selesai, akurasi kuis, dan nilai tugas</p></div>
              <div class="row-sm"><span class="chip chip-green">Rata-rata ${avgSkill}</span><div class="tabs" role="tablist"><button role="tab" data-sm="bar" aria-selected="${skillMode === 'bar'}">Bar</button><button role="tab" data-sm="radar" aria-selected="${skillMode === 'radar'}">Radar</button></div></div></div>
            ${skillMode === 'radar' ? UI.chart.radar(skillVals, UI.SKILLS6, { label: 'Radar enam keterampilan' }) :
              `<div class="stack">${UI.SKILLS6.map(k => `<div class="stack-sm"><div class="row between small"><span class="row-sm">${ic(SKILL[k].icon, 'i-sm')} ${k}</span><b class="num">${d.skills[k] || 0}%</b></div>${UI.bar(d.skills[k] || 0, UI.toneBar(SKILL[k].tone))}</div>`).join('')}</div>`}
          </div>
          <div class="card">
            <div class="card-h"><div><h3 class="h3">Perkembangan XP</h3><p class="xs muted">XP yang kamu kumpulkan per hari</p></div>
              <div class="tabs" role="tablist"><button role="tab" data-cm="7" aria-selected="${chartMode === 7}">7 hari</button><button role="tab" data-cm="30" aria-selected="${chartMode === 30}">30 hari</button></div></div>
            ${UI.chart.line(series, { label: 'XP per hari', ticks: chartMode === 7 ? 7 : 6 })}
          </div>
        </div>
        <div class="grid g-3">
          <div class="card" id="lb-mini">${lbMini(lb)}</div>
          <div class="card">
            <div class="card-h"><h3 class="h3">Badge terbaru</h3><a class="small" href="#/badges">${d.badges.earned} dari ${d.badges.total}</a></div>
            ${d.badges.recent.length ? `<div class="grid g-2 keep">${d.badges.recent.map(b => `<div class="badge-tile earned" onclick="location.hash='#/badges'">${UI.badgeMedal(b)}<b>${esc(b.name)}</b></div>`).join('')}</div>` : UI.empty({ title: 'Belum ada badge', text: 'Selesaikan materi pertamamu untuk badge First Step.', expr: 'cheer' })}
          </div>
          <div class="card stack">
            <div class="card-h" style="margin:0"><h3 class="h3">Ringkasan Quiz Arena</h3><a class="small" href="#/quiz">Ikuti kuis</a></div>
            <div class="grid g-2 keep"><div class="card tint pad-sm center"><div class="xs muted">Kuis selesai</div><div class="stat-lg">${d.quiz.done}</div></div><div class="card tint pad-sm center"><div class="xs muted">Rata-rata skor</div><div class="stat-lg" style="color:var(--primary)">${d.quiz.avg}</div></div></div>
            <p class="small muted">XP kuis dihitung dari skor terbaikmu. Ulangi kuis untuk memperbaiki nilai.</p>
            <a class="btn btn-soft" href="#/quiz" style="margin-top:auto">${ic('target', 'i-sm')} Buka Quiz Arena</a>
          </div>
        </div>
        <div class="split-r">
          ${d.feedback ? `<div class="quote"><div class="row-sm">${UI.avatar(d.feedback.by)}<div><b>${esc(d.feedback.by)}</b><div class="xs" style="color:#AEBBDA">Feedback untuk “${esc(d.feedback.challenge)}” · ${fmt.ago(d.feedback.at)}</div></div><span class="chip ${d.feedback.status === 'revision' ? 'pill-revision' : 'chip-green'}" style="margin-left:auto">${d.feedback.status === 'revision' ? 'Perlu revisi' : 'Nilai ' + d.feedback.score}</span></div><blockquote>${esc(d.feedback.feedback)}</blockquote><a class="btn btn-light btn-sm" href="#/submissions" style="width:max-content">Lihat semua tugas</a></div>`
            : `<div class="card row" style="flex-wrap:nowrap"><div class="leo-inline" style="width:90px">${Leo.svg('think')}</div><div class="stack-sm"><b class="h3">Belum ada feedback</b><p class="muted small">Kumpulkan tugas di Challenges. Feedback dari Pembina akan muncul di sini.</p></div></div>`}
          <div class="card"><div class="card-h"><h3 class="h3">Aktivitas terbaru</h3></div>
            ${d.activity.length ? `<div class="feed">${d.activity.map(a => `<div><span class="ic ic-sm ${({ material: 'ic-blue', vocab: 'ic-purple', quiz: 'ic-gold', submission: 'ic-slate', completed: 'ic-green', badge: 'ic-gold' })[a.kind]}">${ic(({ material: 'book', vocab: 'languages', quiz: 'target', submission: 'upload', completed: 'checkcircle', badge: 'award' })[a.kind], 'i-sm')}</span><div class="grow"><div class="small">${esc(a.title)}</div><div class="xs muted">${fmt.ago(a.at)}</div></div>${a.xp ? UI.xpChip(a.xp) : ''}</div>`).join('')}</div>` : '<p class="muted small">Belum ada aktivitas. Mulai dari English Skill Zone.</p>'}
          </div>
        </div>`;
      tickCountdowns(v, ctx);
      v.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { chartMode = +b.dataset.cm; paint(); });
      v.querySelectorAll('[data-sm]').forEach(b => b.onclick = () => { skillMode = b.dataset.sm; paint(); });
      const sp = v.querySelector('[data-speak]'); if (sp) sp.onclick = () => UI.speak(sp.dataset.speak);
      const vl = v.querySelector('[data-learn]');
      if (vl) vl.onclick = () => UI.busy(vl, async () => { const r = await API.act('vocab.learned', {}); UI.reward(r.reward); if (r.reward) { data.vocab.learned = true; paint(); refresh(); } else toast(r.message); });
    };
    function dailyCard(c) {
      if (!c) return `<div class="card stack">${'<span class="eyebrow">Daily Challenge</span>'}<div class="row" style="flex-wrap:nowrap"><div style="width:80px">${Leo.svg('idle')}</div><p class="muted small">Belum ada Daily Challenge hari ini. Cek lagi nanti atau latihan di Skill Zone.</p></div></div>`;
      return `<div class="card stack"><div class="row between"><div class="row-sm">${UI.skillChip(c.skill)}<span class="eyebrow">Daily Challenge</span></div>${leftChip(c)}</div>
        <b class="h3">${esc(c.title)}</b><p class="muted small clamp-2">${esc(c.description)}</p>
        <div class="row-sm">${UI.xpChip(c.xp)}${c.state !== 'open' ? UI.pill(c.state) : ''}</div>
        <div style="margin-top:auto">${chAction(c).replace('btn-sm', 'btn-block')}</div></div>`;
    }
    function vocabCard(w) {
      if (!w) return `<div class="card"><span class="eyebrow">Word of the Day</span><p class="muted small" style="margin-top:8px">Pembina belum menambahkan kosakata.</p></div>`;
      return `<div class="card stack"><div class="row between"><span class="chip chip-green">Word of the Day</span><span class="xs muted">${esc(w.pos)}</span></div>
        <div class="row between" style="flex-wrap:nowrap"><div><div class="word">${esc(w.word)}</div><div class="muted small">${esc(w.phonetic)}</div></div><button class="icon-btn" data-speak="${attr(w.word)}" aria-label="Dengarkan pengucapan">${ic('volume')}</button></div>
        <p class="small"><b>${esc(w.meaning)}</b></p><p class="small muted" style="font-style:italic">“${esc(w.example)}”</p>
        <div style="margin-top:auto">${w.learned ? `<span class="btn btn-outline btn-block" style="pointer-events:none">${ic('checkcircle', 'i-sm')} Sudah dipelajari hari ini</span>` : `<button class="btn btn-outline btn-block" data-learn>${ic('check', 'i-sm')} Tandai sudah dipelajari (+${w.xp} XP)</button>`}</div></div>`;
    }
    function weeklyCard(c) {
      if (!c) return `<div class="card stack"><span class="chip chip-purple" style="width:max-content">Weekly Mission</span><p class="muted small">Belum ada misi mingguan yang aktif.</p></div>`;
      return `<div class="card stack"><div class="row between"><span class="chip chip-purple">Weekly Mission</span>${leftChip(c)}</div>
        <b class="h3">${esc(c.title)}</b><p class="muted small clamp-2">${esc(c.description)}</p>
        <div class="row-sm">${UI.skillChip(c.skill)}${UI.xpChip(c.xp)}${c.state !== 'open' ? UI.pill(c.state) : ''}</div>
        <div style="margin-top:auto">${c.state === 'open' ? `<a class="btn btn-purple btn-block" href="#/challenge/${attr(c.id)}">${ic('arrowr', 'i-sm')} Kerjakan misi</a>` : chAction(c).replace('btn-sm', 'btn-block')}</div></div>`;
    }
    function lbMini(x) {
      if (!x) return `<div class="card-h"><h3 class="h3">${ic('trophy')} Leaderboard minggu ini</h3></div>${UI.skel(3, 44)}`;
      const top = x.list.slice(0, 3);
      return `<div class="card-h"><h3 class="h3">${ic('trophy')} Leaderboard minggu ini</h3><a class="small" href="#/leaderboard">Lihat semua</a></div>
        <div class="stack-sm">${top.map(r => `<div class="lb-row top${r.rank} ${r.id === S.me.id ? 'me' : ''}"><span class="rank r${r.rank}">${r.rank}</span>${UI.avatar(r.name, r.photo, 'av-sm')}<div class="grow" style="min-width:0"><div class="small" style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.name)}</div><div class="xs muted">${esc(r.class || '')}</div></div><span class="xp">${fmt.n(r.xp)} XP</span></div>`).join('') || '<p class="muted small">Belum ada XP minggu ini.</p>'}
        ${x.me && x.me.rank > 3 ? `<div class="center faint">⋯</div><div class="lb-row me"><span class="rank">${x.me.rank}</span>${UI.avatar(x.me.name, x.me.photo, 'av-sm')}<div class="grow"><div class="small" style="font-weight:600">${esc(x.me.name)} <span class="chip chip-blue" style="height:20px">Kamu</span></div><div class="xs muted">${x.me.gap} XP lagi menyusul peringkat ${x.me.rank - 1}</div></div><span class="xp">${fmt.n(x.me.xp)} XP</span></div>` : ''}</div>`;
    }
    const refresh = () => API.swr('st.home', {}, x => { data = x; paint(); }, 0).catch(() => { });
    try {
      const pLb = API.swr('lb.get', { period: 'week', limit: 3 }, x => { lb = x; const el = v.querySelector('#lb-mini'); if (el) el.innerHTML = lbMini(lb); }, 60000).catch(() => { });
      await API.swr('st.home', {}, x => { data = x; paint(); }, 20000);
      await pLb;
    } catch (e) { if (!data) return fail(v, e); }
    // sapaan Leo sekali sehari
    const k = 'ech_greet_' + S.me.id + '_' + new Date().toDateString();
    if (!API.store.get(k) && data) {
      API.store.set(k, '1');
      setTimeout(() => Leo.say(Leo.msg('greet'), 'wave', 4500), 600);
      if (data.daily && data.daily.state === 'open') setTimeout(() => ctx.alive() && Leo.say(Leo.msg('daily'), 'cheer', 4500), 6000);
    }
  };

  /* ============================== SKILL ZONE ============================== */
  Pages.skills = async function (v, p, ctx) {
    App.setTitle('English Skill Zone', [['Belajar']]);
    Leo.setHint('Mulai dari keterampilan yang skornya paling rendah. Sedikit demi sedikit, setiap hari.');
    load(v);
    let diff = '', q = '';
    try {
      await API.swr('skills.overview', {}, d => {
        if (!ctx.alive()) return;
        const six = d.categories.filter(c => UI.SKILLS6.indexOf(c.skill) > -1);
        const pct = d.totals.total ? Math.round(d.totals.done / d.totals.total * 100) : 0;
        v.innerHTML = `
          <div class="hero-card"><div class="row between" style="align-items:center">
            <div class="stack-sm" style="max-width:640px"><span class="eyebrow">Progres belajar</span><h2 class="h1" style="color:#fff">${d.totals.done} dari ${d.totals.total} materi selesai</h2><p class="muted">Pilih keterampilan, pelajari materinya, lalu tandai selesai untuk mendapat XP.</p></div>
            <div class="row" style="gap:24px"><div class="center"><div class="stat-xl" style="color:#fff">${pct}%</div><div class="xs muted">Selesai</div></div><div style="width:110px">${Leo.svg('wave')}</div></div>
          </div><div style="margin-top:14px">${UI.bar(pct, 'grad')}</div></div>
          <div class="toolbar"><div class="input-wrap">${ic('search')}<input class="input" type="search" id="sq" placeholder="Cari materi, misalnya “tenses” atau “speech”" aria-label="Cari materi"></div>
            <div class="tabs" role="tablist" id="sdiff">${['', 'Beginner', 'Intermediate', 'Advanced'].map(x => `<button role="tab" data-d="${x}" aria-selected="${x === diff}">${x || 'Semua level'}</button>`).join('')}</div></div>
          <div id="sres" hidden></div>
          <div id="sgrid"><h2 class="h2" style="margin-bottom:12px">Enam keterampilan inti</h2>
          <div class="grid g-3">${six.map(c => { const s = SKILL[c.skill]; const pc = c.total ? Math.round(c.done / c.total * 100) : 0; return `<a class="card hover stack" href="#/skills/${c.skill}" style="color:inherit;text-decoration:none">
            <div class="row between"><span class="ic sq ${UI.toneIc(s.tone)}">${ic(s.icon)}</span><span class="chip xp-chip">${fmt.n(c.xp)} XP</span></div>
            <div><b class="h3">${c.skill}</b><p class="muted small">${esc(s.desc)}</p></div>
            <div class="stack-sm"><div class="row between xs muted"><span>${c.total} materi · ${c.done} selesai</span><b class="num" style="color:var(--text)">${pc}%</b></div>${UI.bar(pc, 'grad')}</div>
            <span class="btn btn-outline btn-block">${pc ? 'Lanjutkan' : 'Mulai belajar'} ${ic('arrowr', 'i-sm')}</span></a>`; }).join('')}</div></div>
          <div class="grid g-2">
            ${spot(d.pronunciation, 'Pronunciation Lab', 'volume', 'ic-blue')}
            ${spot(d.idiom, 'Idiom of the Week', 'quote', 'ic-gold')}
          </div>
          ${d.next.length ? `<div><div class="row between" style="margin-bottom:12px"><h2 class="h2">Lanjutkan belajar</h2></div><div class="grid g-3">${d.next.map(m => `<a class="card hover stack-sm" href="#/material/${attr(m.id)}" style="color:inherit;text-decoration:none"><div class="row between">${UI.skillChip(m.skill)}<span class="xs muted">${esc(m.difficulty)}</span></div><b class="h3">${esc(m.title)}</b><p class="muted small clamp-2">${esc(m.summary)}</p><div class="row between" style="margin-top:6px">${UI.xpChip(m.xp)}<span class="small" style="color:var(--primary);font-weight:600">Buka ${ic('arrowr', 'i-sm')}</span></div></a>`).join('')}</div></div>` : ''}`;
        const doSearch = async () => {
          const res = v.querySelector('#sres'), grid = v.querySelector('#sgrid');
          if (!q && !diff) { res.hidden = true; grid.hidden = false; return; }
          const all = await API.get('materials.list', {});
          const list = all.filter(m => (!diff || m.difficulty === diff) && (!q || (m.title + ' ' + m.summary + ' ' + m.skill).toLowerCase().includes(q)));
          res.hidden = false; grid.hidden = true;
          res.innerHTML = `<div class="row between" style="margin-bottom:12px"><h2 class="h2">${list.length} materi ditemukan</h2></div>` + (list.length ? `<div class="grid g-3">${list.map(matCard).join('')}</div>` : UI.empty({ title: 'Materi tidak ditemukan', text: 'Coba kata kunci lain.' }));
        };
        let t; v.querySelector('#sq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); clearTimeout(t); t = setTimeout(doSearch, 250); });
        v.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { diff = b.dataset.d; v.querySelectorAll('[data-d]').forEach(x => x.setAttribute('aria-selected', String(x === b))); doSearch(); });
      }, 60000);
    } catch (e) { fail(v, e); }
    function spot(m, label, icon, tone) {
      if (!m) return `<div class="card stack-sm"><span class="row-sm"><span class="ic ic-sm ${tone}">${ic(icon, 'i-sm')}</span><span class="eyebrow">${label}</span></span><p class="muted small">Belum ada materi.</p></div>`;
      return `<div class="card stack"><div class="row between"><span class="row-sm"><span class="ic ic-sm ${tone}">${ic(icon, 'i-sm')}</span><span class="eyebrow" style="color:var(--primary-dark)">${label}</span></span>${UI.xpChip(m.xp)}</div>
        <b class="h2">${esc(m.title)}</b><p class="muted">${esc(m.summary)}</p>
        <div class="row-sm"><a class="btn" href="#/material/${attr(m.id)}">${m.done ? ic('checkcircle', 'i-sm') + ' Ulangi' : ic('play', 'i-sm') + ' Pelajari'}</a>${m.done ? '<span class="chip chip-green">Selesai</span>' : ''}</div></div>`;
    }
  };
  function matCard(m) {
    return `<a class="card hover stack-sm" href="#/material/${attr(m.id)}" style="color:inherit;text-decoration:none">
      <div class="row between"><div class="row-sm">${UI.skillChip(m.skill)}<span class="chip">${esc(m.difficulty)}</span></div>${m.done ? `<span class="chip chip-green">${ic('check')} Selesai</span>` : UI.xpChip(m.xp)}</div>
      <b class="h3">${esc(m.title)}</b><p class="muted small clamp-2">${esc(m.summary)}</p>
      <div class="row-sm xs muted">${ic(({ audio: 'music', video: 'video', file: 'file', link: 'link', text: 'filetext' })[m.type] || 'filetext', 'i-sm')} ${({ audio: 'Audio', video: 'Video', file: 'Berkas', link: 'Tautan', text: 'Bacaan' })[m.type] || 'Bacaan'}</div></a>`;
  }

  Pages.skillList = async function (v, p, ctx) {
    const sk = p[0], s = SKILL[sk] || { icon: 'book', tone: 'blue', desc: '' };
    App.setTitle(sk, [['English Skill Zone', '#/skills'], [sk]]);
    load(v);
    try {
      await API.swr('materials.list', { skill: sk }, list => {
        if (!ctx.alive()) return;
        const done = list.filter(m => m.done).length;
        v.innerHTML = `<div class="card row" style="flex-wrap:nowrap"><span class="ic sq ${UI.toneIc(s.tone)}" style="width:56px;height:56px">${ic(s.icon, 'i-lg')}</span><div class="grow"><h2 class="h1">${esc(sk)}</h2><p class="muted">${esc(s.desc)}</p></div><div class="center"><div class="stat-lg">${done}/${list.length}</div><div class="xs muted">selesai</div></div></div>
          ${list.length ? `<div class="grid g-3">${list.map(matCard).join('')}</div>` : UI.empty({ title: 'Belum ada materi ' + sk, text: 'Pembina akan segera menambahkan materi.' })}`;
      }, 60000);
    } catch (e) { fail(v, e); }
  };

  /* ============================== MATERI ============================== */
  Pages.material = async function (v, p, ctx) {
    v.innerHTML = `<div class="split">${UI.skel(1, 420)}${UI.skel(1, 260)}</div>`;
    let d;
    try { d = await API.get('material.get', { id: p[0] }); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const m = d.material, student = S.me.role === 'student';
    App.setTitle(m.title, [['English Skill Zone', '#/skills'], [m.skill, '#/skills/' + m.skill], ['Materi']]);
    Leo.setHint('Baca pelan-pelan, ucapkan contoh kalimatnya dengan lantang, lalu tandai selesai.');
    const idx = d.siblings.findIndex(x => x.id === m.id), doneN = d.siblings.filter(x => x.done).length;
    v.innerHTML = `<div class="split">
      <div class="stack">
        <div class="card stack">
          <div class="row-sm">${UI.skillChip(m.skill)}<span class="chip">${esc(m.difficulty)}</span>${UI.xpChip(m.xp)}${m.status !== 'published' ? UI.pill(m.status) : ''}${m.done ? '<span class="chip chip-green">' + ic('check') + ' Selesai</span>' : ''}</div>
          <h2 class="h1">${esc(m.title)}</h2>${m.summary ? `<p class="muted">${esc(m.summary)}</p>` : ''}
          ${m.author ? `<div class="row-sm xs muted">${ic('user', 'i-sm')} ${esc(m.author)} · diperbarui ${fmt.date(m.updated_at)}</div>` : ''}
        </div>
        ${m.has_file || m.url ? `<div class="card stack"><div class="row between"><h3 class="h3">${ic(({ audio: 'music', video: 'video' })[m.type] || 'file')} Media pembelajaran</h3>${m.has_file ? `<span class="xs muted">${esc(m.file_name)} · ${fmt.size(m.file_size)}</span>` : ''}</div>
          <div class="media-box" id="media">${m.has_file ? `<button class="btn btn-outline" id="loadf">${ic('download', 'i-sm')} Muat ${m.type === 'audio' ? 'audio' : m.type === 'video' ? 'video' : 'berkas'}</button>` : ''}${m.url ? UI.linkEmbed(m.url) : ''}</div></div>` : ''}
        ${m.body ? `<article class="card"><div class="prose">${UI.md(m.body)}</div></article>` : ''}
        ${student ? `<div class="sticky-bar">
          ${d.prev ? `<a class="btn btn-outline btn-sm" href="#/material/${attr(d.prev)}">${ic('chevl', 'i-sm')} Sebelumnya</a>` : '<span></span>'}
          <span class="xs muted">Materi ${idx + 1} dari ${d.siblings.length}</span>
          <div class="row-sm">${m.done ? `<span class="chip chip-green">${ic('check')} Sudah selesai</span>` : `<button class="btn btn-purple btn-sm" id="mdone">${ic('checkcircle', 'i-sm')} Tandai selesai +${m.xp} XP</button>`}
          ${d.next ? `<a class="btn btn-sm" href="#/material/${attr(d.next)}">Berikutnya ${ic('chevr', 'i-sm')}</a>` : ''}</div></div>` : ''}
      </div>
      <aside class="stack">
        <div class="card"><div class="row between" style="margin-bottom:10px"><span class="eyebrow">Materi ${esc(m.skill)}</span><b class="num">${d.siblings.length ? Math.round(doneN / d.siblings.length * 100) : 0}%</b></div>
          ${UI.bar(d.siblings.length ? doneN / d.siblings.length * 100 : 0, 'grad thin')}
          <div class="stack-sm" style="margin-top:12px">${d.siblings.map((x, i) => `<a href="#/material/${attr(x.id)}" class="row-sm" style="padding:9px 10px;border-radius:10px;border:1px solid ${x.id === m.id ? 'var(--primary)' : 'var(--border)'};background:${x.id === m.id ? 'var(--primary-tint)' : 'transparent'};color:inherit;text-decoration:none;flex-wrap:nowrap">
            <span class="ic ic-sm ${x.done ? 'ic-green' : 'ic-slate'}" style="width:26px;height:26px">${x.done ? ic('check', 'i-sm') : '<span class="xs num">' + (i + 1) + '</span>'}</span><span class="small grow">${esc(x.title)}</span></a>`).join('')}</div></div>
        <a class="btn btn-outline" href="#/skills/${attr(m.skill)}">${ic('arrowl', 'i-sm')} Semua materi ${esc(m.skill)}</a>
      </aside></div>`;
    const lf = v.querySelector('#loadf');
    if (lf) lf.onclick = () => UI.busy(lf, async () => { const f = await UI.loadFile('mat', m.id); lf.outerHTML = UI.mediaHTML(f) + `<button class="btn btn-ghost btn-sm" id="dlf" style="justify-self:start">${ic('download', 'i-sm')} Unduh</button>`; v.querySelector('#dlf').onclick = () => UI.saveBlob(f.blob, f.name); });
    const md = v.querySelector('#mdone');
    if (md) md.onclick = () => UI.busy(md, async () => {
      const r = await API.act('material.complete', { id: m.id });
      if (r.reward) UI.reward(r.reward); else toast(r.message);
      setTimeout(() => { if (ctx.alive()) App.route(); }, 300);
    });
  };

  /* ============================== TANTANGAN ============================== */
  Pages.challenges = async function (v, p, ctx) {
    App.setTitle('Challenges', [['Belajar']]);
    Leo.setHint('Tantangan dengan batas waktu terdekat tampil paling atas. Selesaikan sebelum lewat!');
    load(v);
    let tab = 'all', skill = '', q = '';
    try {
      const [list, lb] = await Promise.all([API.get('challenges.list', {}), API.get('lb.get', { period: 'week', limit: 3 }).catch(() => null)]);
      if (!ctx.alive()) return;
      const open = list.filter(c => c.state === 'open' || c.state === 'revision');
      const featured = open.find(c => c.type === 'daily') || open[0];
      const waiting = list.filter(c => c.state === 'submitted' || c.state === 'reviewed').length;
      const done = list.filter(c => c.state === 'completed').length;
      const paint = () => {
        const f = list.filter(c => (tab === 'all' || c.type === tab) && (!skill || c.skill === skill) && (!q || c.title.toLowerCase().includes(q)));
        const groups = ['daily', 'weekly', 'monthly', 'special'].map(t => [t, f.filter(c => c.type === t)]).filter(g => g[1].length);
        v.querySelector('#chl').innerHTML = groups.length ? groups.map(([t, arr]) => `<div class="stack"><h3 class="h3 row-sm">${ic(t === 'daily' ? 'calendar' : t === 'weekly' ? 'flag' : 'trophy')} ${L.type[t]} <span class="chip">${arr.length}</span></h3>
          <div class="grid g-2">${arr.map(c => `<div class="card stack-sm" style="${c.type === 'weekly' ? 'border-left:4px solid var(--purple)' : c.type === 'special' || c.type === 'monthly' ? 'border-left:4px solid var(--gold)' : ''}">
            <div class="row between">${UI.skillChip(c.skill)}${c.state === 'open' ? leftChip(c) : UI.pill(c.state)}</div>
            <b class="h3">${esc(c.title)}</b><p class="muted small clamp-2">${esc(c.description)}</p>
            <div class="row between" style="margin-top:6px"><div class="row-sm">${UI.xpChip(c.xp)}<span class="xs muted">${esc(L.sub[c.sub_type] || '')}</span>${c.state === 'completed' ? `<span class="chip chip-green">Nilai ${c.score}</span>` : ''}</div>${chAction(c)}</div></div>`).join('')}</div></div>`).join('')
          : UI.empty({ title: 'Tidak ada tantangan', text: tab === 'all' && !skill && !q ? 'Pembina belum menerbitkan tantangan.' : 'Coba filter lain.', expr: 'idle' });
        tickCountdowns(v, ctx);
      };
      v.innerHTML = `
        <div class="grid g-4 kpis">
          ${UI.metric({ icon: 'flame', tone: 'ic-orange', label: 'Streak aktif', value: (S.me.streak || 0) + ' <span class="h3">hari</span>' })}
          ${UI.metric({ icon: 'flag', tone: 'ic-purple', label: 'Tantangan terbuka', value: open.length })}
          ${UI.metric({ icon: 'checkcircle', tone: 'ic-green', label: 'Selesai', value: done })}
          ${UI.metric({ icon: 'clock', tone: 'ic-gold', label: 'Menunggu penilaian', value: waiting })}
        </div>
        <div class="split"><div class="stack">
          ${featured ? `<div class="hero-card stack"><div class="row between"><span class="chip" style="background:var(--primary);color:#fff">${ic('star')} ${esc(L.type[featured.type])} · ${esc(featured.skill)}</span>${featured.deadline ? `<span class="chip chip-orange countdown" data-dl="${featured.deadline}">${ic('clock')} <span>${fmt.left(featured.deadline)}</span></span>` : ''}</div>
            <h2 class="h1" style="color:#fff">${esc(featured.title)}</h2><p class="muted">${esc(featured.description)}</p>
            <div class="row-sm"><span class="chip" style="background:rgba(255,255,255,.1);color:#fff">${ic('zap')} +${featured.xp} XP</span>${featured.state === 'revision' ? '<span class="chip pill-revision">Perlu revisi</span>' : ''}</div>
            <div class="row"><a class="btn" href="#/challenge/${attr(featured.id)}">${ic('play', 'i-sm')} ${featured.state === 'revision' ? 'Kerjakan revisi' : 'Mulai tantangan'}</a></div></div>` : ''}
          <div class="card stack">
            <div class="tabs" role="tablist">${[['all', 'Semua'], ['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan'], ['special', 'Spesial']].map(t => `<button role="tab" data-t="${t[0]}" aria-selected="${t[0] === tab}">${t[1]}${t[0] !== 'all' ? ` <span class="faint">${list.filter(c => c.type === t[0]).length}</span>` : ''}</button>`).join('')}</div>
            <div class="toolbar"><div class="input-wrap">${ic('search')}<input class="input" type="search" id="cq" placeholder="Cari tantangan" aria-label="Cari tantangan"></div>
            <div class="chips-f" id="csk"><button aria-pressed="true" data-s="">Semua skill</button>${UI.SKILLS6.map(s => `<button aria-pressed="false" data-s="${s}">${s}</button>`).join('')}</div></div>
          </div>
          <div class="stack-lg" id="chl"></div>
        </div>
        <aside class="stack">
          ${lb ? `<div class="card"><div class="card-h"><h3 class="h3">${ic('trophy')} Leaderboard minggu ini</h3><a class="small" href="#/leaderboard">Semua</a></div><div class="stack-sm">${lb.list.map(r => `<div class="lb-row top${r.rank} ${r.id === S.me.id ? 'me' : ''}"><span class="rank r${r.rank}">${r.rank}</span><div class="grow small" style="font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.name)}</div><span class="xp">${fmt.n(r.xp)}</span></div>`).join('') || '<p class="muted small">Belum ada XP minggu ini.</p>'}${lb.me && lb.me.rank > 3 ? `<p class="xs muted">Peringkatmu: #${lb.me.rank}</p>` : ''}</div></div>` : ''}
          <div class="card stack-sm"><h3 class="h3">${ic('info')} Aturan pengumpulan</h3>
            <ul class="small muted stack-sm" style="padding-left:18px;margin:0"><li>Rekam suara langsung, unggah berkas, atau tempel tautan Google Drive/YouTube.</li><li>Format: MP3, M4A, WAV, MP4, WEBM, PDF, DOCX, JPG, PNG.</li><li>Tugasmu hanya bisa dilihat kamu, Pembina, dan Admin.</li><li>Lewat batas waktu, tantangan tidak bisa dikumpulkan.</li></ul></div>
        </aside></div>`;
      paint();
      v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; v.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', String(x === b))); paint(); });
      v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { skill = b.dataset.s; v.querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); });
      v.querySelector('#cq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); paint(); });
    } catch (e) { fail(v, e); }
  };

  Pages.challenge = async function (v, p, ctx) {
    v.innerHTML = `<div class="split">${UI.skel(1, 400)}${UI.skel(1, 300)}</div>`;
    let d;
    try { d = await API.get('challenge.get', { id: p[0] }); } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    const c = d.challenge, student = S.me.role === 'student', last = d.submissions[0];
    App.setTitle(c.title, [['Challenges', student ? '#/challenges' : '#/m/challenges'], [L.typeShort[c.type] || c.type]]);
    Leo.setHint(c.skill === 'Speaking' ? 'Hint: rekam 2–3 kali, lalu kirim versi terbaikmu. Bicaralah pelan dan jelas.' : 'Hint: baca rubrik penilaian di kanan sebelum mulai mengerjakan.');
    const st = c.sub_type, rec = { chunks: [], blob: null, mr: null, t0: 0, timer: null };
    let mode = st === 'text' ? 'text' : 'file', picked = null;
    const subBox = () => {
      if (!d.canSubmit) {
        if (st === 'quiz') return `<div class="card stack"><h3 class="h3">${ic('target')} Selesaikan lewat kuis</h3><p class="muted">Tantangan ini selesai otomatis bila skormu di kuis <b>${esc(d.quiz ? d.quiz.title : '')}</b> minimal 60.</p>${c.state === 'completed' ? `<span class="chip chip-green">${ic('check')} Selesai · skor ${c.score}</span>` : student && d.quiz ? `<a class="btn btn-purple" href="#/quiz/${attr(d.quiz.id)}">${ic('play', 'i-sm')} Kerjakan kuis</a>` : ''}</div>`;
        if (!student) return '';
        if (c.state === 'expired') return `<div class="warn-box">${ic('clock')}<span>Batas waktu tantangan ini sudah lewat.</span></div>`;
        if (c.state === 'upcoming') return `<div class="info-box">${ic('calendar')}<span>Tantangan dibuka ${fmt.dt(c.start_at)}.</span></div>`;
        return `<div class="card row" style="flex-wrap:nowrap"><div style="width:80px">${Leo.svg(c.state === 'completed' ? 'happy' : 'idle')}</div><div class="stack-sm"><b class="h3">${c.state === 'completed' ? 'Tantangan selesai!' : 'Tugas sudah dikirim'}</b><p class="muted small">${c.state === 'completed' ? `Nilai ${c.score} · +${c.earned} XP.` : 'Pembina akan menilai tugasmu. Kamu akan mendapat notifikasi.'}</p></div></div>`;
      }
      return `<form class="card stack" id="sf">
        <div class="row between"><h3 class="h3">${ic('upload')} ${c.state === 'revision' ? 'Kirim revisi' : 'Kumpulkan tugas'}</h3>${c.state === 'revision' ? UI.pill('revision') : ''}</div>
        ${st === 'text' ? '' : `<div class="tabs" role="tablist"><button type="button" role="tab" data-m="file" aria-selected="${mode === 'file'}">${ic('mic', 'i-sm')} Rekam / unggah</button><button type="button" role="tab" data-m="link" aria-selected="${mode === 'link'}">${ic('link', 'i-sm')} Tautan Drive / YouTube</button></div>`}
        <div data-pane="file" ${mode === 'file' ? '' : 'hidden'} class="stack">
          ${'MediaRecorder' in window ? `<div class="rec"><button type="button" class="mic" id="rbtn" aria-label="Mulai merekam">${ic('mic', 'i-lg')}</button><div class="grow"><div class="eyebrow" style="color:#FCA5A5" id="rst">Siap merekam</div><div class="time" id="rtime">00:00</div></div><div class="wave" id="rwave">${'<i></i>'.repeat(14)}</div></div>` : ''}
          <label class="drop" id="drop"><input type="file" id="fin" accept="${attr('.' + d.upload.ext.split(',').join(',.'))}">${ic('cloud', 'i-lg')}<b>Seret berkas ke sini atau <span style="color:var(--primary)">pilih berkas</span></b><span class="xs muted">${esc(d.upload.ext.toUpperCase().split(',').join(', '))} · maks. ${d.upload.max_mb} MB</span></label>
          <div id="picked"></div>
        </div>
        <div data-pane="link" ${mode === 'link' ? '' : 'hidden'}>${UI.field({ name: 'link', label: 'Tautan Google Drive atau YouTube', type: 'url', placeholder: 'https://drive.google.com/…', hint: 'Pastikan tautan bisa dibuka oleh Pembina (Siapa saja yang memiliki link).' })}</div>
        <div data-pane="text" ${mode === 'text' ? '' : 'hidden'}>${UI.field({ name: 'text', label: 'Jawabanmu', type: 'textarea', rows: 9, max: 8000, placeholder: 'Write your answer here…' })}<div class="xs muted right" id="wc">0 kata</div></div>
        ${UI.field({ name: 'note', label: 'Catatan untuk Pembina (opsional)', type: 'textarea', rows: 2, max: 1000, placeholder: 'Misalnya: ini rekaman percobaan kedua.' })}
        <div class="stack-sm"><span class="lbl-f">Siapa yang bisa melihat</span>
          <div class="vis-opt" style="border-color:var(--primary);background:var(--primary-tint)">${ic('lock')}<div><b class="small">Privat</b><div class="xs muted">Hanya kamu, Pembina, dan Admin yang dapat melihat tugas ini.</div></div></div>
          <label class="check"><input type="checkbox" name="consent"> <span class="small">Saya bersedia karya ini ditampilkan sebagai karya terbaik bila dipilih Pembina, dengan persetujuan orang tua/wali sesuai aturan sekolah.</span></label></div>
        <div class="row between"><a class="btn btn-ghost" href="#/challenges">${ic('arrowl', 'i-sm')} Kembali</a><button class="btn" type="submit">${ic('send', 'i-sm')} Kirim tugas (+${c.xp} XP)</button></div>
      </form>`;
    };
    v.innerHTML = `<div class="split"><div class="stack">
        <div class="card stack"><div class="row-sm">${UI.skillChip(c.skill)}${typeChip(c.type)}<span class="chip">${esc(c.difficulty)}</span>${UI.xpChip(c.xp)}${c.deadline ? leftChip(c) : ''}${UI.pill(c.state)}</div>
          <h2 class="h1">${esc(c.title)}</h2><p class="muted">${esc(c.description)}</p>
          <div class="row-sm xs muted">${c.deadline ? `${ic('calendar', 'i-sm')} Batas waktu ${fmt.dt(c.deadline)}` : ''}${c.author ? ` · dibuat oleh ${esc(c.author)}` : ''}</div></div>
        <div class="card"><h3 class="h3" style="margin-bottom:10px">${ic('bulb')} Instruksi</h3><div class="prose">${UI.md(c.instructions || c.description)}</div></div>
        ${subBox()}
      </div>
      <aside class="stack">
        ${st !== 'quiz' ? `<div class="card"><div class="card-h"><h3 class="h3">${ic('clipcheck')} Rubrik penilaian</h3><span class="chip chip-blue">${c.rubric.reduce((a, r) => a + r.max, 0)} poin</span></div><div class="stack-sm">${c.rubric.map(r => `<div class="row between card tint pad-sm" style="flex-wrap:nowrap"><span class="small">${esc(r.name)}</span><b class="num small" style="color:var(--primary-dark)">${r.max} poin</b></div>`).join('')}</div></div>` : ''}
        ${d.submissions.length ? `<div class="card"><div class="card-h"><h3 class="h3">Riwayat pengumpulan</h3></div><div class="stack">${d.submissions.map(s => `<div class="stack-sm" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><div class="row between"><span class="small"><b>Percobaan ${s.attempt}</b> · ${fmt.dt(s.submitted_at)}</span>${UI.pill(s.status)}</div>
          ${s.status !== 'submitted' ? `<div class="row-sm small"><b>Nilai ${s.score}</b>${s.xp ? UI.xpChip(s.xp) : ''}</div>` : ''}
          ${s.feedback ? `<div class="info-box">${ic('message')}<span>${esc(s.feedback)}</span></div>` : ''}
          ${s.has_file ? `<button class="btn btn-outline btn-sm" data-pf="${attr(s.id)}" style="justify-self:start">${ic('play', 'i-sm')} Putar / lihat berkas</button><div data-pv="${attr(s.id)}"></div>` : ''}
          ${s.link ? `<a class="small" href="${attr(s.link)}" target="_blank" rel="noopener">${ic('link', 'i-sm')} ${esc(s.link)}</a>` : ''}
          ${s.text ? `<details><summary class="small">Lihat jawaban tulisan</summary><p class="small" style="white-space:pre-wrap;margin-top:6px">${esc(s.text)}</p></details>` : ''}</div>`).join('')}</div></div>` : ''}
        <div class="card stack-sm"><h3 class="h3">${ic('clock')} Penilaian Pembina</h3><p class="small muted">Pembina menilai berdasarkan rubrik dan memberi feedback. Bila diminta revisi, kamu bisa mengirim ulang di halaman ini.</p></div>
      </aside></div>`;
    tickCountdowns(v, ctx);
    v.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => UI.busy(b, async () => { const f = await UI.loadFile('sub', b.dataset.pf); v.querySelector(`[data-pv="${b.dataset.pf}"]`).innerHTML = `<div class="media-box">${UI.mediaHTML(f)}</div>`; b.remove(); }));
    const f = v.querySelector('#sf'); if (!f) return;
    const showPicked = () => {
      const box = v.querySelector('#picked');
      if (!picked) { box.innerHTML = ''; return; }
      const url = URL.createObjectURL(picked);
      box.innerHTML = `<div class="card tint pad-sm stack-sm"><div class="row between" style="flex-wrap:nowrap"><span class="row-sm small" style="min-width:0">${ic(/audio/.test(picked.type) ? 'music' : /video/.test(picked.type) ? 'video' : 'file', 'i-sm')} <b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(picked.name)}</b> <span class="muted">${fmt.size(picked.size)}</span></span><button type="button" class="icon-btn plain" id="unpick" aria-label="Hapus berkas">${ic('trash', 'i-sm')}</button></div>
        ${/^audio\//.test(picked.type) ? `<audio controls src="${url}" style="width:100%"></audio>` : /^video\//.test(picked.type) ? `<video controls src="${url}" style="width:100%;border-radius:10px;max-height:260px"></video>` : ''}</div>`;
      box.querySelector('#unpick').onclick = () => { picked = null; showPicked(); };
    };
    const setFile = file => {
      if (!file) return;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (d.upload.ext.split(',').indexOf(ext) === -1) return toast('Format .' + ext + ' tidak diizinkan.', 'err');
      if (file.size > d.upload.max_mb * 1048576) return toast(`Berkas lebih dari ${d.upload.max_mb} MB. Gunakan tautan Google Drive.`, 'err');
      picked = file; showPicked();
    };
    f.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; f.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-selected', String(x === b))); f.querySelectorAll('[data-pane]').forEach(x => x.hidden = x.dataset.pane !== mode); });
    const drop = f.querySelector('#drop');
    if (drop) {
      f.querySelector('#fin').onchange = e => setFile(e.target.files[0]);
      ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
    }
    const ta = f.querySelector('[name=text]'); if (ta) ta.addEventListener('input', () => { f.querySelector('#wc').textContent = (ta.value.trim().match(/\S+/g) || []).length + ' kata'; });
    const rb = f.querySelector('#rbtn');
    if (rb) rb.onclick = async () => {
      if (rec.mr && rec.mr.state === 'recording') { rec.mr.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
        rec.mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); rec.chunks = [];
        rec.mr.ondataavailable = e => e.data.size && rec.chunks.push(e.data);
        rec.mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop()); clearInterval(rec.timer);
          rb.classList.remove('on'); rb.innerHTML = ic('mic', 'i-lg'); f.querySelector('#rwave').classList.remove('on'); f.querySelector('#rst').textContent = 'Rekaman siap';
          const mt = rec.mr.mimeType || 'audio/webm', ext = /mp4/.test(mt) ? 'm4a' : 'webm';
          const blob = new Blob(rec.chunks, { type: mt });
          setFile(new File([blob], (S.me.username || 'rekaman') + '-' + Date.now() + '.' + ext, { type: /mp4/.test(mt) ? 'audio/mp4' : 'audio/webm' }));
        };
        rec.mr.start(); rec.t0 = Date.now();
        rb.classList.add('on'); rb.innerHTML = ic('square', 'i-lg'); rb.setAttribute('aria-label', 'Hentikan rekaman');
        f.querySelector('#rwave').classList.add('on'); f.querySelector('#rst').textContent = 'Merekam… ketuk untuk berhenti';
        rec.timer = setInterval(() => { const s = (Date.now() - rec.t0) / 1000; f.querySelector('#rtime').textContent = fmt.dur(s).padStart(5, '0'); if (s > 600) rec.mr.stop(); }, 250);
      } catch (e) { toast('Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di browser, atau unggah berkas.', 'err'); }
    };
    f.addEventListener('submit', e => {
      e.preventDefault();
      const fd = UI.formData(f), btn = f.querySelector('button[type=submit]');
      UI.busy(btn, async () => {
        const payload = { challengeId: c.id, note: fd.note, consent: fd.consent };
        if (st === 'text') { if (!fd.text.trim()) throw new Error('Tulis jawabanmu terlebih dahulu.'); payload.text = fd.text; }
        else if (mode === 'link') { if (!/^https:\/\//.test(fd.link)) throw new Error('Tempel tautan yang diawali https://'); payload.link = fd.link; }
        else { if (!picked) throw new Error('Rekam suara atau pilih berkas terlebih dahulu.'); payload.file = { name: picked.name, mime: picked.type, b64: await UI.readB64(picked) }; }
        btn.innerHTML = 'Mengirim…';
        const r = await API.act('submission.create', payload, { timeout: 180000 });
        toast(r.message);
        Leo.say('Great job! Your work is on its way to your mentor.', 'happy', 4000);
        App.route();
      });
    });
  };

  /* ============================== QUIZ ARENA ============================== */
  Pages.quiz = async function (v, p, ctx) {
    App.setTitle('Quiz Arena', [['Belajar']]);
    Leo.setHint('Kuis bisa diulang sesuai kesempatan. XP dihitung dari skor terbaikmu.');
    load(v);
    let tab = 'open';
    try {
      await API.swr('quiz.list', {}, d => {
        if (!ctx.alive()) return;
        const paint = () => {
          const list = d.quizzes.filter(q => tab === 'open' ? (q.left === null || q.left > 0) : q.tries > 0);
          v.querySelector('#ql').innerHTML = list.length ? `<div class="grid g-2">${list.map(q => `<div class="card stack-sm">
            <div class="row between">${UI.skillChip(q.category)}${q.best !== null ? `<span class="chip ${q.best >= 60 ? 'chip-green' : 'chip-orange'}">Terbaik ${q.best}</span>` : '<span class="chip chip-blue">Baru</span>'}</div>
            <b class="h3">${esc(q.title)}</b>${q.description ? `<p class="muted small clamp-2">${esc(q.description)}</p>` : ''}
            <div class="row-sm xs muted">${ic('help', 'i-sm')} ${q.questions} soal · ${ic('clock', 'i-sm')} ${q.time_limit ? q.time_limit + ' menit' : 'tanpa batas'} · ${ic('retry', 'i-sm')} ${q.left === null ? 'tanpa batas percobaan' : 'sisa ' + q.left + ' kesempatan'}</div>
            <div class="row between" style="margin-top:6px">${UI.xpChip(q.xp)}${q.left === 0 ? '<span class="chip">Kesempatan habis</span>' : `<a class="btn btn-sm btn-purple" href="#/quiz/${attr(q.id)}">${ic('play', 'i-sm')} ${q.tries ? 'Coba lagi' : 'Mulai kuis'}</a>`}</div></div>`).join('')}</div>`
            : UI.empty({ title: tab === 'open' ? 'Belum ada kuis' : 'Belum ada kuis yang dikerjakan', text: tab === 'open' ? 'Pembina belum menerbitkan kuis.' : 'Ayo mulai kuis pertamamu.' });
        };
        v.innerHTML = `
          <div class="grid g-3 kpis">
            ${UI.metric({ icon: 'target', tone: 'ic-purple', label: 'Kuis selesai', value: d.stats.completed })}
            ${UI.metric({ icon: 'trend', tone: 'ic-blue', label: 'Rata-rata skor', value: d.stats.avg })}
            ${UI.metric({ icon: 'retry', tone: 'ic-gold', label: 'Total percobaan', value: d.stats.attempts })}
          </div>
          <div class="split"><div class="stack">
            <div class="tabs" role="tablist" style="width:max-content"><button role="tab" data-t="open" aria-selected="true">Tersedia</button><button role="tab" data-t="done" aria-selected="false">Sudah dikerjakan</button></div>
            <div id="ql"></div></div>
            <aside class="stack">
              <div class="card"><h3 class="h3" style="margin-bottom:12px">Akurasi per keterampilan</h3>${d.accuracy.length ? `<div class="stack">${d.accuracy.map(a => `<div class="stack-sm"><div class="row between small"><span>${esc(a.skill)}</span><b class="num">${a.pct}%</b></div>${UI.bar(a.pct, a.pct >= 70 ? 'green' : a.pct >= 50 ? 'gold' : 'orange')}</div>`).join('')}</div>` : '<p class="muted small">Belum ada data. Kerjakan kuis untuk melihat akurasimu.</p>'}</div>
              <div class="card"><h3 class="h3" style="margin-bottom:8px">Riwayat percobaan</h3>${d.history.length ? `<div class="feed">${d.history.map(h => `<div><div class="grow"><div class="small" style="font-weight:600">${esc(h.quiz)}</div><div class="xs muted">${fmt.ago(h.at)} · ${h.correct}/${h.total} benar · ${fmt.dur(h.duration)}</div></div><b class="num" style="color:${h.score >= 60 ? 'var(--success-ink)' : 'var(--warn-ink)'}">${h.score}</b></div>`).join('')}</div>` : '<p class="muted small">Belum ada percobaan.</p>'}</div>
            </aside></div>`;
        paint();
        v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; v.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', String(x === b))); paint(); });
      }, 30000);
    } catch (e) { fail(v, e); }
  };

  Pages.quizPlay = async function (v, p, ctx) {
    App.setTitle('Quiz Arena', [['Quiz Arena', '#/quiz'], ['Mengerjakan']]);
    v.innerHTML = UI.skel(1, 380);
    let d;
    try { d = await API.act('quiz.start', { id: p[0] }); d = d.data; } catch (e) { return fail(v, e); }
    if (!ctx.alive()) return;
    Leo.hide(true);
    Leo.setHint('Hint: baca semua pilihan sebelum menjawab. Kata kunci di soal biasanya menunjuk ke jawaban.');
    const qs = d.questions, ans = qs.map(() => null), t0 = Date.now(), limit = (d.quiz.time_limit || 0) * 60;
    let cur = 0, done = false, timer;
    const paint = () => {
      const q = qs[cur], answered = ans.filter(a => a !== null).length;
      v.innerHTML = `<div class="stack" style="max-width:820px;width:100%;margin:0 auto">
        <div class="card row between"><div class="stack-sm grow"><span class="eyebrow">${esc(d.quiz.category)} · percobaan ${d.attempt}</span><b class="h3">${esc(d.quiz.title)}</b></div>
          ${limit ? `<span class="chip chip-orange" style="height:34px;font-size:14px">${ic('clock')} <span id="qt" class="num">--:--</span></span>` : ''}</div>
        <div class="row between small"><span>Soal <b>${cur + 1}</b> dari ${qs.length}</span><span class="muted">${answered} terjawab</span></div>${UI.bar((cur + 1) / qs.length * 100, 'grad thin')}
        <div class="card stack"><h2 class="h2" style="line-height:1.4">${esc(q.text)}</h2>
          <div class="stack-sm" role="radiogroup" aria-label="Pilihan jawaban">${q.options.map((o, i) => `<button type="button" class="opt" role="radio" data-o="${i}" aria-pressed="${ans[cur] === i}" aria-checked="${ans[cur] === i}"><span class="k">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`).join('')}</div></div>
        <div class="qdots" aria-label="Navigasi soal">${qs.map((_, i) => `<button type="button" data-g="${i}" class="${ans[i] !== null ? 'ans' : ''} ${i === cur ? 'cur' : ''}" aria-label="Soal ${i + 1}">${i + 1}</button>`).join('')}</div>
        <div class="row between"><button class="btn btn-outline" id="qp" ${cur === 0 ? 'disabled' : ''}>${ic('chevl', 'i-sm')} Sebelumnya</button>
          ${cur < qs.length - 1 ? `<button class="btn" id="qn">Berikutnya ${ic('chevr', 'i-sm')}</button>` : `<button class="btn btn-purple" id="qs">${ic('send', 'i-sm')} Kirim jawaban</button>`}</div></div>`;
      v.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { ans[cur] = +b.dataset.o; if (cur < qs.length - 1) setTimeout(() => { cur++; paint(); }, 220); else paint(); });
      v.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { cur = +b.dataset.g; paint(); });
      const qp = v.querySelector('#qp'); if (qp) qp.onclick = () => { cur--; paint(); };
      const qn = v.querySelector('#qn'); if (qn) qn.onclick = () => { cur++; paint(); };
      const qsb = v.querySelector('#qs'); if (qsb) qsb.onclick = () => submit(false);
      tick();
    };
    const tick = () => { const el = v.querySelector('#qt'); if (!el) return; const left = limit - (Date.now() - t0) / 1000; el.textContent = fmt.dur(left); if (left <= 0 && !done) submit(true); };
    if (limit) timer = setInterval(() => { if (!ctx.alive()) return clearInterval(timer); tick(); }, 1000);
    async function submit(auto) {
      if (done) return;
      const empty = ans.filter(a => a === null).length;
      if (!auto && empty && !(await UI.confirmBox({ title: 'Kirim jawaban?', text: `Masih ada ${empty} soal yang belum dijawab. Soal kosong dihitung salah.`, ok: 'Kirim sekarang' }))) return;
      done = true; clearInterval(timer);
      v.innerHTML = `<div class="boot" style="min-height:300px"><div class="leo-load">${Leo.svg('think')}</div><span>Menilai jawabanmu…</span></div>`;
      try {
        const r = await API.act('quiz.submit', { id: d.quiz.id, token: d.token, answers: ans });
        if (!ctx.alive()) return;
        result(r.data, r.reward);
      } catch (e) { done = false; fail(v, e); }
    }
    function result(x, reward) {
      const pass = x.score >= 60;
      v.innerHTML = `<div class="stack" style="max-width:860px;width:100%;margin:0 auto">
        <div class="card"><div class="row" style="gap:24px;align-items:center">
          <div class="ring" style="--p:${x.score};--c:${pass ? 'var(--success)' : 'var(--streak)'}"><div><div class="stat-xl">${x.score}</div><div class="xs muted">skor</div></div></div>
          <div class="stack-sm grow"><span class="eyebrow">${esc(d.quiz.title)}</span><h2 class="h1">${x.score === 100 ? 'Perfect score!' : pass ? 'Great work!' : 'Keep practicing!'}</h2>
            <div class="row-sm"><span class="chip chip-green">${ic('check')} ${x.correct} benar</span><span class="chip chip-red">${ic('x')} ${x.total - x.correct} salah</span><span class="chip">${ic('clock')} ${fmt.dur(x.duration)}</span>${x.xp ? UI.xpChip(x.xp) : '<span class="chip">0 XP (skor tidak melebihi skor terbaikmu)</span>'}</div>
            ${x.late ? '<div class="warn-box">' + ic('clock') + '<span>Waktu habis, sehingga XP tidak diberikan untuk percobaan ini.</span></div>' : ''}
            ${x.challengesDone.length ? `<div class="info-box">${ic('flag')}<span>Tantangan selesai: ${x.challengesDone.map(esc).join(', ')}</span></div>` : ''}</div>
          <div style="width:120px">${Leo.svg(pass ? 'celebrate' : 'oops')}</div></div>
          <div class="row" style="margin-top:16px"><a class="btn btn-outline" href="#/quiz">${ic('arrowl', 'i-sm')} Kembali ke Quiz Arena</a>${x.left === null || x.left > 0 ? `<a class="btn btn-purple" href="#/quiz/${attr(d.quiz.id)}" id="again">${ic('retry', 'i-sm')} Coba lagi${x.left ? ' (' + x.left + ' kesempatan)' : ''}</a>` : ''}<a class="btn btn-ghost" href="#/leaderboard">${ic('chart', 'i-sm')} Leaderboard</a></div></div>
        <h2 class="h2">Pembahasan</h2>
        ${x.review.map((r, i) => `<div class="card stack-sm"><div class="row between"><b class="small">Soal ${i + 1}</b>${r.correct ? '<span class="chip chip-green">Benar</span>' : '<span class="chip chip-red">Salah</span>'}</div><p style="font-weight:600">${esc(r.text)}</p>
          <div class="stack-sm">${r.options.map((o, k) => `<div class="opt ${k === r.answer ? 'correct' : k === r.picked ? 'wrong' : ''}" style="cursor:default;min-height:46px;padding:10px 14px"><span class="k">${String.fromCharCode(65 + k)}</span><span>${esc(o)}</span></div>`).join('')}</div>
          ${r.explain ? `<div class="info-box">${ic('bulb')}<span>${esc(r.explain)}</span></div>` : ''}</div>`).join('')}</div>`;
      const ag = v.querySelector('#again'); if (ag) ag.onclick = e => { e.preventDefault(); App.route(); };
      Leo.hide(false); Leo.say(Leo.msg(pass ? 'pass' : 'retry'), pass ? 'celebrate' : 'oops', 5000);
      if (reward) setTimeout(() => UI.reward(reward), 400);
      else if (x.score === 100) UI.confetti();
    }
    paint();
  };

  /* ============================== LEADERBOARD ============================== */
  Pages.leaderboard = async function (v, p, ctx) {
    App.setTitle('Leaderboard', [['Kompetisi']]);
    let period = 'week', cls = '';
    const paint = d => {
      if (!ctx.alive()) return;
      const top = d.list.slice(0, 3), rest = d.list.slice(3), me = d.me;
      const pod = (r, k) => r ? `<div class="pod p${k}">${k === 1 ? `<span class="crown">${ic('crown', 'i-lg')}</span>` : ''}<span class="chip ${k === 1 ? 'chip-gold' : ''}" style="${k === 2 ? 'background:#EEF2F7;color:#475569' : k === 3 ? 'background:#FEF3E2;color:#B45309' : ''}">#${k} ${k === 1 ? 'Gold' : k === 2 ? 'Silver' : 'Bronze'}</span>${UI.avatar(r.name, r.photo, 'av-lg')}<div class="nm">${esc(r.name)}</div><div class="xs muted">${esc(r.class || '')} · Lv ${r.level}</div><div class="stat-lg">${fmt.n(r.xp)}</div><div class="xs muted">XP ${period === 'all' ? 'total' : 'periode ini'}</div></div>` : '<div></div>';
      v.innerHTML = `<div class="view-h"><div><h2 class="h1">Peringkat anggota</h2><p class="muted">Berdasarkan XP yang dikumpulkan. Hanya nama, kelas, level, dan XP yang ditampilkan.</p></div>
        <div class="row"><div class="tabs" role="tablist">${[['day', 'Hari ini'], ['week', 'Minggu ini'], ['month', 'Bulan ini'], ['all', 'Sepanjang waktu']].map(t => `<button role="tab" data-p="${t[0]}" aria-selected="${t[0] === period}">${t[1]}</button>`).join('')}</div>
        <select class="select" id="lbc" aria-label="Filter kelas" style="width:auto"><option value="">Semua kelas</option>${d.classes.map(c => `<option ${c === cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div></div>
        ${d.list.length ? `<div class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</div>
        ${me && S.me.role === 'student' ? `<div class="hero-card row between"><div class="row-sm"><span class="rank" style="background:var(--primary);color:#fff;width:40px;height:40px">#${me.rank}</span><div><b style="font-family:var(--display)">Posisimu: peringkat ${me.rank} dari ${d.count}</b><div class="xs muted">${me.rank > 1 ? `${fmt.n(me.gap)} XP lagi untuk menyalip peringkat ${me.rank - 1}` : 'Kamu di puncak! Pertahankan.'}</div></div></div><span class="stat-lg" style="color:#fff">${fmt.n(me.xp)} XP</span></div>` : ''}
        <div class="stack-sm">${rest.map(r => `<div class="lb-row ${r.id === S.me.id ? 'me' : ''}"><span class="rank">${r.rank}</span>${UI.avatar(r.name, r.photo, 'av-sm')}<div class="grow" style="min-width:0"><div class="small" style="font-weight:600">${esc(r.name)}${r.id === S.me.id ? ' <span class="chip chip-blue" style="height:20px">Kamu</span>' : ''}</div><div class="xs muted">${esc(r.class || '')} · Level ${r.level}</div></div><span class="chip chip-hide" title="Badge">${ic('award')} ${r.badges}</span>${r.streak ? `<span class="chip streak-chip chip-hide">${ic('flame')} ${r.streak}</span>` : ''}<span class="xp">${fmt.n(r.xp)} XP</span></div>`).join('')}</div>`
        : UI.empty({ title: 'Belum ada peringkat', text: 'Leaderboard muncul setelah anggota mengumpulkan XP.' })}`;
      v.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { period = b.dataset.p; go(); });
      v.querySelector('#lbc').onchange = e => { cls = e.target.value; go(); };
    };
    const go = () => API.swr('lb.get', { period, cls }, paint, 60000).catch(e => fail(v, e));
    load(v); await go();
  };

  /* ============================== BADGE ============================== */
  Pages.badges = async function (v, p, ctx) {
    App.setTitle('Badges & Achievements', [['Pencapaian']]);
    load(v);
    let cat = 'all';
    try {
      await API.swr('badges.mine', {}, d => {
        if (!ctx.alive()) return;
        const earned = d.badges.filter(b => b.earned), locked = d.badges.filter(b => !b.earned);
        const paint = () => {
          const list = cat === 'earned' ? earned : cat === 'locked' ? locked : d.badges;
          v.querySelector('#bg').innerHTML = list.length ? list.map(b => `<button type="button" class="badge-tile ${b.earned ? 'earned' : 'locked'} ${b.earned && Date.now() - b.at < 864e5 ? 'new' : ''}" data-b="${attr(b.id)}">${b.earned ? '' : `<span style="position:absolute;top:10px;right:10px" class="faint">${ic('lock', 'i-sm')}</span>`}${UI.badgeMedal(b)}<b>${esc(b.name)}</b><small>${b.earned ? 'Diraih ' + fmt.date(b.at) : b.manual ? 'Diberikan Pembina' : `${fmt.n(b.cur)} / ${fmt.n(b.target)}`}</small>${!b.earned && !b.manual ? UI.bar(b.cur / b.target * 100, 'thin purple') : ''}</button>`).join('') : `<div style="grid-column:1/-1">${UI.empty({ title: 'Belum ada', expr: 'cheer' })}</div>`;
          v.querySelectorAll('[data-b]').forEach(el => el.onclick = () => {
            const b = d.badges.find(x => x.id === el.dataset.b);
            UI.modal({ title: b.name, size: 'sm', body: `<div class="lvl-up"><div class="badge-tile ${b.earned ? 'earned' : 'locked'}" style="border:0;background:none;cursor:default">${UI.badgeMedal(b)}</div><p>${esc(b.description)}</p>${b.earned ? `<span class="chip chip-green">${ic('check')} Diraih ${fmt.date(b.at)}</span>${b.note ? `<p class="small muted">“${esc(b.note)}”</p>` : ''}` : b.manual ? '<span class="chip">Diberikan langsung oleh Pembina</span>' : `<div style="width:100%" class="stack-sm"><div class="row between small"><span>Progres</span><b>${fmt.n(b.cur)} / ${fmt.n(b.target)}</b></div>${UI.bar(b.cur / b.target * 100, 'grad')}</div>`}</div>` });
          });
        };
        const st = d.stats;
        v.innerHTML = `<div class="grid g-4 kpis">
            ${UI.metric({ icon: 'award', tone: 'ic-gold', label: 'Badge diraih', value: earned.length + '<span class="h3 muted"> / ' + d.badges.length + '</span>' })}
            ${UI.metric({ icon: 'book', tone: 'ic-blue', label: 'Materi selesai', value: st.materials })}
            ${UI.metric({ icon: 'flag', tone: 'ic-green', label: 'Tantangan selesai', value: st.challenges })}
            ${UI.metric({ icon: 'target', tone: 'ic-purple', label: 'Kuis berbeda', value: st.quizzes })}
          </div>
          <div class="card stack"><div class="row between"><h2 class="h2">Koleksi badge</h2><div class="tabs" role="tablist">${[['all', 'Semua'], ['earned', 'Diraih'], ['locked', 'Belum']].map(t => `<button role="tab" data-c="${t[0]}" aria-selected="${t[0] === cat}">${t[1]}</button>`).join('')}</div></div>
          <div class="grid g-5" id="bg"></div></div>
          ${locked.filter(b => !b.manual).length ? `<div class="card"><h2 class="h2" style="margin-bottom:12px">Paling dekat untuk diraih</h2><div class="stack">${locked.filter(b => !b.manual).sort((a, b) => b.cur / b.target - a.cur / a.target).slice(0, 4).map(b => `<div class="row" style="flex-wrap:nowrap"><span class="badge-tile locked" style="padding:4px;border:0;background:none">${UI.badgeMedal(b)}</span><div class="grow stack-sm"><div class="row between small"><b>${esc(b.name)}</b><span class="num">${fmt.n(b.cur)} / ${fmt.n(b.target)}</span></div>${UI.bar(b.cur / b.target * 100, 'grad thin')}<span class="xs muted">${esc(b.description)}</span></div></div>`).join('')}</div></div>` : ''}`;
        paint();
        v.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cat = b.dataset.c; v.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-selected', String(x === b))); paint(); });
      }, 30000);
    } catch (e) { fail(v, e); }
  };

  /* ============================== PERPUSTAKAAN ============================== */
  Pages.library = async function (v, p, ctx) {
    App.setTitle('Digital Library', [['Belajar']]);
    load(v);
    let type = '', skill = '', q = '';
    try {
      await API.swr('library.list', {}, list => {
        if (!ctx.alive()) return;
        const paint = () => {
          const f = list.filter(m => (!type || m.type === type) && (!skill || m.skill === skill) && (!q || (m.title + ' ' + m.summary).toLowerCase().includes(q)));
          v.querySelector('#lg').innerHTML = f.length ? `<div class="grid g-3">${f.map(m => `<div class="card stack-sm">
            <div class="row between"><span class="ic sq ${({ audio: 'ic-green', video: 'ic-red', file: 'ic-blue', link: 'ic-purple', text: 'ic-gold' })[m.type] || 'ic-blue'}">${ic(({ audio: 'music', video: 'video', file: /pdf/.test(m.file_mime) ? 'filetext' : 'file', link: 'link', text: 'filetext' })[m.type] || 'file')}</span>${UI.skillChip(m.skill)}</div>
            <b class="h3">${esc(m.title)}</b><p class="muted small clamp-2">${esc(m.summary)}</p>
            <div class="xs muted">${esc(m.author || 'English Club')} · ${fmt.date(m.updated_at)}${m.has_file ? ' · ' + fmt.size(m.file_size) : ''}</div>
            <div class="row-sm" style="margin-top:6px"><a class="btn btn-sm" href="#/material/${attr(m.id)}">${ic('eye', 'i-sm')} Buka</a>${m.has_file ? `<button class="btn btn-sm btn-outline" data-dl="${attr(m.id)}">${ic('download', 'i-sm')} Unduh</button>` : ''}${m.url ? `<a class="btn btn-sm btn-ghost" href="${attr(m.url)}" target="_blank" rel="noopener">${ic('external', 'i-sm')} Tautan</a>` : ''}</div></div>`).join('')}</div>`
            : UI.empty({ title: 'Tidak ada materi', text: list.length ? 'Coba filter lain.' : 'Pembina belum menambahkan materi ke perpustakaan.' });
          v.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => UI.busy(b, async () => { const f = await UI.loadFile('mat', b.dataset.dl); UI.saveBlob(f.blob, f.name); }));
        };
        v.innerHTML = `<div class="view-h"><div><h2 class="h1">Digital Library</h2><p class="muted">${list.length} materi, e-book, worksheet, audio, dan video untuk anggota.</p></div></div>
          <div class="card stack"><div class="toolbar"><div class="input-wrap">${ic('search')}<input class="input" type="search" id="lq" placeholder="Cari judul atau topik" aria-label="Cari"></div>
            <select class="select" id="lsk" aria-label="Keterampilan"><option value="">Semua keterampilan</option>${Object.keys(SKILL).map(s => `<option>${s}</option>`).join('')}</select></div>
            <div class="chips-f">${[['', 'Semua'], ['text', 'Bacaan'], ['file', 'Dokumen'], ['audio', 'Audio'], ['video', 'Video'], ['link', 'Tautan']].map(t => `<button data-ty="${t[0]}" aria-pressed="${t[0] === type}">${t[1]}</button>`).join('')}</div></div>
          <div id="lg"></div>`;
        paint();
        v.querySelector('#lq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); paint(); });
        v.querySelector('#lsk').onchange = e => { skill = e.target.value; paint(); };
        v.querySelectorAll('[data-ty]').forEach(b => b.onclick = () => { type = b.dataset.ty; v.querySelectorAll('[data-ty]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); });
      }, 60000);
    } catch (e) { fail(v, e); }
  };

  /* ============================== TUGAS SAYA ============================== */
  Pages.mySubs = async function (v, p, ctx) {
    App.setTitle('Tugas Saya', [['Belajar']]);
    load(v);
    let st = '';
    try {
      await API.swr('submissions.mine', {}, list => {
        if (!ctx.alive()) return;
        const c = s => list.filter(x => x.status === s).length;
        const paint = () => {
          const f = list.filter(x => !st || x.status === st);
          v.querySelector('#sl').innerHTML = f.length ? `<div class="stack-sm">${f.map(s => `<button type="button" class="card hover row" data-s="${attr(s.id)}" style="text-align:left;width:100%;flex-wrap:nowrap;font:inherit;color:inherit">
            <span class="ic ${s.status === 'completed' ? 'ic-green' : s.status === 'revision' ? 'ic-orange' : 'ic-slate'}">${ic(s.has_file ? 'music' : s.link ? 'link' : 'filetext')}</span>
            <div class="grow" style="min-width:0"><b class="small" style="display:block">${esc(s.challenge)}</b><span class="xs muted">${esc(s.skill)} · percobaan ${s.attempt} · ${fmt.dt(s.submitted_at)}</span></div>
            ${s.feedback ? `<span class="chip chip-hide">${ic('message')} Feedback</span>` : ''}${s.status !== 'submitted' ? `<b class="num">${s.score}</b>` : ''}${UI.pill(s.status)}</button>`).join('')}</div>`
            : UI.empty({ title: 'Belum ada tugas', text: 'Kerjakan tantangan untuk mulai mengumpulkan tugas.', action: '<a class="btn" href="#/challenges">Lihat tantangan</a>' });
          v.querySelectorAll('[data-s]').forEach(b => b.onclick = () => openSub(list.find(x => x.id === b.dataset.s)));
        };
        v.innerHTML = `<div class="grid g-4 kpis">
            ${UI.metric({ icon: 'upload', tone: 'ic-blue', label: 'Total dikirim', value: list.length })}
            ${UI.metric({ icon: 'clock', tone: 'ic-slate', label: 'Menunggu penilaian', value: c('submitted') + c('reviewed') })}
            ${UI.metric({ icon: 'retry', tone: 'ic-orange', label: 'Perlu revisi', value: c('revision') })}
            ${UI.metric({ icon: 'checkcircle', tone: 'ic-green', label: 'Selesai', value: c('completed') })}</div>
          <div class="info-box">${ic('lock')}<span>Nilai, feedback, dan rekamanmu bersifat privat: hanya kamu, Pembina, dan Admin yang dapat melihatnya.</span></div>
          <div class="chips-f">${[['', 'Semua'], ['submitted', 'Dikirim'], ['reviewed', 'Dinilai'], ['revision', 'Perlu revisi'], ['completed', 'Selesai']].map(t => `<button data-f="${t[0]}" aria-pressed="${t[0] === st}">${t[1]}</button>`).join('')}</div>
          <div id="sl"></div>`;
        paint();
        v.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { st = b.dataset.f; v.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); });
      }, 20000);
    } catch (e) { fail(v, e); }
    function openSub(s) {
      const max = s.rubric.reduce((a, r) => a + r.max, 0);
      const dr = UI.drawer({ title: s.challenge, sub: `${esc(s.skill)} · percobaan ${s.attempt} · ${fmt.dt(s.submitted_at)}`, body: `
        <div class="row-sm">${UI.pill(s.status)}${s.status !== 'submitted' ? `<span class="chip chip-blue">Nilai ${s.score}</span>` : ''}${s.xp ? UI.xpChip(s.xp) : ''}</div>
        <div class="stack-sm"><span class="lbl-f">Tugas yang dikirim</span>
          ${s.has_file ? `<div class="media-box" id="dmf"><button class="btn btn-outline btn-sm" id="dml">${ic('play', 'i-sm')} Putar / lihat ${esc(s.file_name)}</button></div>` : ''}
          ${s.link ? `<a href="${attr(s.link)}" target="_blank" rel="noopener" class="small">${ic('link', 'i-sm')} ${esc(s.link)}</a>` : ''}
          ${s.text ? `<div class="card tint pad-sm small" style="white-space:pre-wrap">${esc(s.text)}</div>` : ''}
          ${s.note ? `<p class="small muted">Catatan: ${esc(s.note)}</p>` : ''}</div>
        ${s.rubric_scores.length ? `<div class="stack-sm"><span class="lbl-f">Rincian rubrik</span>${s.rubric.map((r, i) => `<div class="stack-sm"><div class="row between small"><span>${esc(r.name)}</span><b class="num">${s.rubric_scores[i] || 0} / ${r.max}</b></div>${UI.bar((s.rubric_scores[i] || 0) / r.max * 100, 'thin')}</div>`).join('')}<div class="row between small"><b>Total</b><b class="num">${s.rubric_scores.reduce((a, b) => a + b, 0)} / ${max} → nilai ${s.score}</b></div></div>` : ''}
        ${s.feedback ? `<div class="quote"><span class="eyebrow" style="color:#AEBBDA">Feedback ${esc(s.reviewer || 'Pembina')} · ${fmt.ago(s.reviewed_at)}</span><blockquote>${esc(s.feedback)}</blockquote></div>` : ''}`,
        foot: s.status === 'revision' ? `<a class="btn" href="#/challenge/${attr(s.challenge_id)}">${ic('retry', 'i-sm')} Kirim revisi</a>` : `<a class="btn btn-outline" href="#/challenge/${attr(s.challenge_id)}">Buka tantangan</a>` });
      const b = dr.el.querySelector('#dml');
      if (b) b.onclick = () => UI.busy(b, async () => { const f = await UI.loadFile('sub', s.id); dr.el.querySelector('#dmf').innerHTML = UI.mediaHTML(f); });
    }
  };

  /* ============================== NOTIFIKASI ============================== */
  const NI = { challenge_new: ['flag', 'ic-blue'], deadline: ['clock', 'ic-orange'], submitted: ['upload', 'ic-slate'], graded: ['checkcircle', 'ic-green'], revision: ['retry', 'ic-orange'],
    badge: ['award', 'ic-gold'], level: ['shield', 'ic-purple'], xp: ['zap', 'ic-purple'], announcement: ['megaphone', 'ic-blue'], meeting: ['calendar', 'ic-purple'], sub_new: ['inbox', 'ic-blue'] };
  Pages.notifs = async function (v, p, ctx) {
    App.setTitle('Notifikasi', [['Akun']]);
    load(v);
    let tab = 'all';
    try {
      const [d, ann] = await Promise.all([API.get('notif.list', {}), API.get('announcements.list', {}).catch(() => [])]);
      if (!ctx.alive()) return;
      App.setBell(d.unread);
      const paint = () => {
        const list = d.items.filter(n => tab === 'all' || !n.read);
        v.innerHTML = `<div class="split"><div class="stack">
          <div class="row between"><div class="tabs" role="tablist"><button role="tab" data-t="all" aria-selected="${tab === 'all'}">Semua</button><button role="tab" data-t="unread" aria-selected="${tab === 'unread'}">Belum dibaca ${d.unread ? `<span class="cnt">${d.unread}</span>` : ''}</button></div>
          <button class="btn btn-outline btn-sm" id="rall" ${d.unread ? '' : 'disabled'}>${ic('check', 'i-sm')} Tandai semua dibaca</button></div>
          <div class="card pad-0">${list.length ? list.map(n => { const k = NI[n.type] || ['bell', 'ic-slate']; return `<a href="${attr(n.link || '#/notifications')}" data-n="${attr(n.id)}" class="row" style="padding:14px 18px;border-bottom:1px solid var(--border);color:inherit;text-decoration:none;flex-wrap:nowrap;background:${n.read ? 'transparent' : 'var(--primary-tint)'}">
            <span class="ic ic-sm ${k[1]}">${ic(k[0], 'i-sm')}</span><div class="grow" style="min-width:0"><b class="small" style="display:block">${esc(n.title)}</b><span class="small muted">${esc(n.body)}</span></div><span class="xs muted nowrap">${fmt.ago(n.at)}</span>${n.read ? '' : '<span class="dot" style="color:var(--primary)"></span>'}</a>`; }).join('') : UI.empty({ title: tab === 'all' ? 'Belum ada notifikasi' : 'Semua sudah dibaca', expr: 'happy' })}</div></div>
          <aside class="card"><div class="card-h"><h3 class="h3">${ic('megaphone')} Pengumuman klub</h3></div>${ann.length ? `<div class="stack">${ann.slice(0, 6).map(a => `<div class="stack-sm" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><div class="row between"><span class="chip ${a.type === 'meeting' ? 'chip-purple' : 'chip-blue'}">${a.type === 'meeting' ? 'Pertemuan' : 'Pengumuman'}</span><span class="xs muted">${fmt.date(a.created_at)}</span></div><b class="small">${esc(a.title)}</b>${a.body ? `<p class="small muted">${esc(a.body)}</p>` : ''}${a.event_at ? `<span class="xs">${ic('clock', 'i-sm')} ${fmt.dt(a.event_at)}${a.location ? ' · ' + esc(a.location) : ''}</span>` : ''}</div>`).join('')}</div>` : '<p class="muted small">Belum ada pengumuman.</p>'}</aside></div>`;
        v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; paint(); });
        v.querySelector('#rall').onclick = e => UI.busy(e.currentTarget, async () => { await API.act('notif.read', { all: true }); d.items.forEach(n => n.read = true); d.unread = 0; App.setBell(0); paint(); });
        v.querySelectorAll('[data-n]').forEach(a => a.addEventListener('click', () => { const n = d.items.find(x => x.id === a.dataset.n); if (n && !n.read) { API.call('notif.read', { ids: [n.id] }); App.setBell(Math.max(0, d.unread - 1)); } }));
      };
      paint();
    } catch (e) { fail(v, e); }
  };

  /* ============================== PROFIL ============================== */
  Pages.profile = async function (v, p, ctx) {
    App.setTitle('Profil & pengaturan', [['Akun']]);
    const me = S.me;
    const paint = () => {
      v.innerHTML = `<div class="split-r"><div class="stack">
        <div class="card row" style="flex-wrap:nowrap;gap:18px"><div style="position:relative">${UI.avatar(me.name, me.photo, 'av-lg')}</div>
          <div class="stack-sm grow"><h2 class="h1">${esc(me.name)}</h2><div class="row-sm"><span class="chip">${ic('user')} @${esc(me.username)}</span><span class="chip chip-blue">${esc(UI.L.role[me.role])}</span>${me.class ? `<span class="chip">${esc(me.class)}</span>` : ''}</div>
          <div class="row-sm"><label class="btn btn-outline btn-sm" style="cursor:pointer">${ic('image', 'i-sm')} Ganti foto<input type="file" accept="image/*" id="ph" hidden></label>${me.photo ? `<button class="btn btn-ghost btn-sm" id="phx">Hapus foto</button>` : ''}</div></div></div>
        ${me.role === 'student' ? `<div class="grid g-3 kpis">${UI.metric({ icon: 'zap', tone: 'ic-purple', label: 'Total XP', value: fmt.n(me.xp) })}${UI.metric({ icon: 'shield', tone: 'ic-blue', label: 'Level', value: me.level, sub: esc(me.levelName) })}${UI.metric({ icon: 'flame', tone: 'ic-orange', label: 'Streak', value: me.streak || 0, sub: 'hari' })}</div>` : ''}
        <form class="card stack" id="pf"><h3 class="h3">Privasi & tampilan</h3>
          ${me.role === 'student' ? UI.field({ name: 'show_photo', type: 'switch', label: 'Tampilkan foto profil di leaderboard', value: me.show_photo }) + UI.field({ name: 'show_class', type: 'switch', label: 'Tampilkan kelas di leaderboard', value: me.show_class !== false }) : ''}
          ${UI.field({ name: 'mascot_on', type: 'switch', label: 'Tampilkan Leo, maskot English Club', hint: 'Leo menyapa, memberi petunjuk, dan merayakan pencapaianmu.', value: me.mascot_on !== false })}
          ${UI.field({ name: 'reduce_motion', type: 'switch', label: 'Kurangi animasi', hint: 'Matikan efek gerak dan konfeti agar lebih ringan di HP.', value: me.reduce_motion })}
          <div><button class="btn" type="submit">Simpan</button></div></form>
      </div><div class="stack">
        <form class="card stack" id="cpf"><h3 class="h3">${ic('key')} Ganti kata sandi</h3>
          ${UI.field({ name: 'old', type: 'password', label: 'Kata sandi saat ini', autocomplete: 'current-password' })}
          ${UI.field({ name: 'new', type: 'password', label: 'Kata sandi baru', hint: 'Minimal 8 karakter, huruf dan angka.', autocomplete: 'new-password' })}
          ${UI.field({ name: 'confirm', type: 'password', label: 'Ulangi kata sandi baru', autocomplete: 'new-password' })}
          <div><button class="btn" type="submit">Ganti kata sandi</button></div></form>
        <div class="card stack-sm"><h3 class="h3">${ic('shield')} Sesi</h3><p class="small muted">Lupa keluar di komputer sekolah? Keluarkan akun dari semua perangkat sekaligus.</p><div><button class="btn btn-outline" id="outall">${ic('logout', 'i-sm')} Keluar dari semua perangkat</button></div></div>
        ${me.wa ? `<div class="card stack-sm"><h3 class="h3">Kontak</h3><p class="small">${ic('phone', 'i-sm')} ${esc(me.wa)}</p><p class="xs muted">Nomor hanya terlihat oleh Pembina dan Admin. Minta Admin bila perlu diubah.</p></div>` : ''}
      </div></div>`;
      v.querySelector('#ph').onchange = async e => {
        const file = e.target.files[0]; if (!file) return;
        try { const data = await UI.resizeImage(file, 96, 'image/webp', 0.8); const r = await API.act('profile.update', { photo: data }); Object.assign(S.me, r.data.me); App.paintMe(); toast('Foto disimpan.'); paint(); }
        catch (x) { toast(x.message, 'err'); }
      };
      const px = v.querySelector('#phx'); if (px) px.onclick = () => UI.busy(px, async () => { const r = await API.act('profile.update', { photo: '' }); Object.assign(S.me, r.data.me); App.paintMe(); paint(); });
      v.querySelector('#pf').onsubmit = e => { e.preventDefault(); const d = UI.formData(e.target); UI.busy(e.target.querySelector('button'), async () => {
        const r = await API.act('profile.update', d); Object.assign(S.me, r.data.me); API.store.set('ech_me', JSON.stringify(S.me));
        document.documentElement.classList.toggle('reduce-motion', !!S.me.reduce_motion);
        Leo.mount({ enabled: S.me.role === 'student' && (App.settings || {}).mascot_enabled !== 'false' && S.me.mascot_on !== false, still: !!S.me.reduce_motion });
        toast(r.message); }); };
      v.querySelector('#cpf').onsubmit = e => { e.preventDefault(); const d = UI.formData(e.target); UI.busy(e.target.querySelector('button'), async () => {
        if (d.new !== d.confirm) throw new Error('Konfirmasi kata sandi tidak sama.');
        const r = await API.act('auth.changePassword', { old: d.old, new: d.new }); S.set(r.data.token, r.data.me); toast(r.message); e.target.reset(); }); };
      v.querySelector('#outall').onclick = () => UI.confirmBox({ title: 'Keluar dari semua perangkat?', text: 'Semua sesi aktif, termasuk perangkat ini, akan berakhir.', ok: 'Keluar semua', danger: true }).then(ok => ok && App.logout(true));
    };
    paint();
  };
})();
