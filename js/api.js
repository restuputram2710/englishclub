/* ==========================================================================
   Lapisan komunikasi ke Google Apps Script (REST JSON via fetch).
   Pola gas-scale-turbo: dedupe baca, epoch tulis, penggabung batch, SWR lokal,
   pengukur waktu, pemanasan server, dan polling adaptif.
   ========================================================================== */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const URL_OK = CFG.GAS_URL && !/GANTI|XXXX/.test(CFG.GAS_URL);
  const WRITE = /^(auth\.|profile\.|notif\.read|material\.complete|vocab\.|submission\.create|quiz\.(start|submit)|batch$)|\.(save|delete|review|adjust|award|reset|import|flush)$/;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  const Session = {
    token: store.get('ech_token') || '',
    me: null, settings: null,
    set(token, me) { this.token = token || ''; if (token) store.set('ech_token', token); else store.del('ech_token'); if (me) this.me = me; },
    clear() { this.token = ''; this.me = null; store.del('ech_token'); SWR.clear(); }
  };

  /* ----- pengukur ----- */
  const Perf = {
    log: [],
    add(e) { this.log.push(e); if (this.log.length > 200) this.log.shift(); },
    table() { console.table(this.log.slice(-30)); },
    summary() {
      const m = {}; this.log.forEach(e => { const k = e.action; m[k] = m[k] || { n: 0, total: 0, server: 0 }; m[k].n++; m[k].total += e.total; m[k].server += e.server || 0; });
      console.table(Object.keys(m).map(k => ({ action: k, kali: m[k].n, rata_total_ms: Math.round(m[k].total / m[k].n), rata_server_ms: Math.round(m[k].server / m[k].n) })));
    }
  };
  window.Perf = Perf;

  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code || ''; } }

  async function raw(action, data, opts) {
    if (!URL_OK) throw new ApiError('Alamat server belum diatur. Isi GAS_URL di js/config.js.', 'CONFIG');
    const t0 = performance.now();
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), (opts && opts.timeout) || 60000);
    let res;
    try {
      const r = await fetch(CFG.GAS_URL, { method: 'POST', redirect: 'follow', signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data: data || {}, token: Session.token }) });
      res = await r.json();
    } catch (e) {
      throw new ApiError(e.name === 'AbortError' ? 'Server terlalu lama merespons. Periksa koneksi lalu coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'NET');
    } finally { clearTimeout(to); }
    Perf.add({ action, total: Math.round(performance.now() - t0), server: res && res.ms, ok: res && res.success });
    if (res && !res.success) {
      if (res.code === 'AUTH' && action !== 'auth.login') { Session.clear(); if (window.App) App.onAuthLost(res.message); }
      if (res.code === 'MUST_CHANGE' && window.App) App.go('#/ganti-sandi');
    }
    return res;
  }

  /* ----- dedupe baca + epoch tulis ----- */
  const inflight = {}; let epoch = 0;
  async function call(action, data, opts) {
    if (WRITE.test(action)) { epoch++; SWR.dirty(); return raw(action, data, opts); }
    const k = epoch + '|' + action + '|' + JSON.stringify(data || {});
    if (inflight[k]) return inflight[k];
    const p = raw(action, data, opts).catch(async e => { if (e.code === 'NET') { await new Promise(r => setTimeout(r, 800)); return raw(action, data, opts); } throw e; });
    inflight[k] = p; p.then(() => delete inflight[k], () => delete inflight[k]);
    return p;
  }

  /* ----- penggabung batch: baca yang dipanggil di tik yang sama → 1 eksekusi ----- */
  const Batcher = {
    q: null,
    add(action, data) {
      return new Promise((resolve, reject) => {
        if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); }
        this.q.push({ action, data: data || {}, resolve, reject });
      });
    },
    async flush() {
      const q = this.q; this.q = null; if (!q || !q.length) return;
      const uniq = []; const map = {};
      q.forEach(it => { const k = it.action + '|' + JSON.stringify(it.data); if (!map[k]) { map[k] = []; uniq.push(it); } map[k].push(it); });
      const send = (items, out) => items.forEach((it, i) => map[it.action + '|' + JSON.stringify(it.data)].forEach(w => w.resolve(out[i])));
      try {
        if (uniq.length === 1 || !Session.token) { for (const it of uniq) { const r = await call(it.action, it.data); send([it], [r]); } return; }
        for (let i = 0; i < uniq.length; i += 10) {
          const part = uniq.slice(i, i + 10);
          const r = await raw('batch', { calls: part.map(x => ({ action: x.action, data: x.data })) });
          if (!r.success) { send(part, part.map(() => r)); continue; }
          send(part, r.data);
        }
      } catch (e) { q.forEach(it => it.reject(e)); }
    }
  };

  /* ----- SWR: tampilkan cache lokal dulu, segarkan di belakang ----- */
  const SWR = {
    pfx() { return 'ech_swr_' + (Session.me ? Session.me.id : 'pub') + '_'; },
    key(action, data) { return this.pfx() + action + '_' + JSON.stringify(data || {}); },
    read(action, data) { try { return JSON.parse(store.get(this.key(action, data)) || 'null'); } catch (e) { return null; } },
    write(action, data, val) { store.set(this.key(action, data), JSON.stringify({ at: Date.now(), d: val })); },
    dirty() { this.stamp = Date.now(); },
    clear() { try { Object.keys(localStorage).filter(k => k.indexOf('ech_swr_') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { } },
    stamp: 0
  };
  /**
   * Ambil data dengan pola stale-while-revalidate.
   * onData(data, fromCache) dipanggil 1–2 kali. maxAge (ms) = umur cache yang dianggap segar.
   */
  async function swr(action, data, onData, maxAge) {
    const c = SWR.read(action, data);
    const fresh = c && Date.now() - c.at < (maxAge || 30000) && c.at > SWR.stamp;
    if (c) onData(c.d, true);
    if (fresh) return c.d;
    const r = await Batcher.add(action, data);
    if (!r || !r.success) throw new ApiError((r && r.message) || 'Gagal memuat data.', r && r.code);
    const same = c && JSON.stringify(c.d) === JSON.stringify(r.data);
    SWR.write(action, data, r.data);
    if (!same) onData(r.data, false);
    return r.data;
  }
  async function get(action, data) {
    const r = await Batcher.add(action, data);
    if (!r || !r.success) throw new ApiError((r && r.message) || 'Gagal memuat data.', r && r.code);
    return r.data;
  }
  async function act(action, data, opts) {
    const r = await call(action, data, opts);
    if (!r || !r.success) throw new ApiError((r && r.message) || 'Gagal menyimpan.', r && r.code);
    return r;
  }

  /* ----- data publik lewat GET (dapat di-cache browser) ----- */
  async function publicHome() {
    if (!URL_OK) throw new ApiError('Alamat server belum diatur. Isi GAS_URL di js/config.js.', 'CONFIG');
    const r = await fetch(CFG.GAS_URL + '?action=pub.home', { redirect: 'follow' }).then(x => x.json());
    if (!r.success) throw new ApiError(r.message);
    return r.data;
  }

  /* ----- pemanasan server (no-cors, maks. 1× per 4 menit per lingkup) ----- */
  function warm(scope) {
    if (!URL_OK) return;
    try {
      const k = 'ech_warm_' + scope, last = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - last < 240000) return;
      sessionStorage.setItem(k, String(Date.now()));
    } catch (e) { }
    fetch(CFG.GAS_URL + '?w=' + scope, { mode: 'no-cors' }).catch(() => { });
  }

  /* ----- aktivitas pengguna untuk polling adaptif ----- */
  const Activity = {
    at: Date.now(), last: {},
    init() { ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'].forEach(ev => addEventListener(ev, () => { this.at = Date.now(); }, { passive: true })); },
    idle() { return Date.now() - this.at > 120000; },
    due(key, activeMs, idleMs) {
      if (document.visibilityState !== 'visible') return false;
      if (Date.now() - (this.last[key] || 0) < (this.idle() ? idleMs : activeMs) - 500) return false;
      this.last[key] = Date.now(); return true;
    }
  };
  Activity.init();

  window.API = { call, act, get, swr, publicHome, warm, Session, Activity, ApiError, configured: URL_OK, store, SWR };
})();
