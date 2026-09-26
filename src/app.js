/* ACBL Unit 112 website — public pages + webmaster admin panel.
   One file, no build step. Content lives in a single JSON object ("site").
   Live mode: loads/saves through /api/* (Cloudflare Pages Functions, see /functions).
   Demo mode: when no /api is present, saves go to this browser's localStorage. */
(function () {
  'use strict';

  // ---------- small helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const safe = (fn, fb) => { try { return fn(); } catch (e) { return fb; } };
  const ls = {
    get: (k) => safe(() => localStorage.getItem(k), null),
    set: (k, v) => safe(() => { localStorage.setItem(k, v); return true; }, false),
    del: (k) => safe(() => localStorage.removeItem(k)),
  };
  const ss = {
    get: (k) => safe(() => sessionStorage.getItem(k), null),
    set: (k, v) => safe(() => sessionStorage.setItem(k, v)),
    del: (k) => safe(() => sessionStorage.removeItem(k)),
  };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON = MONTHS.map((m) => m.slice(0, 3));
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parseDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const todayISO = () => { const d = today(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmtDate = (s) => { const d = parseDate(s); return d ? MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : ''; };
  function fmtRange(a, b) {
    const s = parseDate(a), e = parseDate(b) || s;
    if (!s) return 'Date to be announced';
    if (+s === +e) return DAYS[s.getDay()] + ', ' + MONTHS[s.getMonth()] + ' ' + s.getDate() + ', ' + s.getFullYear();
    if (s.getMonth() === e.getMonth()) return MONTHS[s.getMonth()] + ' ' + s.getDate() + '–' + e.getDate() + ', ' + s.getFullYear();
    return MON[s.getMonth()] + ' ' + s.getDate() + ' – ' + MON[e.getMonth()] + ' ' + e.getDate() + ', ' + e.getFullYear();
  }
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function fmtTime(t) {
    const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return '';
    let h = +m[1]; const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return h + (m[2] === '00' ? '' : ':' + m[2]) + ' ' + ap;
  }
  const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

  // ---------- state ----------
  const DEMO_PASSWORD = 'unit112';
  const LS_SITE = 'unit112-site-demo';
  let site = null;
  let mode = 'demo';          // 'live' when /api/site answers
  const LS_USERS = 'unit112-users-demo';
  const LS_SUBS = 'unit112-subs-demo';
  const LS_SUGG = 'unit112-suggestions-demo';
  const LS_SUGG_TO = 'unit112-suggest-to-demo';
  const DEFAULT_SUGGEST_TO = 'noahbellbridge@gmail.com';
  let token = ss.get('u112-token');
  let user = safe(() => JSON.parse(ss.get('u112-user')), null); // {username, name, role, clubs, tournaments}
  let dirty = false;
  let clubDay = 'all';        // Clubs page day filter
  let searchQuery = '';
  let lightbox = null;        // {album, i}
  const fullAccess = () => !!user && (user.role === 'owner' || user.role === 'editor');
  const isOwner = () => !!user && user.role === 'owner';
  let adminTab = 'branding';
  let pendingDelete = null;   // "listPath|index" awaiting inline confirm
  let pendingConfirm = null;  // e.g. 'reset', 'import'

  // ---------- backend ----------
  const backend = {
    async load() {
      try {
        const r = await fetch('/api/site', { cache: 'no-store' });
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          mode = 'live';
          const j = await r.json();
          return j && j.settings ? j : clone(window.DEFAULT_SITE);
        }
      } catch (e) { /* no API: demo mode */ }
      mode = 'demo';
      const raw = ls.get(LS_SITE);
      if (raw) { const j = safe(() => JSON.parse(raw), null); if (j && j.settings) return j; }
      return clone(window.DEFAULT_SITE);
    },
    async login(username, pw) {
      username = (username || 'webmaster').trim().toLowerCase();
      if (mode === 'live') {
        const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: pw }) });
        if (r.status === 429) throw new Error('Too many tries. Wait 15 minutes, then try again.');
        if (!r.ok) return false;
        const j = await r.json();
        token = j.token; user = j.user;
      } else {
        const u = demoUsers().find((x) => x.username === username && x.password === pw);
        if (!u) return false;
        token = 'demo'; user = { username: u.username, name: u.name, role: u.role, clubs: u.clubs || [], tournaments: u.tournaments || [] };
      }
      ss.set('u112-token', token); ss.set('u112-user', JSON.stringify(user));
      return true;
    },
    // ---- editor accounts (webmaster only) ----
    async listUsers() {
      if (mode !== 'live') return demoUsers().map((u) => Object.assign({}, u, { password: undefined }));
      const r = await this._auth('/api/users'); return (await r.json()).users || [];
    },
    async saveUser(u) {
      if (mode !== 'live') {
        const all = demoUsers(), i = all.findIndex((x) => x.username === u.username);
        const prev = i >= 0 ? all[i] : {};
        if (i < 0 && !u.password) throw new Error('Give the new account a password.');
        const rec = Object.assign({}, prev, u, { password: u.password || prev.password });
        if (i >= 0) all[i] = rec; else all.push(rec);
        ls.set(LS_USERS, JSON.stringify(all.filter((x) => x.username !== 'webmaster'))); return;
      }
      const r = await this._auth('/api/users', { method: 'POST', body: JSON.stringify(u) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'The account was not saved.');
    },
    async deleteUser(username) {
      if (mode !== 'live') { ls.set(LS_USERS, JSON.stringify(demoUsers().filter((x) => x.username !== username && x.username !== 'webmaster'))); return; }
      await this._auth('/api/users?u=' + encodeURIComponent(username), { method: 'DELETE' });
    },
    // ---- email reminders ----
    async subscribe(email, name, trap) {
      if (mode !== 'live') {
        const subs = demoSubs(); if (!subs.find((s) => s.email === email)) subs.push({ email, name, date: todayISO() });
        ls.set(LS_SUBS, JSON.stringify(subs)); return;
      }
      const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, name, website: trap }) });
      if (r.status === 429) throw new Error('Too many sign-ups from this connection. Try again later.');
      if (!r.ok) throw new Error('That email address was not accepted. Check it and try again.');
    },
    async listSubs() {
      if (mode !== 'live') return demoSubs();
      const r = await this._auth('/api/subscribers'); return (await r.json()).subscribers || [];
    },
    async removeSub(email) {
      if (mode !== 'live') { ls.set(LS_SUBS, JSON.stringify(demoSubs().filter((s) => s.email !== email))); return; }
      await this._auth('/api/subscribers?e=' + encodeURIComponent(email), { method: 'DELETE' });
    },
    async addSub(email, name) {
      if (mode !== 'live') return this.subscribe(email, name);
      const r = await this._auth('/api/subscribers', { method: 'POST', body: JSON.stringify({ email, name }) });
      if (!r.ok) throw new Error('That email address was not accepted.');
    },
    async send(msg) {
      if (mode !== 'live') throw new Error('Emails can only be sent from the live site, once an email service is connected (see the README).');
      const r = await this._auth('/api/send', { method: 'POST', body: JSON.stringify(msg) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Sending failed (error ' + r.status + ').');
      return j;
    },
    // ---- website suggestions ----
    async suggest(s) {
      if (mode !== 'live') {
        const all = safe(() => JSON.parse(ls.get(LS_SUGG) || '[]'), []) || [];
        all.unshift(Object.assign({ key: 'suggestion:' + new Date().toISOString(), date: new Date().toISOString() }, s));
        ls.set(LS_SUGG, JSON.stringify(all.slice(0, 100))); return { ok: true, emailed: false };
      }
      const r = await fetch('/api/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(s) });
      if (r.status === 429) throw new Error('Too many suggestions from this connection. Please try again in an hour.');
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Your suggestion was not sent. Please try again.');
      return r.json();
    },
    async suggestions() {
      if (mode !== 'live') return { to: ls.get(LS_SUGG_TO) || DEFAULT_SUGGEST_TO, emailReady: false, suggestions: safe(() => JSON.parse(ls.get(LS_SUGG) || '[]'), []) || [] };
      return (await this._auth('/api/suggest')).json();
    },
    async setSuggestTo(to) {
      if (mode !== 'live') { ls.set(LS_SUGG_TO, to); return; }
      const r = await this._auth('/api/suggest', { method: 'PUT', body: JSON.stringify({ to }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'The address was not saved.');
    },
    async deleteSuggestion(key) {
      if (mode !== 'live') { ls.set(LS_SUGG, JSON.stringify((safe(() => JSON.parse(ls.get(LS_SUGG) || '[]'), []) || []).filter((x) => x.key !== key))); return; }
      await this._auth('/api/suggest?key=' + encodeURIComponent(key), { method: 'DELETE' });
    },
    async campaigns() {
      if (mode !== 'live') return [];
      const r = await this._auth('/api/send'); return (await r.json()).campaigns || [];
    },
    async _auth(url, opt = {}) {
      const r = await fetch(url, Object.assign({}, opt, { headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token } }));
      if (r.status === 401) { logout(true); throw new Error('Your login has expired. Log in again.'); }
      if (r.status === 403) throw new Error('Your account is not allowed to do that.');
      return r;
    },
    async save(data) {
      if (mode === 'live') {
        const r = await fetch('/api/site', { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify(data) });
        if (r.status === 401) { logout(true); throw new Error('Your login has expired. Log in again, then press Save. Your edits are still on screen.'); }
        if (r.status === 403) throw new Error('Your account cannot save these changes.');
        if (!r.ok) throw new Error('The server did not accept the save (error ' + r.status + '). Wait a minute and press Save again.');
        return;
      }
      if (!ls.set(LS_SITE, JSON.stringify(data))) throw new Error('This browser would not store the changes (storage may be full or blocked). Use Backup & Handoff to copy your work.');
    },
    async upload(file, kind) {
      // kind: 'image' (logo, shrunk to 600px), 'photo' (gallery, 1600px), or 'file' (documents, bulletins)
      const isImage = kind === 'image' || kind === 'photo' || kind === 'icon';
      const px = kind === 'photo' ? (mode === 'live' ? 1600 : 1000) : kind === 'icon' ? 256 : 600;
      if (mode === 'live') {
        let body = file, type = file.type || 'application/octet-stream';
        if (isImage && /^image\/(png|jpe?g|webp)$/.test(file.type)) { const blob = await (await fetch(await shrinkImage(file, px, kind === 'photo'))).blob(); body = blob; type = blob.type; }
        const r = await fetch('/api/upload', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': type, 'x-filename': encodeURIComponent(file.name) }, body });
        if (r.status === 401) { logout(true); throw new Error('Your login has expired. Log in again and retry the upload.'); }
        if (!r.ok) throw new Error('Upload failed (error ' + r.status + '). Files must be under 20 MB.');
        return (await r.json()).url;
      }
      // Demo: keep the file inside the saved content as a data URL (images are shrunk first).
      if (isImage && /^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return shrinkImage(file, px, kind === 'photo');
      if (file.size > 1.5 * 1024 * 1024) throw new Error('In demo mode files must be under 1.5 MB. On the live site the limit is 20 MB.');
      return readAsDataURL(file);
    },
    async changePassword(current, next) {
      if (mode !== 'live') throw new Error('Passwords can be changed once the site is live. The demo password is always "' + DEMO_PASSWORD + '".');
      const r = await fetch('/api/password', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ current, next }) });
      if (r.status === 403) throw new Error('The current password is not correct.');
      if (!r.ok) throw new Error('The password was not changed (error ' + r.status + ').');
    },
    async listBackups() {
      if (mode !== 'live') return [];
      const r = await fetch('/api/backups', { headers: { authorization: 'Bearer ' + token } });
      return r.ok ? (await r.json()).backups || [] : [];
    },
    async getBackup(key) {
      const r = await fetch('/api/backups?key=' + encodeURIComponent(key), { headers: { authorization: 'Bearer ' + token } });
      if (!r.ok) throw new Error('That backup could not be loaded.');
      return r.json();
    },
  };
  // Demo-mode accounts live in this browser only (plain text, demo use only).
  function demoUsers() {
    const saved = safe(() => JSON.parse(ls.get(LS_USERS) || 'null'), null) || [
      { username: 'ithaca', name: 'Ithaca club manager (example)', role: 'club', clubs: ['c5'], tournaments: [], password: 'club112' },
      { username: 'rochester', name: 'Rochester Fall chair (example)', role: 'tournament', clubs: [], tournaments: ['t4'], password: 'chair112' },
    ];
    return [{ username: 'webmaster', name: 'Webmaster', role: 'owner', clubs: [], tournaments: [], password: DEMO_PASSWORD }].concat(saved.filter((u) => u.username !== 'webmaster'));
  }
  const demoSubs = () => safe(() => JSON.parse(ls.get(LS_SUBS) || '[]'), []) || [];
  function readAsDataURL(file) {
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error('The file could not be read.')); fr.readAsDataURL(file); });
  }
  async function shrinkImage(file, max, jpeg) {
    const url = await readAsDataURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That image could not be opened.')); i.src = url; });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return (jpeg || file.type === 'image/jpeg') ? c.toDataURL('image/jpeg', 0.85) : c.toDataURL('image/png');
  }

  // ---------- theme ----------
  function lum(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0;
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const onColor = (bg) => (contrast(bg, '#FFFFFF') >= contrast(bg, '#111111') ? '#FFFFFF' : '#111111');
  // Typefaces the webmaster can pick. "g" = Google Fonts family spec, loaded only when chosen.
  const SANS = ', Verdana, "Segoe UI", system-ui, sans-serif', SERIF = ', Georgia, "Times New Roman", serif';
  const FONTS = {
    atkinson: { label: 'Atkinson Hyperlegible (designed for low vision)', stack: '"Atkinson Hyperlegible"' + SANS, g: 'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400' },
    lexend: { label: 'Lexend (designed for easy reading)', stack: '"Lexend"' + SANS, g: 'Lexend:wght@400;600;700' },
    opensans: { label: 'Open Sans', stack: '"Open Sans"' + SANS, g: 'Open+Sans:ital,wght@0,400;0,700;1,400' },
    sourcesans: { label: 'Source Sans 3', stack: '"Source Sans 3"' + SANS, g: 'Source+Sans+3:ital,wght@0,400;0,700;1,400' },
    notosans: { label: 'Noto Sans', stack: '"Noto Sans"' + SANS, g: 'Noto+Sans:ital,wght@0,400;0,700;1,400' },
    lato: { label: 'Lato', stack: '"Lato"' + SANS, g: 'Lato:ital,wght@0,400;0,700;1,400' },
    roboto: { label: 'Roboto', stack: '"Roboto"' + SANS, g: 'Roboto:ital,wght@0,400;0,700;1,400' },
    nunito: { label: 'Nunito (rounded, friendly)', stack: '"Nunito"' + SANS, g: 'Nunito:ital,wght@0,400;0,700;1,400' },
    publicsans: { label: 'Public Sans', stack: '"Public Sans"' + SANS, g: 'Public+Sans:ital,wght@0,400;0,700;1,400' },
    librefranklin: { label: 'Libre Franklin', stack: '"Libre Franklin"' + SANS, g: 'Libre+Franklin:ital,wght@0,400;0,700;1,400' },
    verdana: { label: 'Verdana (built into computers)', stack: 'Verdana, Tahoma, sans-serif' },
    arial: { label: 'Arial / Helvetica (built in)', stack: 'Arial, Helvetica, sans-serif' },
    system: { label: "Device's own font", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
    literata: { label: 'Literata (serif)', stack: '"Literata"' + SERIF, g: 'Literata:opsz,wght@7..72,400;7..72,700' },
    merriweather: { label: 'Merriweather (serif, sturdy)', stack: '"Merriweather"' + SERIF, g: 'Merriweather:ital,wght@0,400;0,700;1,400' },
    sourceserif: { label: 'Source Serif 4 (serif)', stack: '"Source Serif 4"' + SERIF, g: 'Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400' },
    lora: { label: 'Lora (serif)', stack: '"Lora"' + SERIF, g: 'Lora:ital,wght@0,400;0,700;1,400' },
    playfair: { label: 'Playfair Display (serif, headings only)', stack: '"Playfair Display"' + SERIF, g: 'Playfair+Display:wght@600;700;800', headingOnly: true },
    serif: { label: 'Georgia (serif, built in)', stack: 'Georgia, "Times New Roman", serif' },
  };
  const fontLoaded = new Set(['atkinson', 'literata']);
  function ensureFont(key) {
    const f = FONTS[key];
    if (!f || !f.g || fontLoaded.has(key)) return;
    fontLoaded.add(key);
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap';
    document.head.appendChild(l);
  }
  const SIZE_STEPS = [1, 1.15, 1.32];
  // Browser-tab icon: the uploaded one, or a "112" badge drawn in the site's own colors.
  function badgeIcon(bg, band) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="r"><rect width="64" height="64" rx="13"/></clipPath></defs><g clip-path="url(#r)"><rect width="64" height="64" fill="${bg}"/><rect y="54" width="64" height="10" fill="${band}"/></g><text x="32" y="36" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-weight="700" font-size="28" fill="${onColor(bg)}">112</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  function setFavicon(href) {
    let l = document.getElementById('u112-icon');
    if (!l) { l = document.createElement('link'); l.id = 'u112-icon'; l.rel = 'icon'; document.head.appendChild(l); }
    if (l.getAttribute('href') !== href) l.setAttribute('href', href);
  }
  function applyTheme() {
    const st = site.settings, root = document.documentElement.style;
    const hc = ls.get('u112-hc') === '1';
    // High contrast overrides the chosen palette (inline values would otherwise win over the CSS class).
    const c = hc ? { primary: '#002B4D', secondary: '#00391F', accent: st.colors.accent, bg: '#FFFFFF', surface: '#FFFFFF', text: '#000000' } : st.colors;
    Object.keys(c).forEach((k) => root.setProperty('--' + k, c[k]));
    root.setProperty('--on-primary', onColor(c.primary));
    root.setProperty('--on-secondary', onColor(c.secondary));
    const bodyKey = FONTS[st.font] && !FONTS[st.font].headingOnly ? st.font : 'atkinson';
    const headKey = st.headingFont === 'same' ? bodyKey : (FONTS[st.headingFont] ? st.headingFont : 'literata');
    ensureFont(bodyKey); ensureFont(headKey);
    root.setProperty('--font-body', FONTS[bodyKey].stack); root.setProperty('--font-display', FONTS[headKey].stack);
    const step = +(ls.get('u112-size') || 0);
    root.setProperty('--base', Math.round((+st.baseSize || 20) * (SIZE_STEPS[step] || 1)) + 'px');
    document.documentElement.classList.toggle('hc', hc);
    document.title = st.siteName || 'ACBL Unit 112';
    setFavicon(st.favicon || badgeIcon(c.primary, st.colors.secondary));
  }

  // ---------- rich text (tiny markdown) ----------
  function inline(s) {
    return s
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|#|\/)[^)\s]*)\)/g, (m, t, u) => '<a href="' + u + '">' + t + '</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
  function md(src) {
    const lines = esc(src || '').split(/\r?\n/);
    let out = '', para = [], list = [];
    const flushP = () => { if (para.length) { out += '<p>' + inline(para.join('<br>')) + '</p>'; para = []; } };
    const flushL = () => { if (list.length) { out += '<ul>' + list.map((l) => '<li>' + inline(l) + '</li>').join('') + '</ul>'; list = []; } };
    lines.forEach((ln) => {
      const t = ln.trim();
      if (!t) { flushP(); flushL(); return; }
      let m;
      if ((m = /^#{2,3}\s+(.*)$/.exec(t))) { flushP(); flushL(); out += '<h2>' + inline(m[1]) + '</h2>'; return; }
      if ((m = /^[-*]\s+(.*)$/.exec(t))) { flushP(); list.push(m[1]); return; }
      flushL(); para.push(t);
    });
    flushP(); flushL();
    return out;
  }
  const MDHELP = 'Blank line = new paragraph. **bold** · *italic* · [link text](https://…) · start a line with "- " for a bullet or "## " for a heading.';

  // ---------- tournaments & clubs: automatic ACBL links ----------
  const validSanction = (s) => /^\d{7}$/.test(String(s || '').trim());
  function tLinks(t) {
    const s = String(t.sanction || '').trim();
    const flyer = t.flyerUrl || (validSanction(s) ? 'https://web2.acbl.org/Tournaments/Ads/20' + s.slice(0, 2) + '/' + s.slice(2, 4) + '/' + s + '.pdf' : '');
    const results = t.resultsUrl || (validSanction(s) ? 'https://live.acbl.org/events/' + s : '');
    return { flyer, results, flyerLabel: t.type === 'NAP' ? 'Registration form' : 'Tournament flyer' };
  }
  function tStatus(t) {
    const s = parseDate(t.start), e = parseDate(t.end) || s, now = today();
    if (!s) return 'upcoming';
    if (now < s) return 'upcoming';
    if (now <= e) return 'live';
    return 'past';
  }
  const byStart = (a, b) => (a.start || '9999').localeCompare(b.start || '9999');
  function cLinks(c) {
    const n = String(c.clubNumber || '').trim();
    return {
      live: c.liveUrl || (n ? 'https://my.acbl.org/club-results/' + n : ''),
      tcg: c.noTcg ? '' : (c.tcgUrl || (n ? 'https://tcgcloud.bridgefinesse.com/ClubWebHost/' + n + '/' : '')),
    };
  }

  const hasDetails = (t) => !!(t.address || t.venue || (t.sessions || []).length || t.hotels || t.food || t.parking || t.partnership || t.contacts || t.details || (t.bulletins || []).length);
  const newsLive = (n) => !n.expires || todayISO() <= n.expires;
  function gamesOn(dayKey) {
    const out = [];
    site.clubs.forEach((c) => (c.games || []).forEach((g) => { if (g.day === dayKey) out.push({ c, g }); }));
    return out.sort((a, b) => (a.g.time || '99').localeCompare(b.g.time || '99'));
  }
  const gameLi = ({ c, g }) => `<li><strong>${esc(fmtTime(g.time) || 'Time: ask the club')}</strong> · <a href="#clubs">${esc(c.name)}</a>${g.label ? ` · ${esc(g.label)}` : ''}</li>`;

  // ---------- routing ----------
  const route = () => (location.hash || '#home').slice(1) || 'home';
  window.addEventListener('hashchange', () => { pendingDelete = null; pendingConfirm = null; if (lightbox) { lightbox = null; renderLightbox(); } render(true); });

  // ---------- chrome (header, nav, footer) ----------
  function visiblePages() { return site.pages.filter((p) => p.show || p.id === 'home'); }
  function renderChrome() {
    const st = site.settings, r = route();
    const step = +(ls.get('u112-size') || 0);
    const hc = ls.get('u112-hc') === '1';
    const loggedIn = !!token;
    $('#adminbar').innerHTML = loggedIn ? `
      <div class="adminbar" role="region" aria-label="Webmaster tools"><div class="wrap">
        <strong>${esc(user ? user.name || user.username : 'Webmaster')}${mode === 'live' ? '' : ' · demo copy'}${dirty ? ' · <span>Unsaved changes</span>' : ''}</strong>
        <button class="btn small green" data-act="save" ${dirty ? '' : 'disabled'}>Save changes</button>
        ${r === 'admin' ? '<a class="btn small alt" href="#home">View site</a>' : '<a class="btn small alt" href="#admin">Open admin panel</a>'}
        <button class="btn small alt" data-act="logout">Log out</button>
      </div></div>` : '';
    $('#topbar').innerHTML = `
      <div class="wrap">
        <span>${st.showSuits ? '<span class="suits" aria-hidden="true">♠<span class="red">♥</span><span class="red">♦</span>♣</span> ' : ''}${esc(st.tagline)}</span>
        <div class="textsize" role="group" aria-label="Text size">
          <span>Text size</span>
          ${SIZE_STEPS.map((_, i) => `<button data-act="size" data-i="${i}" aria-pressed="${step === i}" style="font-size:${0.85 + i * 0.2}rem" aria-label="${['Normal', 'Large', 'Largest'][i]} text">A</button>`).join('')}
          <button data-act="hc" aria-pressed="${hc}" style="padding-inline:.6rem">High contrast</button>
        </div>
      </div>`;
    setFavicon(st.favicon || badgeIcon(st.colors.primary, st.colors.secondary));
    const A = st.alert || {};
    const alertOn = A.on && A.text && (!A.until || todayISO() <= A.until);
    $('#alert').innerHTML = alertOn ? `<div class="sitealert ${esc(A.level || 'urgent')}" role="region" aria-label="Important notice"><div class="wrap">
      <strong>${A.level === 'info' ? 'Notice' : 'Important'}:</strong> <span>${esc(A.text)}</span>${A.link ? ` <a href="${esc(A.link)}">More information</a>` : ''}</div></div>` : '';
    const logo = st.logo ? `<img src="${esc(st.logo)}" alt="${esc(st.logoAlt || st.siteName)}">` : `<span class="mark" aria-hidden="true"><span>112<small>UNIT</small></span></span>`;
    const mh = $('#masthead');
    mh.className = 'masthead band' + (st.headerStyle === 'center' ? ' center' : '');
    mh.innerHTML = `<div class="wrap"><a class="brand" href="#home">${logo}<span><span class="brand-name">${esc(st.siteName)}</span><span class="brand-tag" style="display:block">American Contract Bridge League · District 4</span></span></a>
      <form class="sitesearch" id="searchform" role="search"><label class="sr" for="q">Search this site</label><input type="search" id="q" placeholder="Search the site" value="${esc(searchQuery)}"><button class="btn" type="submit">Search</button></form></div>`;
    $('#nav').innerHTML = `<div class="wrap"><ul>${visiblePages().map((p) => `<li><a href="#${esc(p.id)}"${p.id === r || (p.id === 'tournaments' && r.startsWith('t-')) ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('')}</ul></div>`;
    const board = site.board.filter((b) => b.email);
    $('#footer').innerHTML = `<div class="wrap"><div class="cols">
      <div><h2>${esc(st.siteName)}</h2><p>${esc(st.footerText)}</p>${st.contactEmail ? `<p>Email: <a href="mailto:${esc(st.contactEmail)}">${esc(st.contactEmail)}</a></p>` : ''}</div>
      <div><h2>Find it fast</h2><ul>${visiblePages().slice(0, 6).map((p) => `<li><a href="#${esc(p.id)}">${esc(p.title)}</a></li>`).join('')}</ul></div>
      <div><h2>Bridge links</h2><div class="partner-logos">${(st.partnerLinks || []).map((l) => `<a href="${esc(l.url)}">${l.img ? `<img src="${esc(l.img)}" alt="${esc(l.name)}">` : esc(l.name)}</a>`).join('<br>')}</div>
        <p style="margin-top:1.25rem"><a href="#admin">Webmaster login</a></p></div>
    </div></div>`;
    void board;
  }

  // ---------- public pages ----------
  const panel = (inner, cls = '') => `<section class="panel ${cls}">${inner}</section>`;
  const head = (title, intro) => `<div class="page-head"><h1>${esc(title)}</h1>${intro ? `<div class="lead">${md(intro)}</div>` : ''}</div>`;
  const pageTitle = (id) => (site.pages.find((p) => p.id === id) || {}).title || '';

  function dateBlock(t) {
    const s = parseDate(t.start), e = parseDate(t.end) || s;
    if (!s) return '<div class="tdate">TBA</div>';
    const same = +s === +e;
    const days = same ? s.getDate() : (s.getMonth() === e.getMonth() ? s.getDate() + '–' + e.getDate() : s.getDate() + '–' + MON[e.getMonth()] + ' ' + e.getDate());
    return `<div class="tdate" aria-hidden="true"><span class="mo">${MON[s.getMonth()]} ${s.getFullYear()}</span><span class="d">${days}</span></div>`;
  }
  function tCard(t) {
    const st = tStatus(t), L = tLinks(t);
    const pill = st === 'live' ? '<span class="pill live">Playing now</span>' : st === 'upcoming' ? '<span class="pill up">Upcoming</span>' : '<span class="pill past">Completed</span>';
    const where = [t.venue, t.city].filter(Boolean).join(', ');
    let btns = '';
    if (st === 'past') btns = (L.results ? `<a class="btn" href="${esc(L.results)}">Results<span class="sr"> for ${esc(t.name)}</span></a>` : '<span class="muted">Results not linked yet</span>') + (L.flyer ? `<a class="btn alt" href="${esc(L.flyer)}">${L.flyerLabel}</a>` : '');
    else if (st === 'live') btns = (L.results ? `<a class="btn" href="${esc(L.results)}">Live results<span class="sr"> for ${esc(t.name)}</span></a>` : '') + (L.flyer ? `<a class="btn alt" href="${esc(L.flyer)}">${L.flyerLabel}</a>` : '');
    else btns = L.flyer ? `<a class="btn" href="${esc(L.flyer)}">${L.flyerLabel}<span class="sr"> for ${esc(t.name)}</span></a>` : '<span class="muted">Flyer coming soon</span>';
    if (hasDetails(t)) btns += `<a class="btn alt" href="#t-${esc(t.id)}">Details<span class="sr"> about ${esc(t.name)}</span></a>`;
    return `<article class="tcard">${dateBlock(t)}<div><h3>${hasDetails(t) ? `<a href="#t-${esc(t.id)}">${esc(t.name)}</a>` : esc(t.name)}</h3>
      <div class="tmeta">${pill}${esc(fmtRange(t.start, t.end))}${where ? ' · ' + esc(where) : ''}</div>
      ${t.notes ? `<div class="tmeta">${esc(t.notes)}</div>` : ''}
      ${st === 'upcoming' && validSanction(t.sanction) ? '<div class="tmeta">Results will appear here automatically when play begins.</div>' : ''}
      </div><div class="btnrow">${btns}</div></article>`;
  }

  const HOME = {
    welcome: () => panel(`<h1>${esc(site.content.welcomeTitle)}</h1><div class="rich lead">${md(site.content.welcome)}</div>
      <div class="btnrow"><a class="btn" href="#tournaments">See tournaments</a><a class="btn alt" href="#clubs">Find a club game</a>${site.pages.find((p) => p.id === 'newplayers' && p.show) ? '<a class="btn alt" href="#newplayers">New to bridge?</a>' : ''}</div>`),
    next: () => {
      const t = site.tournaments.filter((x) => tStatus(x) !== 'past').sort(byStart)[0];
      if (!t) return '';
      const st = tStatus(t), L = tLinks(t), n = daysBetween(today(), parseDate(t.start) || today());
      const count = st === 'live' ? '<b>Now</b>playing' : n === 0 ? '<b>Today</b>' : `<b>${n}</b>${n === 1 ? 'day' : 'days'} away`;
      return `<section class="feature" aria-labelledby="next-h"><div class="count">${count}</div>
        <div><div class="eyebrow">${st === 'live' ? 'Happening now' : 'Next tournament'}</div><h2 id="next-h">${esc(t.name)}</h2>
        <div>${esc(fmtRange(t.start, t.end))}${t.city ? ' · ' + esc(t.city) : ''}</div></div>
        <div class="btnrow">${st === 'live' && L.results ? `<a class="btn" href="${esc(L.results)}">Live results</a>` : L.flyer ? `<a class="btn" href="${esc(L.flyer)}">${L.flyerLabel}</a>` : ''}<a class="btn alt" href="#tournaments">All tournaments</a></div></section>`;
    },
    results: () => {
      const cutoff = today(); cutoff.setDate(cutoff.getDate() - 120);
      const past = site.tournaments.filter((t) => tStatus(t) === 'past' && (parseDate(t.end || t.start) || 0) >= cutoff).sort(byStart).reverse().slice(0, 4);
      if (!past.length) return '';
      return panel(`<h2>Latest results</h2><div class="quick">${past.map((t) => { const L = tLinks(t); return L.results ? `<a href="${esc(L.results)}">${esc(t.name)}<span>${esc(fmtRange(t.start, t.end))}</span></a>` : ''; }).join('')}</div>
        <p style="margin:1rem 0 0"><a href="#tournaments">All tournaments and past results</a></p>`);
    },
    news: () => {
      const items = site.news.filter(newsLive).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date || '').localeCompare(a.date || '')).slice(0, 6);
      if (!items.length) return '';
      return panel(`<h2>News & announcements</h2><div class="news">${items.map((n) => `<article><time datetime="${esc(n.date)}">${esc(fmtDate(n.date))}</time><h3>${esc(n.title)}</h3><div class="rich">${md(n.body)}</div></article>`).join('')}</div>`);
    },
    today: () => {
      const d0 = today(), d1 = new Date(d0); d1.setDate(d1.getDate() + 1);
      if (!site.clubs.some((c) => (c.games || []).length)) return '';
      const day = (d, label) => { const g = gamesOn(DAY_KEYS[d.getDay()]); return `<div><h3>${label} · ${DAYS[d.getDay()]}</h3>${g.length ? `<ul class="games">${g.map(gameLi).join('')}</ul>` : '<p class="empty">No club games listed.</p>'}</div>`; };
      return panel(`<h2>Where can I play?</h2><div class="grid2">${day(d0, 'Today')}${day(d1, 'Tomorrow')}</div><p style="margin:1rem 0 0"><a href="#clubs">Full weekly schedule</a></p>`);
    },
    signup: () => panel(`<h2>${esc(site.content.signupTitle)}</h2><p>${esc(site.content.signupText)}</p>
      <form id="signupform" class="signup" novalidate><div class="field"><label for="su-email">Email address</label><input type="email" id="su-email" autocomplete="email" required></div>
      <div class="field"><label for="su-name">Name (optional)</label><input type="text" id="su-name" autocomplete="name"></div>
      <div class="hp" aria-hidden="true"><label for="su-web">Leave this empty</label><input type="text" id="su-web" tabindex="-1" autocomplete="off"></div>
      <button class="btn green" type="submit">Sign me up</button></form><div id="signupmsg" role="status"></div>`, 'signup-panel'),
    clubs: () => site.clubs.length ? panel(`<h2>Club game results</h2><p class="muted">Tap your club to see its latest results on ACBL Live for Clubs.</p>
      <div class="quick">${site.clubs.map((c) => { const L = cLinks(c); return L.live ? `<a href="${esc(L.live)}">${esc(c.name)}<span>${esc(c.schedule || c.city || '')}</span></a>` : ''; }).join('')}</div>
      <p style="margin:1rem 0 0"><a href="#clubs">Club details and Common Game results</a></p>`) : '',
  };

  const PAGES = {
    home: () => `<div class="stack">${site.settings.homeSections.filter((s) => s.show).map((s) => (HOME[s.id] ? HOME[s.id]() : '')).join('')}</div>`,
    tournaments: () => {
      const all = site.tournaments.slice().sort(byStart);
      const live = all.filter((t) => tStatus(t) === 'live');
      const up = all.filter((t) => tStatus(t) === 'upcoming');
      const past = all.filter((t) => tStatus(t) === 'past').reverse();
      const years = [...new Set(past.map((t) => (t.start || '').slice(0, 4)))];
      return head(pageTitle('tournaments'), site.content.tournamentsIntro) + `<div class="stack">
        ${live.length ? `<section><h2>Playing now</h2><div class="tlist">${live.map(tCard).join('')}</div></section>` : ''}
        <section><h2>Upcoming</h2>${up.length ? `<div class="tlist">${up.map(tCard).join('')}</div>` : '<p class="empty">No upcoming tournaments are listed yet.</p>'}</section>
        <section><h2>Past results</h2>${past.length ? years.map((y) => `<h3>${esc(y)}</h3><div class="tlist">${past.filter((t) => (t.start || '').startsWith(y)).map(tCard).join('')}</div>`).join('') : '<p class="empty">No past results yet.</p>'}</section>
        <p class="muted">Sectional results are posted by the ACBL at <a href="https://live.acbl.org">live.acbl.org</a>. Masterpoints usually appear on MyACBL within a few days.</p></div>`;
    },
    clubs: () => {
      const tk = DAY_KEYS[today().getDay()];
      const hasGames = site.clubs.some((c) => (c.games || []).length);
      const list = clubDay === 'all' ? site.clubs : site.clubs.filter((c) => (c.games || []).some((g) => g.day === clubDay));
      const filt = hasGames ? `<div class="dayfilter" role="group" aria-label="Show clubs that play on">
        <button data-act="clubday" data-day="all" aria-pressed="${clubDay === 'all'}">All clubs</button>
        ${DAY_KEYS.map((d, i) => `<button data-act="clubday" data-day="${d}" aria-pressed="${clubDay === d}">${DAYS[i]}${d === tk ? ' (today)' : ''}</button>`).join('')}</div>` : '';
      const cards = list.map((c) => {
        const L = cLinks(c);
        const games = (c.games || []).slice().sort((a, b) => DAY_KEYS.indexOf(a.day) - DAY_KEYS.indexOf(b.day) || (a.time || '').localeCompare(b.time || ''));
        const addr = [c.address, c.city].filter(Boolean).join(', ');
        const rows = [['Where', c.address ? addr : c.city], ['Contact', c.contact], ['Notes', c.schedule], ['Club #', c.clubNumber]].filter((r) => r[1]);
        return `<article class="club"><h3>${esc(c.name)}</h3>
          ${games.length ? `<ul class="games">${games.map((g) => `<li${g.day === tk ? ' class="today"' : ''}><strong>${DAYS[DAY_KEYS.indexOf(g.day)] || esc(g.day)}</strong>${g.time ? ' ' + esc(fmtTime(g.time)) : ''}${g.label ? ' · ' + esc(g.label) : ''}${g.day === tk ? ' <span class="pill up">Today</span>' : ''}</li>`).join('')}</ul>` : ''}
          <dl>${rows.map((r) => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>
          ${c.address ? `<a href="${esc(mapsUrl(addr))}">Directions<span class="sr"> to ${esc(c.name)}</span></a>` : ''}
          ${c.website ? `<a href="${esc(c.website)}">Club website</a>` : ''}
          <div class="btnrow">${L.live ? `<a class="btn small" href="${esc(L.live)}">Results<span class="sr"> for ${esc(c.name)}</span></a>` : ''}${L.tcg ? `<a class="btn small alt" href="${esc(L.tcg)}">Common Game<span class="sr"> for ${esc(c.name)}</span></a>` : ''}</div></article>`;
      }).join('');
      return head(pageTitle('clubs'), site.content.clubsIntro) + filt + (site.clubs.length ? (cards ? `<div class="clubs">${cards}</div>` : '<p class="empty">No clubs list a game on that day.</p>') : '<p class="empty">No clubs listed yet.</p>');
    },
    learn: () => {
      const L = site.learn || { teachers: [], resources: [] };
      return head(pageTitle('learn')) + `<div class="stack">${panel(`<div class="rich lead">${md(site.content.learn)}</div>`)}
        ${panel(`<h2>Teachers and classes</h2>${L.teachers.length ? `<div class="clubs">${L.teachers.map((t) => `<article class="club"><h3>${esc(t.name)}</h3><dl>${[['Where', t.area], ['When', t.when], ['Contact', t.contact]].filter((r) => r[1]).map((r) => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>${t.notes ? `<div class="rich">${md(t.notes)}</div>` : ''}${t.url ? `<a href="${esc(t.url)}">More information</a>` : ''}</article>`).join('')}</div>` : '<p class="empty">Ask at any club about lessons. Teachers will be listed here.</p>'}`)}
        ${L.resources.length ? panel(`<h2>Learn at home</h2><ul>${L.resources.map((r) => `<li><a href="${esc(r.url)}">${esc(r.title)}</a></li>`).join('')}</ul>`) : ''}</div>`;
    },
    gallery: () => {
      const albums = (site.gallery || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return head(pageTitle('gallery'), site.content.galleryIntro) + (albums.length ? `<div class="stack">${albums.map((al) => panel(`<h2>${esc(al.title)}</h2>${al.date ? `<p class="muted">${esc(fmtDate(al.date))}</p>` : ''}
        ${(al.photos || []).length ? `<ul class="photos">${al.photos.map((ph, i) => `<li><button class="photo" data-act="photo" data-album="${esc(al.id)}" data-i="${i}"><img src="${esc(ph.url)}" alt="${esc(ph.caption || al.title)}" loading="lazy"></button>${ph.caption ? `<span>${esc(ph.caption)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty">Photos coming soon.</p>'}`)).join('')}</div>` : '<p class="empty">Photo albums will appear here.</p>');
    },
    newplayers: () => head(pageTitle('newplayers')) + panel(`<div class="rich">${md(site.content.newplayers)}</div>`),
    recognition: () => {
      const R = site.recognition;
      const tbl = (rows, cols, empty) => rows.length ? `<div class="tablewrap"><table><thead><tr>${cols.map((c) => `<th scope="col">${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((r) => `<tr>${cols.map((c) => `<td>${esc(c[0] === 'date' ? fmtDate(r.date) : r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : `<p class="empty">${empty}</p>`;
      return head(pageTitle('recognition'), site.content.recognitionIntro) + `<div class="stack">
        ${panel('<h2>New Life Masters</h2>' + tbl(R.lifeMasters, [['name', 'Player'], ['club', 'Home club'], ['date', 'Date']], 'New Life Masters will be listed here.'))}
        ${panel('<h2>Milestones and rank changes</h2>' + tbl(R.milestones, [['name', 'Player'], ['achievement', 'Achievement'], ['date', 'Date']], 'Player milestones will be listed here.'))}
        ${R.links.length ? panel('<h2>Standings</h2><ul>' + R.links.map((l) => `<li><a href="${esc(l.url)}">${esc(l.title)}</a></li>`).join('') + '</ul>') : ''}</div>`;
    },
    about: () => head(pageTitle('about')) + `<div class="stack">${panel(`<div class="rich">${md(site.content.about)}</div>`)}
      ${panel(`<h2>Unit 112 Board</h2>${site.board.length ? `<div class="tablewrap"><table><thead><tr><th scope="col">Position</th><th scope="col">Name</th><th scope="col">Email</th></tr></thead><tbody>${site.board.map((b) => `<tr><td>${esc(b.role)}</td><td>${esc(b.name)}</td><td>${b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Board members will be listed here.</p>'}`)}</div>`,
    documents: () => {
      const docs = site.documents.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const cats = [...new Set(docs.map((d) => d.category || 'Other'))];
      return head(pageTitle('documents'), site.content.documentsIntro) + (docs.length ? `<div class="stack">${cats.map((c) => panel(`<h2>${esc(c)}</h2><ul>${docs.filter((d) => (d.category || 'Other') === c).map((d) => `<li><a href="${esc(d.url)}">${esc(d.title)}</a>${d.date ? ` <span class="muted">· ${esc(fmtDate(d.date))}</span>` : ''}</li>`).join('')}</ul>`)).join('')}</div>` : '<p class="empty">Bylaws, minutes and reports will be posted here.</p>');
    },
    contact: () => head(pageTitle('contact')) + `<div class="stack">${panel(`<div class="rich">${md(site.content.contact)}</div>${site.settings.contactEmail ? `<p><strong>Unit email:</strong> <a href="mailto:${esc(site.settings.contactEmail)}">${esc(site.settings.contactEmail)}</a></p>` : ''}`)}
      ${site.board.length ? panel(`<h2>Board members</h2><ul>${site.board.map((b) => `<li><strong>${esc(b.role)}:</strong> ${esc(b.name)}${b.email ? ` · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}</li>`).join('')}</ul>`) : ''}${suggestForm()}</div>`,
  };

  function tournamentPage(t) {
    const st = tStatus(t), L = tLinks(t);
    const where = [t.venue, t.address, t.city].filter(Boolean).join(', ');
    const sessions = (t.sessions || []).slice().sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));
    const sec = (title, body) => body ? panel(`<h2>${title}</h2><div class="rich">${md(body)}</div>`) : '';
    const bl = (t.bulletins || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return `<p><a href="#tournaments">← All tournaments</a></p><div class="page-head"><h1>${esc(t.name)}</h1>
      <p class="lead">${esc(fmtRange(t.start, t.end))}${t.city ? ' · ' + esc(t.city) : ''}</p>
      <div class="btnrow">${st !== 'upcoming' && L.results ? `<a class="btn" href="${esc(L.results)}">${st === 'live' ? 'Live results' : 'Results'}</a>` : ''}${L.flyer ? `<a class="btn ${st === 'upcoming' ? '' : 'alt'}" href="${esc(L.flyer)}">${L.flyerLabel}</a>` : ''}${where ? `<a class="btn alt" href="${esc(mapsUrl(where))}">Directions</a>` : ''}</div></div>
      <div class="stack">
      ${t.notes || t.details ? panel(`${t.notes ? `<p class="lead">${esc(t.notes)}</p>` : ''}<div class="rich">${md(t.details)}</div>`) : ''}
      ${sessions.length ? panel(`<h2>Schedule</h2><div class="tablewrap"><table><thead><tr><th scope="col">Day</th><th scope="col">Time</th><th scope="col">Event</th></tr></thead><tbody>${sessions.map((x) => { const d = parseDate(x.date); return `<tr><td>${d ? DAYS[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate() : ''}</td><td>${esc(fmtTime(x.time))}</td><td>${esc(x.event)}</td></tr>`; }).join('')}</tbody></table></div>`) : ''}
      ${where ? panel(`<h2>Where</h2><p>${esc(where)}</p><a class="btn alt" href="${esc(mapsUrl(where))}">Open in maps</a>`) : ''}
      ${bl.length ? panel(`<h2>Daily bulletins</h2><ul>${bl.map((b) => `<li><a href="${esc(b.url)}">${esc(b.title || 'Bulletin')}</a>${b.date ? ` <span class="muted">· ${esc(fmtDate(b.date))}</span>` : ''}</li>`).join('')}</ul>`) : ''}
      ${sec('Partnerships', t.partnership)}${sec('Hotels', t.hotels)}${sec('Food', t.food)}${sec('Parking', t.parking)}${sec('Contacts', t.contacts)}
      </div>`;
  }

  // ---------- site search ----------
  const stripMd = (s) => String(s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*#>-]/g, ' ');
  function searchIndex() {
    const idx = [], P = (id) => site.pages.find((p) => p.id === id);
    const add = (title, text, href, kind) => idx.push({ title, text: stripMd(text), href, kind });
    const shown = (id) => { const p = P(id); return p && (p.show || id === 'home'); };
    add(site.content.welcomeTitle, site.content.welcome, '#home', 'Home');
    site.news.filter(newsLive).forEach((n) => add(n.title, n.body + ' ' + fmtDate(n.date), '#home', 'News'));
    if (shown('tournaments')) site.tournaments.forEach((t) => add(t.name, [fmtRange(t.start, t.end), t.city, t.venue, t.address, t.notes, t.details, t.hotels, t.food, t.parking, t.partnership, t.contacts, (t.sessions || []).map((x) => x.event).join(' ')].join(' '), hasDetails(t) ? '#t-' + t.id : '#tournaments', 'Tournament'));
    if (shown('clubs')) site.clubs.forEach((c) => add(c.name + ' club', [c.city, c.address, c.schedule, c.contact, (c.games || []).map((g) => DAYS[DAY_KEYS.indexOf(g.day)] + ' ' + fmtTime(g.time) + ' ' + g.label).join(' ')].join(' '), '#clubs', 'Club'));
    ['newplayers', 'learn', 'about', 'contact'].forEach((id) => { if (shown(id)) add(P(id).title, site.content[id], '#' + id, 'Page'); });
    if (shown('learn')) (site.learn.teachers || []).forEach((t) => add(t.name, [t.area, t.when, t.contact, t.notes].join(' '), '#learn', 'Teacher'));
    if (shown('about')) site.board.forEach((b) => add(b.name, b.role, '#about', 'Board'));
    if (shown('documents')) site.documents.forEach((d) => add(d.title, d.category + ' ' + fmtDate(d.date), d.url, 'Document'));
    if (shown('recognition')) { site.recognition.lifeMasters.forEach((r) => add(r.name, 'New Life Master ' + (r.club || ''), '#recognition', 'Recognition')); site.recognition.milestones.forEach((r) => add(r.name, r.achievement, '#recognition', 'Recognition')); }
    if (shown('gallery')) (site.gallery || []).forEach((a) => add(a.title, (a.photos || []).map((p) => p.caption).join(' '), '#gallery', 'Photos'));
    site.pages.filter((p) => p.custom && p.show).forEach((p) => add(p.title, p.body, '#' + p.id, 'Page'));
    return idx;
  }
  function searchPage() {
    const q = searchQuery.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const hits = !words.length ? [] : searchIndex().map((it) => {
      const hay = (it.title + ' ' + it.text).toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      const score = words.reduce((s, w) => s + (it.title.toLowerCase().includes(w) ? 3 : 1), 0);
      const pos = it.text.toLowerCase().indexOf(words[0]);
      const snip = pos >= 0 ? (pos > 60 ? '…' : '') + it.text.slice(Math.max(0, pos - 60), pos + 120).replace(/\s+/g, ' ').trim() + '…' : '';
      return Object.assign({ score, snip }, it);
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    return `<div class="page-head"><h1>Search</h1></div>
      <form class="sitesearch big" id="searchform2" role="search"><label class="sr" for="q2">Search this site</label><input type="search" id="q2" value="${esc(searchQuery)}" placeholder="Try: Elmira, Tuesday, bylaws, 499er"><button class="btn" type="submit">Search</button></form>
      ${words.length ? `<p class="muted" role="status">${hits.length} result${hits.length === 1 ? '' : 's'} for “${esc(searchQuery)}”</p>
      <ol class="results">${hits.map((h) => `<li><a href="${esc(h.href)}">${esc(h.title)}</a> <span class="pill past">${esc(h.kind)}</span>${h.snip ? `<p>${esc(h.snip)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Type a club, town, day of the week or topic.</p>'}`;
  }

  function lightboxHTML() {
    if (!lightbox) return '';
    const al = (site.gallery || []).find((a) => a.id === lightbox.album); if (!al) return '';
    const ph = al.photos[lightbox.i]; if (!ph) return '';
    return `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Photo ${lightbox.i + 1} of ${al.photos.length}">
      <div class="lb-bar"><span>${esc(al.title)} · ${lightbox.i + 1} of ${al.photos.length}</span><button class="btn" data-act="lb-close">Close ✕</button></div>
      <img src="${esc(ph.url)}" alt="${esc(ph.caption || al.title)}">${ph.caption ? `<p>${esc(ph.caption)}</p>` : ''}
      <div class="btnrow lb-nav"><button class="btn alt" data-act="lb-prev" ${lightbox.i === 0 ? 'disabled' : ''}>← Previous</button><button class="btn alt" data-act="lb-next" ${lightbox.i === al.photos.length - 1 ? 'disabled' : ''}>Next →</button></div></div>`;
  }
  function renderLightbox() {
    $('#lb').innerHTML = lightboxHTML();
    document.body.style.overflow = lightbox ? 'hidden' : '';
    if (lightbox) $('#lb [data-act="lb-close"]').focus();
  }

  function suggestForm() {
    if (!site.settings.showSuggest) return '';
    const pages = visiblePages().map((p) => p.title);
    return panel(`<h2 id="suggest">${esc(site.content.suggestTitle)}</h2><p>${esc(site.content.suggestText)}</p>
      <form id="suggestform" class="form" novalidate>
        <div class="field"><label for="sg-msg">Your suggestion</label><textarea id="sg-msg" rows="5" required></textarea></div>
        <div class="field"><label for="sg-page">Which page is it about?</label><select id="sg-page"><option value="">The whole site / not sure</option>${pages.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="row2"><div class="field"><label for="sg-name">Your name (optional)</label><input type="text" id="sg-name" autocomplete="name"></div>
        <div class="field"><label for="sg-email">Your email (optional)</label><input type="email" id="sg-email" autocomplete="email" aria-describedby="sg-email-h"><span class="help" id="sg-email-h">Only if you'd like a reply.</span></div></div>
        <div class="hp" aria-hidden="true"><label for="sg-web">Leave this empty</label><input type="text" id="sg-web" tabindex="-1" autocomplete="off"></div>
        <div><button class="btn green" type="submit">Send suggestion</button></div>
      </form><div id="suggestmsg" role="status"></div>`, 'signup-panel');
  }

  function renderPublic(id) {
    if (id === 'search') return searchPage();
    if (id.startsWith('t-')) { const t = site.tournaments.find((x) => 't-' + x.id === id); if (t) return tournamentPage(t); }
    const p = site.pages.find((x) => x.id === id);
    if (p && p.custom) return head(p.title) + panel(`<div class="rich">${md(p.body)}</div>`);
    if (PAGES[id] && (!p || p.show || id === 'home' || token)) return PAGES[id]();
    return `<h1>Page not found</h1><p>That page is not on this site. <a href="#home">Go to the home page</a>.</p>`;
  }

  // ---------- render ----------
  function render(scrollTop) {
    const r = route();
    renderChrome();
    $('#view').innerHTML = r === 'admin' ? renderAdmin() : renderPublic(r);
    if (scrollTop) { window.scrollTo(0, 0); }
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  }
  function markDirty() { if (!dirty) { dirty = true; renderChrome(); } }
  function logout(expired) {
    token = null; ss.del('u112-token');
    if (!expired) { user = null; ss.del('u112-user'); }
    if (!expired) { dirty = false; }
    render();
  }

  // Admin rendering and editing are defined in admin.js (same scope via the build).
  /*@ADMIN@*/

  // ---------- global events ----------
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'size') { ls.set('u112-size', b.dataset.i); applyTheme(); renderChrome(); return; }
    if (act === 'hc') { ls.set('u112-hc', ls.get('u112-hc') === '1' ? '0' : '1'); applyTheme(); renderChrome(); return; }
    if (act === 'skip') { e.preventDefault(); $('#main').focus(); return; }
    if (act === 'clubday') { clubDay = b.dataset.day; $('#view').innerHTML = renderPublic('clubs'); const f = document.querySelector(`[data-act="clubday"][data-day="${clubDay}"]`); if (f) f.focus(); return; }
    if (act === 'photo') { lightbox = { album: b.dataset.album, i: +b.dataset.i, from: b }; renderLightbox(); return; }
    if (act === 'lb-close') { const from = lightbox && lightbox.from; lightbox = null; renderLightbox(); if (from && document.body.contains(from)) from.focus(); return; }
    if (act === 'lb-prev' || act === 'lb-next') { lightbox.i += act === 'lb-next' ? 1 : -1; renderLightbox(); return; }
    if (act === 'logout') { if (dirty) { pendingConfirm = 'logout'; location.hash = '#admin'; render(); return; } logout(); location.hash = '#home'; return; }
    if (act === 'save') { await doSave(); return; }
    if (typeof adminClick === 'function') adminClick(b, act, e);
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox) return;
    const al = (site.gallery || []).find((a) => a.id === lightbox.album);
    if (e.key === 'Escape') { lightbox = null; renderLightbox(); }
    else if (e.key === 'ArrowRight' && al && lightbox.i < al.photos.length - 1) { lightbox.i++; renderLightbox(); }
    else if (e.key === 'ArrowLeft' && lightbox.i > 0) { lightbox.i--; renderLightbox(); }
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target;
    if (f.id === 'searchform' || f.id === 'searchform2') {
      e.preventDefault();
      searchQuery = (f.querySelector('input[type=search]').value || '').trim();
      if (route() === 'search') { render(); const q2 = $('#q2'); if (q2) { q2.focus(); } } else location.hash = '#search';
      return;
    }
    if (f.id === 'suggestform') {
      e.preventDefault();
      const msgEl = $('#suggestmsg'), message = $('#sg-msg').value.trim(), email = $('#sg-email').value.trim();
      if (message.length < 3) { msgEl.innerHTML = '<p class="formerr">Please write your suggestion first.</p>'; $('#sg-msg').focus(); return; }
      if (email && !validEmail(email)) { msgEl.innerHTML = '<p class="formerr">That email address does not look right. Leave it blank if you don\'t need a reply.</p>'; $('#sg-email').focus(); return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      try {
        await backend.suggest({ message, page: $('#sg-page').value, name: $('#sg-name').value.trim(), email, website: $('#sg-web').value });
        f.hidden = true; msgEl.innerHTML = `<p class="formok">Thank you! Your suggestion was sent to the webmaster.${email ? ' They may reply to ' + esc(email) + '.' : ''}</p>`; msgEl.focus && msgEl.setAttribute('tabindex', '-1'); msgEl.focus();
      } catch (err) { btn.disabled = false; msgEl.innerHTML = `<p class="formerr">${esc(err.message)}</p>`; }
      return;
    }
    if (f.id === 'signupform') {
      e.preventDefault();
      const email = $('#su-email').value.trim(), name = $('#su-name').value.trim(), msg = $('#signupmsg');
      if (!validEmail(email)) { msg.innerHTML = '<p class="formerr">Please enter a full email address, like name@example.com.</p>'; $('#su-email').focus(); return; }
      try { await backend.subscribe(email, name, $('#su-web').value); f.hidden = true; msg.innerHTML = `<p class="formok">Thank you. Reminders will go to <strong>${esc(email)}</strong>.</p>`; }
      catch (err) { msg.innerHTML = `<p class="formerr">${esc(err.message)}</p>`; }
    }
  });
  async function doSave() {
    try { await backend.save(site); dirty = false; renderChrome(); toast('Saved. The site is updated.'); }
    catch (err) { toast(err.message); }
  }
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- boot ----------
  (async function boot() {
    site = await backend.load();
    // fill any keys added in newer versions
    const D = window.DEFAULT_SITE;
    site.settings = Object.assign(clone(D.settings), site.settings || {});
    site.content = Object.assign(clone(D.content), site.content || {});
    site.recognition = Object.assign(clone(D.recognition), site.recognition || {});
    ['news', 'tournaments', 'clubs', 'board', 'documents', 'pages', 'gallery'].forEach((k) => { if (!Array.isArray(site[k])) site[k] = clone(D[k]); });
    site.learn = Object.assign(clone(D.learn), site.learn || {});
    site.settings.alert = Object.assign(clone(D.settings.alert), site.settings.alert || {});
    // Sections and built-in pages added in later versions of the site
    D.settings.homeSections.forEach((h, i) => { if (!site.settings.homeSections.find((x) => x.id === h.id)) site.settings.homeSections.splice(Math.min(i, site.settings.homeSections.length), 0, clone(h)); });
    D.pages.forEach((p, i) => { if (!site.pages.find((x) => x.id === p.id)) site.pages.splice(Math.min(i, site.pages.length), 0, clone(p)); });
    const T0 = { address: '', sessions: [], hotels: '', food: '', parking: '', partnership: '', contacts: '', details: '', bulletins: [] };
    ['tournaments', 'clubs', 'news', 'board', 'documents', 'gallery'].forEach((k) => site[k].forEach((it) => { if (!it.id) it.id = uid('x'); }));
    site.tournaments.forEach((t) => { Object.keys(T0).forEach((k) => { if (t[k] == null) t[k] = clone(T0[k]); }); });
    site.clubs.forEach((c) => { if (!Array.isArray(c.games)) c.games = []; });
    site.gallery.forEach((a) => { if (!Array.isArray(a.photos)) a.photos = []; });
    if ((token === 'demo' && mode === 'live') || (token && !user)) { token = null; user = null; ss.del('u112-token'); ss.del('u112-user'); }
    applyTheme();
    render();
  })();
})();
