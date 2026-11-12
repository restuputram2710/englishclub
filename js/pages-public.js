/* Halaman publik: beranda English Club, masuk, ganti kata sandi wajib. */
(function () {
  'use strict';
  const { esc, attr, fmt, toast } = UI;
  const S = API.Session;
  const lines = t => String(t || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const parts = l => l.split('|').map(x => x.trim());

  Pages.route('/', 'landing', null);
  Pages.route('/login', 'login', null);
  Pages.route('/ganti-sandi', 'changePass', 'any');

  Pages.landing = async function (root, params, ctx) {
    API.warm('pub');
    let d = null;
    try { const c = JSON.parse(API.store.get('ech_pub') || 'null'); if (c) d = c; } catch (e) { }
    const paint = data => {
      d = data; const s = data.settings || {}; App.applySettings(s);
      const st = data.stats || {};
      const acts = lines(s.activities).map(parts);
      const ach = lines(s.achievements).map(parts);
      const joins = lines(s.join_steps);
      const mission = lines(s.mission);
      const actIcons = ['mic', 'message', 'target', 'book', 'headphones', 'pen'];
      const ann = data.announcements || [];
      const wa = String(s.advisor_contact || '').replace(/[^\d]/g, '');
      const waLink = /^0?8\d{7,}$|^628\d{7,}$/.test(wa) ? 'https://wa.me/' + (wa.indexOf('62') === 0 ? wa : '62' + wa.replace(/^0/, '')) : '';
      root.innerHTML = `<div class="pub">
        <header class="pub-nav"><div class="pub-in">
          ${App.brand('#/')}
          <nav class="pub-links" aria-label="Bagian halaman">
            <a href="#tentang" data-jump>Tentang</a><a href="#filosofi" data-jump>Filosofi</a><a href="#kegiatan" data-jump>Kegiatan</a>
            <a href="#pengumuman" data-jump>Pengumuman</a>${ach.length ? '<a href="#prestasi" data-jump>Prestasi</a>' : ''}<a href="#bergabung" data-jump>Cara Bergabung</a>
          </nav>
          <a class="btn" href="#/login">${ic('login')} Masuk Anggota</a>
        </div></header>

        <section class="pub-hero"><div class="pub-in">
          <div class="stack-lg">
            <span class="chip" style="background:rgba(255,255,255,.1);color:#E2E9FA;width:max-content">${ic('cap', 'i-sm')} English Club · ${esc(s.school_name)}</span>
            <h1>${esc(s.tagline || 'Learn. Play. Challenge. Achieve.')}</h1>
            <p class="lead">${esc(s.about)}</p>
            <div class="row"><a class="btn" href="#kegiatan" data-jump>Lihat kegiatan ${ic('arrowr', 'i-sm')}</a><a class="btn btn-light" href="#/login">${ic('lock', 'i-sm')} Portal anggota</a></div>
            <div class="pub-stats">
              <div><b>${fmt.n(st.members || 0)}</b><span>anggota aktif</span></div>
              <div><b>${st.skills || 6}</b><span>keterampilan inti</span></div>
              <div><b>${fmt.n(st.materials || 0)}</b><span>materi belajar</span></div>
              <div><b>${fmt.n(st.challengesDone || 0)}</b><span>tantangan diselesaikan</span></div>
            </div>
          </div>
          <div class="hero-art">
            <div class="say">Hello! Ready to learn something new today?</div>
            <div class="leo-big">${Leo.svg('wave')}</div>
            <div class="skill-ribbon">${UI.SKILLS6.map(k => `<span>${k}</span>`).join('')}</div>
          </div>
        </div></section>

        <section class="pub-sec" id="filosofi"><div class="pub-in">
          <div class="sec-h"><span class="eyebrow">Filosofi kami</span><h2 class="h1">${esc(s.philosophy || 'Will. Work. Win.')}</h2><p>Tiga pegangan yang menuntun setiap anggota dari berani mencoba sampai meraih prestasi.</p></div>
          <div class="grid g-3">
            ${[['WILL', 'flame', 'ic-orange', 'Kemauan', 'Berani bicara, bertanya, dan mencoba hal baru meski belum sempurna.'],
               ['WORK', 'refresh', 'ic-purple', 'Konsistensi', 'Latihan kecil setiap hari lewat materi, tantangan harian, dan kuis.'],
               ['WIN', 'trophy', 'ic-gold', 'Pencapaian', 'Merayakan kemajuan: naik level, meraih badge, dan berprestasi di lomba.']].map(p =>
              `<div class="card pillar"><span class="ic ${p[2]}">${ic(p[1])}</span><div class="big">${p[0]}</div><span class="eyebrow">${p[3]}</span><p class="muted">${p[4]}</p></div>`).join('')}
          </div>
        </div></section>

        <section class="pub-sec alt" id="tentang"><div class="pub-in">
          <div class="grid g-2">
            <div class="card stack"><span class="eyebrow">Visi</span><h2 class="h2">${esc(s.vision)}</h2></div>
            <div class="card stack"><span class="eyebrow">Misi</span><ul class="stack-sm" style="margin:0;padding-left:20px">${mission.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
          </div>
        </div></section>

        <section class="pub-sec" id="kegiatan"><div class="pub-in">
          <div class="sec-h"><span class="eyebrow">Kegiatan</span><h2 class="h1">Program English Club</h2></div>
          <div class="grid ${acts.length >= 4 ? 'g-4' : 'g-3'}">
            ${acts.map((a, i) => `<div class="card stack-sm"><span class="ic sq ${['ic-blue', 'ic-purple', 'ic-gold', 'ic-green', 'ic-orange', 'ic-blue'][i % 6]}">${ic(actIcons[i % actIcons.length])}</span><b class="h3">${esc(a[0])}</b><p class="muted small">${esc(a[2] || '')}</p>${a[1] ? `<span class="chip" style="width:max-content">${ic('calendar')} ${esc(a[1])}</span>` : ''}</div>`).join('') || '<p class="muted center">Daftar kegiatan akan segera diumumkan.</p>'}
          </div>
        </div></section>

        <section class="pub-sec alt" id="pengumuman"><div class="pub-in">
          <div class="sec-h"><span class="eyebrow">Papan pengumuman</span><h2 class="h1">Pengumuman terbaru</h2></div>
          <div class="grid g-3">${ann.map(a => `<article class="card stack-sm"><div class="row between"><span class="chip ${a.type === 'meeting' ? 'chip-purple' : 'chip-blue'}">${a.type === 'meeting' ? 'Jadwal pertemuan' : 'Pengumuman'}</span><span class="xs muted">${fmt.date(a.created_at)}</span></div><b class="h3">${esc(a.title)}</b><p class="muted small">${esc(a.body)}</p>${a.event_at ? `<span class="small">${ic('clock', 'i-sm')} ${fmt.dt(a.event_at)}${a.location ? ' · ' + esc(a.location) : ''}</span>` : ''}</article>`).join('') || '<p class="muted center" style="grid-column:1/-1">Belum ada pengumuman.</p>'}</div>
        </div></section>

        ${ach.length ? `<section class="pub-sec" id="prestasi"><div class="pub-in">
          <div class="sec-h"><span class="eyebrow">Hall of Fame</span><h2 class="h1">Prestasi klub</h2></div>
          <div class="grid g-3">${ach.map(a => `<div class="card stack-sm" style="border-top:4px solid var(--gold)"><span class="ic ic-gold">${ic('trophy')}</span><b class="h3">${esc(a[0])}</b>${a[1] ? `<span class="chip chip-gold" style="width:max-content">${esc(a[1])}</span>` : ''}<p class="muted small">${esc(a[2] || '')}</p></div>`).join('')}</div>
        </div></section>` : ''}

        <section class="pub-sec ${ach.length ? 'alt' : ''}" id="bergabung"><div class="pub-in">
          <div class="sec-h"><span class="eyebrow">Bergabung</span><h2 class="h1">Cara bergabung dengan English Club</h2></div>
          <div class="split-r">
            <div class="steps">${joins.map((j, i) => `<div class="step"><span class="n">${i + 1}</span><p>${esc(j)}</p></div>`).join('')}</div>
            <div class="card navy stack">
              <span class="eyebrow" style="color:var(--gold)">Pembina English Club</span>
              <b class="h2" style="color:#fff">${esc(s.advisor_name || 'Pembina English Club')}</b>
              ${s.meeting_info ? `<p class="muted">${ic('calendar', 'i-sm')} ${esc(s.meeting_info)}</p>` : ''}
              ${s.advisor_contact ? `<p class="muted">${ic('phone', 'i-sm')} <span style="user-select:all">${esc(s.advisor_contact)}</span></p>` : ''}
              ${waLink ? `<a class="btn" style="background:#16A34A;border-color:#16A34A" href="${waLink}" target="_blank" rel="noopener">${ic('message')} Tanya lewat WhatsApp</a>` : ''}
              <div class="divider" style="background:rgba(255,255,255,.12)"></div>
              <p class="muted small">Sudah menjadi anggota? Masuk dengan username dan kata sandi dari Admin.</p>
              <a class="btn btn-light" href="#/login">${ic('login')} Masuk ke portal</a>
            </div>
          </div>
        </div></section>

        <footer class="pub-foot"><div class="pub-in"><span>© ${new Date().getFullYear()} ${esc(s.school_name)} · ${esc(s.app_name)}</span><span>${esc(s.philosophy)}</span><a href="#/login">Portal anggota</a></div></footer>
      </div>`;
      root.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault(); const t = document.querySelector(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth' });
      }));
    };
    if (d) paint(d); else root.innerHTML = `<div class="boot"><div class="leo-load">${Leo.svg('wave')}</div><span>Memuat English Club Hub…</span></div>`;
    try {
      const fresh = await API.publicHome();
      API.store.set('ech_pub', JSON.stringify(fresh));
      if (!ctx.alive()) return;
      if (!d || JSON.stringify(fresh) !== JSON.stringify(d)) paint(fresh);
    } catch (e) { if (!ctx.alive()) return; if (!d) root.innerHTML = `<div class="boot"><div style="max-width:440px;padding:16px">${UI.errBox(e.message, true)}</div></div>`; const b = root.querySelector('[data-retry]'); if (b) b.onclick = () => App.route(); }
  };

  function authFrame(inner, leoExpr) {
    return `<div class="auth">
      <div class="auth-top">${App.brand('#/')}<a class="btn btn-light btn-sm" href="#/">${ic('arrowl', 'i-sm')} Halaman utama</a></div>
      <div class="auth-mid"><div class="auth-wrap"><div class="auth-card">${inner}</div><div class="auth-leo" id="auth-leo">${Leo.svg(leoExpr || 'wave')}</div></div></div>
      <div class="auth-bottom"><span>${ic('shield', 'i-sm')} Portal khusus anggota · tidak memerlukan email</span><span>${esc((App.settings || {}).school_name || '')}</span></div>
    </div>`;
  }

  Pages.login = async function (root) {
    API.warm('pub');
    const s = App.settings || {};
    root.innerHTML = authFrame(`<form class="body" id="lf" novalidate>
        <div class="row between"><span class="logo ic sq ic-navy" style="width:48px;height:48px;border-radius:14px">${s.logo_thumb ? `<img src="${attr(s.logo_thumb)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px">` : ic('cap', 'i-lg')}</span><span class="chip chip-purple">${esc((s.philosophy || 'Will. Work. Win.').replace(/\./g, ' ·').replace(/ ·$/, ''))}</span></div>
        <div class="stack-sm"><h1 class="h1">Welcome back, member</h1><p class="muted">Masuk dengan username dan kata sandi dari Admin untuk melanjutkan tantangan, kuis, dan streak belajarmu.</p></div>
        <div class="err-box" id="lerr" hidden></div>
        <div class="field"><label for="lu">Username</label><div class="input-wrap">${ic('user')}<input class="input" id="lu" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div></div>
        <div class="field"><label for="lp">Kata sandi</label><div class="input-wrap">${ic('lock')}<input class="input" id="lp" name="password" type="password" autocomplete="current-password" required style="padding-right:52px"><span class="suffix"><button class="icon-btn plain" type="button" id="lshow" aria-label="Tampilkan kata sandi">${ic('eye')}</button></span></div></div>
        <label class="check"><input type="checkbox" name="remember" id="lr"> Ingat saya di perangkat ini selama 14 hari</label>
        <button class="btn btn-block" type="submit" style="min-height:48px">Masuk ${ic('arrowr', 'i-sm')}</button>
      </form>
      <div class="foot">Akun dibuat oleh Admin. Lupa kata sandi? Hubungi Pembina atau Admin English Club.</div>`, 'wave');
    const f = root.querySelector('#lf'), err = root.querySelector('#lerr');
    root.querySelector('#lshow').onclick = e => { const p = root.querySelector('#lp'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; e.currentTarget.innerHTML = ic(show ? 'eyeoff' : 'eye'); e.currentTarget.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'); };
    setTimeout(() => root.querySelector('#lu').focus(), 50);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = UI.formData(f); err.hidden = true;
      if (!d.username || !d.password) { err.hidden = false; err.innerHTML = `${ic('alert')}<span>Isi username dan kata sandi.</span>`; return; }
      const btn = f.querySelector('button[type=submit]');
      await UI.busy(btn, async () => {
        const r = await API.call('auth.login', d);
        if (!r.success) {
          err.hidden = false; err.innerHTML = `${ic('alert')}<span>${esc(r.message)}</span>`;
          const leo = root.querySelector('#auth-leo'); if (leo) leo.innerHTML = Leo.svg(r.code === 'INACTIVE' ? 'oops' : 'surprised');
          return;
        }
        App.afterLogin(r.data);
      });
    });
  };

  Pages.changePass = async function (root) {
    const me = S.me || {};
    root.innerHTML = authFrame(`<form class="body" id="cf" novalidate>
        <div class="stack-sm"><span class="eyebrow">Keamanan akun</span><h1 class="h1">${me.must_change ? 'Buat kata sandi baru' : 'Ganti kata sandi'}</h1>
        <p class="muted">${me.must_change ? 'Kata sandi dari Admin hanya untuk masuk pertama. Buat kata sandi pribadi yang hanya kamu ketahui.' : 'Gunakan kata sandi yang tidak dipakai di tempat lain.'}</p></div>
        <div class="err-box" id="cerr" hidden></div>
        <div class="field"><label for="co">Kata sandi saat ini</label><input class="input" id="co" name="old" type="password" autocomplete="current-password" required></div>
        <div class="field"><label for="cn">Kata sandi baru</label><input class="input" id="cn" name="new" type="password" autocomplete="new-password" required><div class="meter" id="cm"><i></i><i></i><i></i><i></i></div><span class="hint">Minimal 8 karakter, berisi huruf dan angka, tidak memuat username.</span></div>
        <div class="field"><label for="cc">Ulangi kata sandi baru</label><input class="input" id="cc" name="confirm" type="password" autocomplete="new-password" required></div>
        <button class="btn btn-block" type="submit" style="min-height:48px">Simpan kata sandi</button>
        <button class="btn btn-ghost btn-block" type="button" id="cout">Keluar</button>
      </form>`, 'think');
    const f = root.querySelector('#cf'), err = root.querySelector('#cerr'), meter = root.querySelector('#cm');
    root.querySelector('#cn').addEventListener('input', e => {
      const v = e.target.value; let s = 0;
      if (v.length >= 8) s++; if (/[A-Za-z]/.test(v) && /\d/.test(v)) s++; if (v.length >= 12) s++; if (/[^A-Za-z0-9]/.test(v) || /[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
      meter.className = 'meter s' + s;
    });
    root.querySelector('#cout').onclick = () => App.logout();
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true;
      const d = UI.formData(f);
      const bad = m => { err.hidden = false; err.innerHTML = `${ic('alert')}<span>${esc(m)}</span>`; };
      if (d.new !== d.confirm) return bad('Konfirmasi kata sandi tidak sama.');
      if (d.new.length < 8 || !/[A-Za-z]/.test(d.new) || !/\d/.test(d.new)) return bad('Kata sandi minimal 8 karakter dan memuat huruf serta angka.');
      await UI.busy(f.querySelector('button[type=submit]'), async () => {
        const r = await API.call('auth.changePassword', { old: d.old, new: d.new });
        if (!r.success) return bad(r.message);
        S.set(r.data.token, r.data.me); API.store.set('ech_me', JSON.stringify(r.data.me));
        toast('Kata sandi tersimpan. Selamat datang!');
        document.getElementById('app').innerHTML = '';
        App.go(App.home());
      });
    });
  };
})();
