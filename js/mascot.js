/* ==========================================================================
   English Club Hub — Maskot Leo si bunglon (SVG + CSS, tanpa pustaka)
   Warna tubuh berubah mengikuti suasana: ungu (santai), biru (fokus/kuis),
   emas (merayakan), oranye lembut (menyemangati).
   Mascot.svg('leo', ekspresi) mengembalikan string <svg>.
   Ekspresi: idle, happy, wave, celebrate, think, cheer, oops, surprised.
   ========================================================================== */
(function (root) {
  'use strict';

  const NAVY = '#0A1633';
  const GOLD = '#F5B93A';

  const EXPR = {
    idle:      { eyes: 'open',  brows: 'neutral', mouth: 'smile', arms: 'down' },
    happy:     { eyes: 'happy', brows: 'up',      mouth: 'grin',  arms: 'down' },
    wave:      { eyes: 'open',  brows: 'up',      mouth: 'grin',  arms: 'wave' },
    celebrate: { eyes: 'happy', brows: 'up',      mouth: 'grin',  arms: 'up',   fx: 'sparkles' },
    think:     { eyes: 'look',  brows: 'think',   mouth: 'flat',  arms: 'chin', fx: 'bulb' },
    cheer:     { eyes: 'open',  brows: 'firm',    mouth: 'smile', arms: 'fist' },
    oops:      { eyes: 'soft',  brows: 'soft',    mouth: 'soft',  arms: 'down', fx: 'drop' },
    surprised: { eyes: 'wide',  brows: 'up',      mouth: 'o',     arms: 'down' }
  };

  /* ---------- bagian bersama ---------- */
  function star(x, y, s, fill, cls) {
    const k = s * 0.32;
    return `<path class="${cls || ''}" fill="${fill}" d="M${x} ${y - s}L${x + k} ${y - k}L${x + s} ${y}L${x + k} ${y + k}L${x} ${y + s}L${x - k} ${y + k}L${x - s} ${y}L${x - k} ${y - k}Z"/>`;
  }
  function fx(kind, at) {
    if (kind === 'sparkles') {
      return `<g class="mc-fx mc-spark">${star(at.s1[0], at.s1[1], 8, GOLD)}${star(at.s2[0], at.s2[1], 6, GOLD)}${star(at.s3[0], at.s3[1], 5, '#8B5CF6')}</g>`;
    }
    if (kind === 'bulb') {
      const [x, y] = at.bulb;
      return `<g class="mc-fx mc-bulb"><path d="M${x - 13} ${y - 4}h-5M${x + 13} ${y - 4}h5M${x} ${y - 17}v-5M${x - 10} ${y - 13}l-3-3M${x + 10} ${y - 13}l3-3" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="${x}" cy="${y - 4}" r="8.5" fill="${GOLD}"/><rect x="${x - 4.5}" y="${y + 3}" width="9" height="6" rx="2" fill="${NAVY}"/></g>`;
    }
    if (kind === 'drop') {
      const [x, y] = at.drop;
      return `<path class="mc-fx mc-drop" fill="#8EC5FF" d="M${x} ${y - 9}C${x + 5} ${y - 2} ${x + 6} ${y + 2} ${x + 6} ${y + 4}a6 6 0 0 1-12 0c0-2 1-6 6-13Z"/>`;
    }
    return '';
  }
  function brows(kind, eyes, dy, w, color, sw) {
    const out = eyes.map(([x, y], i) => {
      const L = i === 0, by = y - dy;
      let d;
      switch (kind) {
        case 'up':    d = `M${x - w} ${by - 1}Q${x} ${by - 7} ${x + w} ${by - 1}`; break;
        case 'think': d = L ? `M${x - w} ${by + 2}Q${x} ${by} ${x + w} ${by + 2}` : `M${x - w} ${by - 3}Q${x} ${by - 10} ${x + w} ${by - 4}`; break;
        case 'firm':  d = L ? `M${x - w} ${by - 1}L${x + w} ${by + 2}` : `M${x - w} ${by + 2}L${x + w} ${by - 1}`; break;
        case 'soft':  d = L ? `M${x - w} ${by + 3}L${x + w} ${by - 2}` : `M${x - w} ${by - 2}L${x + w} ${by + 3}`; break;
        default:      d = `M${x - w} ${by + 1}Q${x} ${by - 3} ${x + w} ${by + 1}`;
      }
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    });
    return `<g class="mc-brows">${out.join('')}</g>`;
  }
  function mouth(kind, mx, my, w, ink, inner) {
    switch (kind) {
      case 'grin':
        return `<path d="M${mx - w} ${my}Q${mx} ${my + w * 1.15} ${mx + w} ${my}Z" fill="${inner}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` +
          `<path d="M${mx - w * 0.45} ${my + w * 0.62}Q${mx} ${my + w * 0.38} ${mx + w * 0.45} ${my + w * 0.62}" fill="none" stroke="#FF8A7A" stroke-width="3" stroke-linecap="round"/>`;
      case 'flat': return `<path d="M${mx - w * 0.5} ${my + 2}Q${mx} ${my + 4} ${mx + w * 0.55} ${my}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      case 'soft': return `<path d="M${mx - w * 0.45} ${my + 2}Q${mx} ${my + 6} ${mx + w * 0.45} ${my + 2}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      case 'o':    return `<ellipse cx="${mx}" cy="${my + 4}" rx="${w * 0.32}" ry="${w * 0.42}" fill="${inner}" stroke="${ink}" stroke-width="2.5"/>`;
      default:     return `<path d="M${mx - w} ${my}Q${mx} ${my + w * 0.8} ${mx + w} ${my}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`;
    }
  }
  function arm(from, to, color, width, hand, hr, cls) {
    return `<g class="${cls}" style="transform-origin:${from[0]}px ${from[1]}px">` +
      `<path d="M${from[0]} ${from[1]}L${to[0]} ${to[1]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>` +
      `<circle cx="${to[0]}" cy="${to[1]}" r="${hr}" fill="${hand}"/></g>`;
  }
  function armPose(pose, L, R, chin) {
    // mengembalikan [tanganKiri, tanganKanan]
    switch (pose) {
      case 'wave': return [[L[0] - 7, L[1] + 23], [R[0] + 22, R[1] - 27]];
      case 'up':   return [[L[0] - 19, L[1] - 27], [R[0] + 19, R[1] - 27]];
      case 'chin': return [[L[0] - 7, L[1] + 23], chin];
      case 'fist': return [[L[0] - 7, L[1] + 23], [R[0] + 24, R[1] - 14]];
      default:     return [[L[0] - 7, L[1] + 23], [R[0] + 7, R[1] + 23]];
    }
  }

  /* ---------- LEO — bunglon (warna mengikuti suasana) ---------- */
  function leo(e) {
    const T = [[41, 63], [119, 63]];
    let eyes = '';
    T.forEach(([x, y], i) => {
      eyes += `<circle class="l1" cx="${x}" cy="${y}" r="18"/><circle cx="${x}" cy="${y}" r="13.5" fill="none" class="l2s" stroke-width="2"/>`;
      if (e.eyes === 'happy') eyes += `<path d="M${x - 7} ${y + 2}Q${x} ${y - 7} ${x + 7} ${y + 2}" fill="none" stroke="${NAVY}" stroke-width="3.4" stroke-linecap="round"/>`;
      else {
        const big = e.eyes === 'wide';
        let px = 0, py = 0;
        if (e.eyes === 'look') { px = i ? 2.5 : 3; py = -3.5; }
        if (e.eyes === 'soft') { px = i ? -1 : 1; py = 3; }
        eyes += `<g class="mc-eyes"><circle cx="${x}" cy="${y}" r="${big ? 10.5 : 9.5}" fill="#fff"/>` +
          `<g class="${i === 0 ? 'mc-pupil-l' : 'mc-pupil-r'}"><circle cx="${x + px}" cy="${y + py}" r="${big ? 4 : 5.2}" fill="${NAVY}"/><circle cx="${x + px - 1.5}" cy="${y + py - 1.8}" r="1.5" fill="#fff"/></g></g>`;
      }
    });
    const [hl, hr] = armPose(e.arms, [66, 114], [94, 114], [92, 96]);
    return `
      <ellipse cx="80" cy="155" rx="34" ry="4" fill="${NAVY}" opacity=".08"/>
      <g class="mc-tail" style="transform-origin:110px 132px">
        <path d="M104 138C130 141 143 122 134 106C126 93 109 98 112 110C114 118 124 117 124 110" fill="none" class="l1s" stroke-width="13" stroke-linecap="round"/>
      </g>
      <ellipse class="l2" cx="69" cy="151" rx="9" ry="4.6"/><ellipse class="l2" cx="91" cy="151" rx="9" ry="4.6"/>
      <path class="l1" d="M53 151C47 119 60 98 80 98C100 98 113 119 107 151Z"/>
      <ellipse class="l3" cx="80" cy="129" rx="17" ry="19"/>
      <path d="M66 122H94M64 130H96M66 138H94" class="l2s" stroke-width="1.4" opacity=".35"/>
      <path class="l1" d="M80 20C90 23 99 33 103 44C115 50 123 62 121 78C119 94 102 103 80 103C58 103 41 94 39 78C37 62 45 50 57 44C61 33 70 23 80 20Z"/>
      <path d="M80 23C78 33 77 41 79 49" fill="none" class="l2s" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
      <circle cx="68" cy="40" r="3" fill="${GOLD}"/><circle cx="92" cy="36" r="2.4" fill="${GOLD}"/><circle cx="99" cy="48" r="1.8" fill="${GOLD}"/>
      ${eyes}
      ${brows(e.brows, T, 23, 8, 'var(--leo-2,#5B2FC9)', 3)}
      ${mouth(e.mouth, 80, 84, 19, NAVY, '#3A1730')}
      ${arm([66, 114], hl, 'var(--leo-2,#5B2FC9)', 8, 'var(--leo-2,#5B2FC9)', 5.5, 'mc-arm-l')}
      ${arm([94, 114], hr, 'var(--leo-2,#5B2FC9)', 8, 'var(--leo-2,#5B2FC9)', 5.5, 'mc-arm-r')}
      ${fx(e.fx, { s1: [20, 30], s2: [140, 30], s3: [146, 112], bulb: [132, 22], drop: [140, 88] })}`;
  }
  const LEO_MOOD = {
    celebrate: ['#F5B93A', '#C98A10', '#FFF4D6'],
    happy:     ['#F5B93A', '#C98A10', '#FFF4D6'],
    think:     ['#2F5BFF', '#1E3FBF', '#E0E9FF'],
    oops:      ['#FF8A65', '#D9603B', '#FFE8DF'],
    surprised: ['#2F5BFF', '#1E3FBF', '#E0E9FF']
  };

  const CHARS = {
    leo: {
      draw: leo, name: 'Leo', species: 'Bunglon',
      meaning: 'Dari kata chame“leo”n, si pengubah warna.',
      tagline: 'Si bunglon yang berubah warna mengikuti perjalanan belajarmu.'
    }
  };

  function svg(id, expr, opt) {
    opt = opt || {};
    const c = CHARS[id] || CHARS.leo; id = 'leo';
    const e = EXPR[expr] || EXPR.idle;
    let vars = '';
    if (id === 'leo') {
      const m = LEO_MOOD[expr] || ['#8B5CF6', '#5B2FC9', '#EDE7FF'];
      vars = `--leo-1:${m[0]};--leo-2:${m[1]};--leo-3:${m[2]};`;
    }
    const title = opt.title === false ? '' : `<title>${c.name}</title>`;
    return `<svg class="mc mc-${id} mc-x-${expr}" viewBox="0 0 160 160" role="img" aria-label="${c.name}" style="${vars}">${title}<g class="mc-all">${c.draw(e)}</g></svg>`;
  }

  const CSS = `
  .mc{display:block;width:100%;height:auto;overflow:visible}
  .mc .l1{fill:var(--leo-1,#8B5CF6);transition:fill .5s ease}
  .mc .l2{fill:var(--leo-2,#5B2FC9);transition:fill .5s ease}
  .mc .l3{fill:var(--leo-3,#EDE7FF);transition:fill .5s ease}
  .mc .l1s{stroke:var(--leo-1,#8B5CF6);transition:stroke .5s ease}
  .mc .l2s{stroke:var(--leo-2,#5B2FC9);transition:stroke .5s ease}
  .mc .mc-arm-l,.mc .mc-arm-r,.mc .mc-tail,.mc .mc-sparkmark{transform-box:view-box}
  .mc .mc-eyes,.mc .mc-pupil-l,.mc .mc-pupil-r,.mc .mc-fx{transform-box:fill-box;transform-origin:center}
  @media (prefers-reduced-motion:no-preference){
    .mc-live .mc-all{animation:mcBob 3.2s ease-in-out infinite}
    .mc-live .mc-eyes{animation:mcBlink 4.6s infinite}
    .mc-live .mc-tail{animation:mcTail 3.2s ease-in-out infinite}
    .mc-live .mc-leo .mc-pupil-l{animation:mcLook 6s ease-in-out infinite}
    .mc-live .mc-sparkmark{animation:mcTwinkle 2.6s ease-in-out infinite}
    .mc-live .mc-x-wave .mc-arm-r{animation:mcWave .5s ease-in-out 3}
    .mc-live .mc-x-celebrate .mc-all{animation:mcJump .6s cubic-bezier(.3,1.6,.5,1) 2}
    .mc-live .mc-x-celebrate .mc-spark{animation:mcPop .5s ease-out both}
    .mc-live .mc-x-cheer .mc-arm-r{animation:mcPump .45s ease-in-out 2}
    .mc-live .mc-x-think .mc-bulb{animation:mcPop .4s ease-out both}
    .mc-live .mc-x-surprised .mc-all{animation:mcHop .35s ease-out}
  }
  .mc-still .mc-all,.mc-still *{animation:none!important}
  @keyframes mcBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
  @keyframes mcBlink{0%,93%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}
  @keyframes mcTail{0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg)}}
  @keyframes mcLook{0%,30%{transform:translate(0,0)}38%,55%{transform:translate(-3px,2px)}63%,85%{transform:translate(2px,-3px)}93%,100%{transform:translate(0,0)}}
  @keyframes mcTwinkle{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(.82) rotate(18deg)}}
  @keyframes mcWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg)}}
  @keyframes mcPump{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
  @keyframes mcJump{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}
  @keyframes mcHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes mcPop{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}`;

  function injectCSS() {
    if (typeof document === 'undefined' || document.getElementById('mc-css')) return;
    const s = document.createElement('style');
    s.id = 'mc-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  const MESSAGES = {
    greet: ['Hello! Ready to learn something new today?', 'Welcome back! Let’s keep the streak alive.', 'Hi there! One small step today is enough.'],
    daily: ['Come on! Your daily challenge is waiting!', 'Today’s challenge only takes a few minutes. Let’s go!'],
    xp: ['Great job! You earned {xp} XP!', 'Nice work! +{xp} XP for you.'],
    level: ['Congratulations! You’ve reached a new level!'],
    badge: ['New badge unlocked: {badge}. Well deserved!'],
    pass: ['Brilliant! You nailed that quiz.', 'Great score! Your hard work is paying off.'],
    retry: ['Keep practicing. You’re getting better!', 'Almost there! Review the answers and try again.'],
    tap: ['Will. Work. Win. Let’s do this!', 'Tip: speak out loud when you practice new words.', 'Small practice every day beats one long session.', 'Mistakes are part of learning. Keep going!']
  };

  root.Mascot = { svg, CHARS, EXPR, MESSAGES, injectCSS, list: Object.keys(CHARS) };
  injectCSS();

  /* ---------- Widget Leo di aplikasi ---------- */
  const pickMsg = (kind, vars) => {
    const arr = MESSAGES[kind] || MESSAGES.tap;
    let m = arr[Math.floor(Math.random() * arr.length)];
    Object.keys(vars || {}).forEach(k => { m = m.replace('{' + k + '}', vars[k]); });
    return m;
  };
  const Leo = {
    on: false, dock: null, timer: null, hint: '', still: false,
    svg(expr, live) { return `<span class="${live === false ? 'mc-still' : 'mc-live'}" style="display:block">${svg('leo', expr || 'idle', { title: false })}</span>`; },
    msg: pickMsg,
    mount(opt) {
      opt = opt || {};
      this.unmount();
      this.on = opt.enabled !== false; this.still = !!opt.still;
      if (!this.on || typeof document === 'undefined') return;
      const d = document.createElement('div');
      d.className = 'leo-dock' + (this.still ? ' mc-still' : '');
      d.innerHTML = '<div class="leo-bubble" role="status" aria-live="polite" hidden></div><button class="leo-btn" type="button" aria-label="Leo, maskot English Club Hub. Ketuk untuk tips."></button>';
      document.body.appendChild(d);
      this.dock = d;
      this.pose('idle');
      d.querySelector('.leo-btn').addEventListener('click', () => {
        const txt = this.hint && Math.random() < 0.6 ? this.hint : pickMsg('tap');
        this.say(txt, this.hint && txt === this.hint ? 'think' : 'wave', 4200);
      });
    },
    unmount() { if (this.dock) this.dock.remove(); this.dock = null; clearTimeout(this.timer); },
    pose(expr) { if (!this.dock) return; this.dock.querySelector('.leo-btn').innerHTML = `<span class="${this.still ? 'mc-still' : 'mc-live'}" style="display:block;width:100%">${svg('leo', expr, { title: false })}</span>`; },
    say(text, expr, ms) {
      if (!this.dock) return;
      const b = this.dock.querySelector('.leo-bubble');
      this.pose(expr || 'wave');
      b.innerHTML = '<button class="x" type="button" aria-label="Tutup pesan">×</button>' + String(text).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      b.hidden = false;
      b.querySelector('.x').onclick = () => { b.hidden = true; this.pose('idle'); };
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { b.hidden = true; this.pose('idle'); }, ms || 4500);
    },
    react(expr, ms) { if (!this.dock) return; this.pose(expr); clearTimeout(this.timer); this.timer = setTimeout(() => this.pose('idle'), ms || 2600); },
    setHint(t) { this.hint = t || ''; },
    hide(h) { if (this.dock) this.dock.hidden = !!h; }
  };
  root.Leo = Leo;
})(typeof window !== 'undefined' ? window : globalThis);
