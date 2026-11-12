/* ==========================================================================
   Kerangka aplikasi: router hash, shell (sidebar/topbar/bottom nav), tema,
   sesi, polling notifikasi, dan maskot Leo.
   ========================================================================== */
(function () {
  'use strict';
  const { esc, attr, fmt, toast } = UI;
  const S = API.Session;
  window.Pages = window.Pages || {};

  const NAV = {
    student: [
      { h: '#/home', t: 'Overview', i: 'grid' },
      { h: '#/skills', t: 'English Skill Zone', i: 'book' },
      { h: '#/challenges', t: 'Challenges', i: 'flag' },
      { h: '#/quiz', t: 'Quiz Arena', i: 'target' },
      { h: '#/leaderboard', t: 'Leaderboard', i: 'chart' },
      { h: '#/badges', t: 'Badges', i: 'award' },
      { h: '#/library', t: 'Digital Library', i: 'library' },
      { h: '#/submissions', t: 'Tugas Saya', i: 'clipcheck' }
    ],
    mentor: [
      { h: '#/m/home', t: 'Dashboard', i: 'grid' },
      { h: '#/m/review', t: 'Pemeriksaan Tugas', i: 'clipcheck', badge: 'review' },
      { h: '#/m/members', t: 'Anggota', i: 'users' },
      { g: 'Pembelajaran' },
      { h: '#/m/materials', t: 'Materi', i: 'book' },
      { h: '#/m/challenges', t: 'Tantangan', i: 'flag' },
      { h: '#/m/quiz', t: 'Quiz Builder', i: 'target' },
      { h: '#/m/xp', t: 'XP & Badge', i: 'award' },
      { h: '#/m/announcements', t: 'Pengumuman', i: 'megaphone' },
      { g: 'Pantau' },
      { h: '#/m/reports', t: 'Laporan', i: 'printer' },
      { h: '#/leaderboard', t: 'Leaderboard', i: 'chart' },
      { h: '#/library', t: 'Digital Library', i: 'library' }
    ]
  };
  NAV.admin = [
    { h: '#/a/home', t: 'Dashboard Admin', i: 'gauge' },
    { h: '#/a/users', t: 'Pengguna', i: 'users' },
    { h: '#/a/settings', t: 'Pengaturan Aplikasi', i: 'palette' },
    { h: '#/a/rules', t: 'Aturan XP & Level', i: 'sliders' },
    { h: '#/a/import', t: 'Import Data', i: 'database' },
    { h: '#/a/audit', t: 'Log Aktivitas', i: 'activity' },
    { g: 'Kegiatan Klub' },
    { h: '#/m/home', t: 'Dashboard Pembina', i: 'grid' },
    { h: '#/m/review', t: 'Pemeriksaan Tugas', i: 'clipcheck', badge: 'review' },
    { h: '#/m/members', t: 'Anggota', i: 'users' },
    { h: '#/m/materials', t: 'Materi', i: 'book' },
    { h: '#/m/challenges', t: 'Tantangan', i: 'flag' },
    { h: '#/m/quiz', t: 'Quiz Builder', i: 'target' },
    { h: '#/m/xp', t: 'XP & Badge', i: 'award' },
    { h: '#/m/announcements', t: 'Pengumuman', i: 'megaphone' },
    { h: '#/m/reports', t: 'Laporan', i: 'printer' },
    { h: '#/leaderboard', t: 'Leaderboard', i: 'chart' },
    { h: '#/library', t: 'Digital Library', i: 'library' }
  ];
  const BNAV = {
    student: [['#/home', 'Home', 'home'], ['#/skills', 'Skills', 'book'], ['#/challenges', 'Challenges', 'flag'], ['#/quiz', 'Quiz', 'target']],
    mentor: [['#/m/home', 'Home', 'home'], ['#/m/review', 'Periksa', 'clipcheck'], ['#/m/members', 'Anggota', 'users'], ['#/m/challenges', 'Tantangan', 'flag']],
    admin: [['#/a/home', 'Home', 'home'], ['#/a/users', 'Pengguna', 'users'], ['#/m/review', 'Periksa', 'clipcheck'], ['#/a/settings', 'Atur', 'palette']]
  };
  const HOME = { student: '#/home', mentor: '#/m/home', admin: '#/a/home' };

  const App = {
    badges: {}, renderId: 0, settings: null, unread: 0,
    home() { return S.me ? HOME[S.me.role] : '#/'; },
    go(h) { if (location.hash === h) this.route(); else location.hash = h; },

    /* ---------- tema & identitas ---------- */
    applySettings(s) {
      if (!s) return;
      this.settings = s; S.settings = s;
      API.store.set('ech_settings', JSON.stringify(s));
      const r = document.documentElement.style, ok = v => /^#[0-9a-f]{6}$/i.test(v || '');
      if (ok(s.color_primary)) r.setProperty('--primary', s.color_primary);
      if (ok(s.color_gamify)) r.setProperty('--purple', s.color_gamify);
      if (ok(s.color_gold)) r.setProperty('--gold', s.color_gold);
      if (ok(s.color_navy)) r.setProperty('--navy', s.color_navy);
      if (ok(s.color_bg)) r.setProperty('--bg', s.color_bg);
      document.title = s.app_name || 'English Club Hub';
      let fav = document.querySelector('link[rel=icon]');
      if (s.logo_thumb) { if (!fav) { fav = document.createElement('link'); fav.rel = 'icon'; document.head.appendChild(fav); } fav.href = s.logo_thumb; }
      const mt = document.querySelector('meta[name=theme-color]'); if (mt && ok(s.color_navy)) mt.content = s.color_navy;
    },
    logo(cls) {
      const s = this.settings || {};
      return `<span class="logo ${cls || ''}">${s.logo_thumb ? `<img src="${attr(s.logo_thumb)}" alt="">` : ic('cap', 'i-lg')}</span>`;
    },
    brand(href) {
      const s = this.settings || {};
      return `<a class="brand" href="${href || '#/'}">${this.logo()}<span style="min-width:0"><span class="t1" style="display:block">${esc(s.app_name || 'English Club Hub')}</span><span class="t2" style="display:block">${esc(s.school_name || 'SMA PGRI 43 Singaparna')}</span></span></a>`;
    },

    /* ---------- shell ---------- */
    shell() {
      if (document.getElementById('view') && document.querySelector('.shell')) return;
      document.documentElement.classList.toggle('reduce-motion', !!(S.me && S.me.reduce_motion));
      const role = S.me.role, s = this.settings || {};
      const nav = NAV[role].map(n => n.g ? `<div class="grp">${esc(n.g)}</div>` : `<a href="${n.h}" data-nav="${n.h}">${ic(n.i)}<span>${esc(n.t)}</span>${n.badge ? `<span class="badge" data-badge="${n.badge}" hidden></span>` : ''}</a>`).join('');
      const bn = BNAV[role].map(b => `<a href="${b[0]}" data-nav="${b[0]}">${ic(b[1] === 'Home' ? 'home' : b[2])}<span>${esc(b[1])}</span></a>`).join('') +
        `<button type="button" data-menu>${ic('menu')}<span>Menu</span></button>`;
      document.getElementById('app').innerHTML = `
        <div class="shell">
          <aside class="side" id="side" aria-label="Navigasi utama">
            ${this.brand(this.home())}
            <div class="side-meta"><span>${role === 'student' ? `<span style="color:#34D399">●</span> Anggota aktif` : esc(UI.L.role[role])}</span><b>${esc(s.academic_year || '')}</b></div>
            <nav class="nav">${nav}</nav>
            ${role === 'student' ? `<div class="motto"><span class="eyebrow">${ic('trophy', 'i-sm')} Filosofi</span><b>“${esc(s.philosophy || 'Will. Work. Win.')}”</b><p>Latihan kecil setiap hari membawa kemampuan bahasa Inggrismu makin jauh.</p></div>` : ''}
            <div class="side-foot"><a href="#/profile">${ic('settings', 'i-sm')} Profil</a><button type="button" data-logout>${ic('logout', 'i-sm')} Keluar</button></div>
          </aside>
          <div class="main">
            <header class="top">
              <button class="icon-btn menu-btn" type="button" data-menu aria-label="Buka menu">${ic('menu')}</button>
              <div class="ttl"><div class="crumb" id="crumb"></div><h1 class="h2" id="ttl">&nbsp;</h1></div>
              <div class="tools">
                ${role === 'student' ? `<span class="chip streak-chip chip-hide" id="tb-streak" title="Streak belajar">${ic('flame')}<span>0</span> hari</span><span class="chip xp-chip chip-hide" id="tb-xp" title="Total XP">${ic('zap')}<span>0</span> XP</span>` : ''}
                <a class="icon-btn" href="#/notifications" aria-label="Notifikasi">${ic('bell')}<span class="notif-dot" id="tb-bell" hidden>0</span></a>
                <div style="position:relative"><button class="me-btn" type="button" id="me-btn" aria-haspopup="menu" aria-expanded="false"><span id="tb-av"></span><span class="who"><span class="nm" style="display:block" id="tb-nm"></span><span class="sb" style="display:block" id="tb-sb"></span></span></button></div>
              </div>
            </header>
            <main id="view" class="view" tabindex="-1"></main>
            <footer class="app-foot"><span>© ${new Date().getFullYear()} ${esc(s.school_name || '')} · ${esc(s.app_name || '')}</span><span>${esc(s.tagline || '')}</span></footer>
          </div>
          <nav class="bnav" aria-label="Navigasi cepat">${bn}</nav>
        </div>`;
      this.paintMe();
      const side = document.getElementById('side');
      const closeSide = () => { side.classList.remove('open'); const sc = document.querySelector('.scrim'); if (sc) sc.remove(); };
      document.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', () => {
        side.classList.add('open');
        const sc = document.createElement('div'); sc.className = 'scrim'; sc.onclick = closeSide; document.body.appendChild(sc);
      }));
      side.addEventListener('click', e => { if (e.target.closest('a')) closeSide(); });
      document.querySelector('[data-logout]').onclick = () => this.logout();
      const meBtn = document.getElementById('me-btn');
      meBtn.addEventListener('click', e => {
        e.stopPropagation();
        let m = meBtn.parentElement.querySelector('.menu');
        if (m) { m.remove(); meBtn.setAttribute('aria-expanded', 'false'); return; }
        m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
        m.innerHTML = `<a href="#/profile" role="menuitem">${ic('user')} Profil & pengaturan</a><a href="#/notifications" role="menuitem">${ic('bell')} Notifikasi</a><button type="button" role="menuitem" data-out>${ic('logout')} Keluar</button><button type="button" role="menuitem" class="danger" data-outall>${ic('shield')} Keluar dari semua perangkat</button>`;
        meBtn.parentElement.appendChild(m); meBtn.setAttribute('aria-expanded', 'true');
        m.querySelector('[data-out]').onclick = () => this.logout();
        m.querySelector('[data-outall]').onclick = () => this.logout(true);
        setTimeout(() => document.addEventListener('click', function h() { m.remove(); meBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', h); }), 0);
      });
      const st = this.settings || {};
      // Leo menemani siswa; halaman Pembina/Admin tidak memakai maskot melayang agar tabel tidak tertutup
      Leo.mount({ enabled: role === 'student' && st.mascot_enabled !== 'false' && S.me.mascot_on !== false, still: !!S.me.reduce_motion });
    },
    paintMe() {
      const me = S.me; if (!me) return;
      const set = (id, h) => { const el = document.getElementById(id); if (el) el.innerHTML = h; };
      set('tb-av', UI.avatar(me.name, me.photo));
      set('tb-nm', esc(me.name));
      set('tb-sb', me.role === 'student' ? `Level ${me.level} · ${esc(me.levelName)}` : esc(UI.L.role[me.role]));
      const xp = document.querySelector('#tb-xp span'); if (xp) xp.textContent = fmt.n(me.xp);
      const sk = document.querySelector('#tb-streak span'); if (sk) sk.textContent = me.streak || 0;
    },
    setBell(n) {
      this.unread = n || 0;
      const b = document.getElementById('tb-bell'); if (!b) return;
      b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    },
    setBadge(key, n) {
      document.querySelectorAll(`[data-badge="${key}"]`).forEach(el => { el.hidden = !n; el.textContent = n; });
    },
    setTitle(t, crumbs) {
      const tt = document.getElementById('ttl'); if (tt) tt.textContent = t;
      const c = document.getElementById('crumb');
      if (c) c.innerHTML = (crumbs || []).map(x => x[1] ? `<a href="${x[1]}">${esc(x[0])}</a>` : `<span>${esc(x[0])}</span>`).join(ic('chevr', 'i-sm'));
      document.title = t + ' · ' + ((this.settings || {}).app_name || 'English Club Hub');
    },
    applyReward(r) {
      if (!S.me || !r) return;
      Object.assign(S.me, { xp: r.total, level: r.level, levelName: r.levelName, next: r.next, floor: r.floor, streak: r.streak });
      API.store.set('ech_me', JSON.stringify(S.me));
      this.paintMe();
    },

    /* ---------- sesi ---------- */
    async logout(all) {
      try { await API.call(all ? 'auth.logoutAll' : 'auth.logout', {}); } catch (e) { }
      S.clear(); API.store.del('ech_me'); Leo.unmount();
      toast(all ? 'Semua perangkat sudah dikeluarkan.' : 'Anda sudah keluar.');
      location.hash = '#/login';
    },
    onAuthLost(msg) {
      API.store.del('ech_me'); Leo.unmount();
      if (!/^#\/(login|)$/.test(location.hash)) { toast(msg || 'Sesi berakhir. Silakan masuk lagi.', 'warn'); location.hash = '#/login'; }
    },
    afterLogin(d) {
      S.set(d.token, d.me);
      API.store.set('ech_me', JSON.stringify(d.me));
      if (d.settings) this.applySettings(d.settings);
      document.getElementById('app').innerHTML = '';
      this.go(d.me.must_change ? '#/ganti-sandi' : HOME[d.me.role]);
    },

    /* ---------- router ---------- */
    match(path) {
      const R = Pages._routes || [];
      for (const r of R) {
        const m = path.match(r.re);
        if (m) return { r, params: m.slice(1).map(decodeURIComponent) };
      }
      return null;
    },
    async route() {
      const hash = location.hash || '#/';
      const path = (hash.replace(/^#/, '') || '/').split('?')[0];
      const hit = this.match(path);
      const id = ++this.renderId;
      if (!hit) { this.go(S.token ? this.home() : '#/'); return; }
      const { r, params } = hit;
      if (r.roles) {
        if (!S.token) { this.go('#/login'); return; }
        if (!S.me) { await this.loadMe(); if (id !== this.renderId) return; if (!S.me) return; }
        if (S.me.must_change && r.name !== 'changePass') { this.go('#/ganti-sandi'); return; }
        if (r.roles !== 'any' && r.roles.indexOf(S.me.role) === -1) { this.go(this.home()); return; }
        if (r.name !== 'changePass') this.shell(); else document.querySelector('.shell') && (document.getElementById('app').innerHTML = '');
      } else {
        if (S.token && (r.name === 'login') && S.me) { this.go(this.home()); return; }
        Leo.unmount();
        document.getElementById('app').innerHTML = '';
      }
      document.querySelectorAll('[data-nav]').forEach(a => {
        const h0 = hash.split('?')[0]; const on = h0 === a.dataset.nav || (a.dataset.nav !== '#/home' && h0.indexOf(a.dataset.nav + '/') === 0) || (r.nav && r.nav === a.dataset.nav);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      const view = document.getElementById('view') || document.getElementById('app');
      Leo.setHint(''); Leo.hide(false);
      const ctx = { alive: () => id === this.renderId, params };
      try {
        await Pages[r.name](view, params, ctx);
        if (view.id === 'view' && ctx.alive()) { window.scrollTo(0, 0); }
      } catch (e) {
        if (!ctx.alive()) return;
        view.innerHTML = UI.errBox(e.message || 'Terjadi kesalahan.', true);
        const b = view.querySelector('[data-retry]'); if (b) b.onclick = () => this.route();
      }
    },
    async loadMe() {
      try {
        const r = await API.call('auth.me', {});
        if (r.success) { S.me = r.data.me; API.store.set('ech_me', JSON.stringify(r.data.me)); this.applySettings(r.data.settings); this.setBell(r.data.unread); }
        else if (r.code === 'AUTH') { S.clear(); this.go('#/login'); }
        else throw new Error(r.message);
      } catch (e) {
        if (!S.me) document.getElementById('app').innerHTML = `<div class="boot"><div class="stack" style="max-width:420px;padding:16px">${UI.errBox(e.message, true)}</div></div>`;
        const b = document.querySelector('[data-retry]'); if (b) b.onclick = () => location.reload();
      }
    },

    /* ---------- mulai ---------- */
    boot() {
      try { const s = JSON.parse(API.store.get('ech_settings') || 'null'); if (s) this.applySettings(s); } catch (e) { }
      if (S.token) { try { S.me = JSON.parse(API.store.get('ech_me') || 'null'); } catch (e) { S.me = null; } }
      if (!API.configured) {
        document.getElementById('app').innerHTML = `<div class="boot"><div class="card stack" style="max-width:520px;margin:16px">${Leo.svg('think')}<h1 class="h2">Konfigurasi belum lengkap</h1><p class="muted">Buka berkas <code>js/config.js</code> dan isi <code>GAS_URL</code> dengan URL /exec dari penerapan Google Apps Script. Panduan lengkap ada di PANDUAN-INSTALASI.md.</p></div></div>`;
        return;
      }
      addEventListener('hashchange', () => this.route());
      this.route();
      if (S.token) {
        // segarkan profil & pengaturan di belakang, tanpa menahan tampilan
        API.call('auth.me', {}).then(r => { if (r.success) { S.me = Object.assign(S.me || {}, r.data.me); API.store.set('ech_me', JSON.stringify(S.me)); this.applySettings(r.data.settings); this.setBell(r.data.unread); this.paintMe(); } }).catch(() => { });
      }
      setInterval(() => {
        if (!S.token || !S.me || !document.querySelector('.shell')) return;
        if (!API.Activity.due('notif', 60000, 300000)) return;
        API.get('notif.count', {}).then(d => this.setBell(d.unread)).catch(() => { });
      }, 15000);
    }
  };
  window.App = App;

  /* Pendaftaran rute: Pages.route(pola, nama, peran, navAktif) */
  Pages._routes = [];
  Pages.route = function (pattern, name, roles, nav) {
    const re = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '/?$');
    Pages._routes.push({ re, name, roles, nav });
  };
})();
