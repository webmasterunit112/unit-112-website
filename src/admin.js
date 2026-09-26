  // =====================================================================
  // ADMIN PANEL (inserted into app.js at build time; shares its scope)
  // =====================================================================
  // Which tabs each kind of account sees. The server enforces the same limits on save.
  const ALL_TABS = [
    ['alert', 'Urgent notice'],
    ['branding', 'Look & logo'],
    ['layout', 'Menu & home layout'],
    ['home', 'Home page & news'],
    ['tournaments', 'Tournaments'],
    ['clubs', 'Clubs'],
    ['learn', 'Learn to Play'],
    ['gallery', 'Photos'],
    ['text', 'Page text'],
    ['people', 'Board & documents'],
    ['recognition', 'Player recognition'],
    ['email', 'Email reminders'],
    ['suggestions', 'Website suggestions'],
    ['accounts', 'Editor accounts'],
    ['backup', 'Backup, password & handoff'],
  ];
  const ROLES = {
    owner: { label: 'Webmaster (everything)', tabs: ALL_TABS.map((t) => t[0]) },
    editor: { label: 'Editor (all content, no accounts)', tabs: ALL_TABS.map((t) => t[0]).filter((t) => t !== 'accounts' && t !== 'suggestions') },
    club: { label: 'Club manager (own club only)', tabs: ['myclubs', 'password'] },
    tournament: { label: 'Tournament chair (own tournaments only)', tabs: ['mytournaments', 'password'] },
  };
  const EXTRA_TABS = { myclubs: 'My club', mytournaments: 'My tournaments', password: 'My password' };
  function myTabs() {
    const r = ROLES[(user && user.role) || 'owner'] || ROLES.club;
    return r.tabs.map((k) => [k, (ALL_TABS.find((t) => t[0] === k) || [k, EXTRA_TABS[k]])[1]]);
  }

  const PRESETS = {
    'Finger Lakes': { primary: '#1C4966', secondary: '#2F6B4F', accent: '#C08A2B', bg: '#F3F7F6', surface: '#FFFFFF', text: '#15232B' },
    'Navy & gold': { primary: '#1B2A4A', secondary: '#2C4270', accent: '#C9A227', bg: '#F6F5F1', surface: '#FFFFFF', text: '#161B26' },
    'Card table': { primary: '#1E5631', secondary: '#7A1F2B', accent: '#C9A227', bg: '#F3F6F1', surface: '#FFFFFF', text: '#14201A' },
    'High contrast': { primary: '#000000', secondary: '#003A70', accent: '#B8860B', bg: '#FFFFFF', surface: '#FFFFFF', text: '#000000' },
  };
  const COLOR_LABELS = { primary: 'Main color (header, buttons)', secondary: 'Menu bar color', accent: 'Highlight color', bg: 'Page background', surface: 'Card background', text: 'Text color' };
  const DAY_OPTS = DAY_KEYS.map((d, i) => [d, DAYS[i]]);

  const SCHEMAS = {
    news: { noun: 'news item', title: (i) => i.title || 'Untitled news item', sub: (i) => fmtDate(i.date) + (i.pinned ? ' · pinned' : '') + (!newsLive(i) ? ' · expired' : ''),
      blank: () => ({ title: '', date: todayISO(), body: '', pinned: false, expires: '' }),
      fields: [{ k: 'title', l: 'Headline' }, { row: [{ k: 'date', l: 'Date', t: 'date' }, { k: 'expires', l: 'Hide after (optional)', t: 'date', h: 'The item disappears from the site after this date.' }] }, { k: 'pinned', l: 'Pin to the top of the home page', t: 'check' }, { k: 'body', l: 'Text', t: 'textarea', h: MDHELP }] },
    tournaments: { noun: 'tournament', title: (i) => i.name || 'New tournament', sub: (i) => fmtRange(i.start, i.end) + (i.city ? ' · ' + i.city : ''),
      blank: () => ({ name: '', type: 'Sectional', start: '', end: '', city: '', venue: '', address: '', sanction: '', flyerUrl: '', resultsUrl: '', notes: '', sessions: [], hotels: '', food: '', parking: '', partnership: '', contacts: '', details: '', bulletins: [] }),
      fields: [
        { k: 'name', l: 'Tournament name' },
        { k: 'type', l: 'Type', t: 'select', o: ['Sectional', 'NAP', 'GNT', 'STaC', 'Regional', 'Unit game', 'Other'] },
        { row: [{ k: 'start', l: 'First day', t: 'date' }, { k: 'end', l: 'Last day', t: 'date', h: 'Same as first day for a one-day event.' }] },
        { row: [{ k: 'city', l: 'City' }, { k: 'venue', l: 'Venue name' }] },
        { k: 'address', l: 'Street address', h: 'Used for the Directions button.' },
        { k: 'sanction', l: 'ACBL sanction number', h: 'The 7-digit number on the ACBL flyer, e.g. 2610314. With it, the flyer and results links are filled in automatically.' },
        { k: 'flyerUrl', l: 'Flyer or registration link (optional)', t: 'url', h: 'Leave blank to use the ACBL flyer for the sanction number.' },
        { k: 'resultsUrl', l: 'Results link (optional)', t: 'url', h: 'Leave blank to use ACBL Live results for the sanction number.' },
        { k: 'notes', l: 'Short note (optional)', h: 'One line shown in the tournament list, e.g. "Non-Life Master and 499er events".' },
        { sep: 'Tournament page', h: 'Anything you fill in below gives this tournament its own page with a Details button.' },
        { k: 'sessions', l: 'Schedule of events', t: 'sublist', noun: 'session', blank: { date: '', time: '', event: '' }, cols: [{ k: 'date', l: 'Day', t: 'date' }, { k: 'time', l: 'Start time', t: 'time' }, { k: 'event', l: 'Event', ph: 'e.g. Open Pairs (stratified)' }] },
        { k: 'details', l: 'About this tournament', t: 'textarea', rows: 5, h: MDHELP },
        { k: 'partnership', l: 'Partnerships', t: 'textarea', rows: 3, h: 'e.g. who to call for a partner, and by when.' },
        { k: 'hotels', l: 'Hotels', t: 'textarea', rows: 3 },
        { k: 'food', l: 'Food and lunch', t: 'textarea', rows: 3 },
        { k: 'parking', l: 'Parking and accessibility', t: 'textarea', rows: 3 },
        { k: 'contacts', l: 'Contacts', t: 'textarea', rows: 3, h: 'Chair, partnership chair, director.' },
        { k: 'bulletins', l: 'Daily bulletins', t: 'sublist', noun: 'bulletin', blank: { title: '', date: '', url: '' }, cols: [{ k: 'title', l: 'Title', ph: 'e.g. Saturday bulletin' }, { k: 'date', l: 'Date', t: 'date' }, { k: 'url', l: 'File', t: 'file' }] },
      ], derived: true },
    clubs: { noun: 'club', title: (i) => i.name || 'New club', sub: (i) => ((i.games || []).length ? (i.games || []).map((g) => g.day).join(', ') : 'no games listed'),
      blank: () => ({ name: '', city: '', clubNumber: '', schedule: '', address: '', contact: '', website: '', liveUrl: '', tcgUrl: '', noTcg: false, games: [] }),
      fields: [
        { row: [{ k: 'name', l: 'Club name' }, { k: 'city', l: 'City' }] },
        { k: 'games', l: 'Weekly games', t: 'sublist', noun: 'game', blank: { day: 'Mon', time: '', label: '' }, cols: [{ k: 'day', l: 'Day', t: 'select', o: DAY_OPTS }, { k: 'time', l: 'Start time', t: 'time' }, { k: 'label', l: 'Game', ph: 'e.g. Open pairs, 499er' }], h: 'These power "Where can I play today?" on the home page and the day filter on the Clubs page.' },
        { k: 'schedule', l: 'Schedule notes (optional)', h: 'e.g. "No game on holidays" or "Reservations requested".' },
        { k: 'address', l: 'Street address', h: 'Adds a Directions link.' },
        { row: [{ k: 'contact', l: 'Contact (name / phone)' }, { k: 'website', l: 'Club website', t: 'url' }] },
        { k: 'clubNumber', l: 'ACBL club number', h: 'With this, the Live for Clubs and Common Game links are filled in automatically.' },
        { k: 'liveUrl', l: 'Results link override (optional)', t: 'url', h: 'Only if the automatic ACBL Live for Clubs link is wrong.' },
        { k: 'tcgUrl', l: 'Common Game link override (optional)', t: 'url' },
        { k: 'noTcg', l: 'This club does not play the Common Game', t: 'check' },
      ], derived: true },
    board: { noun: 'board member', title: (i) => i.name || 'New board member', sub: (i) => i.role || '',
      blank: () => ({ name: '', role: '', email: '' }),
      fields: [{ row: [{ k: 'name', l: 'Name' }, { k: 'role', l: 'Position' }] }, { k: 'email', l: 'Email (optional, shown publicly)', t: 'email' }] },
    documents: { noun: 'document', title: (i) => i.title || 'New document', sub: (i) => (i.category || '') + (i.date ? ' · ' + fmtDate(i.date) : ''),
      blank: () => ({ title: '', category: 'Minutes', date: todayISO(), url: '' }),
      fields: [{ k: 'title', l: 'Title' }, { row: [{ k: 'category', l: 'Category', t: 'select', o: ['Bylaws', 'Minutes', 'Financial reports', 'Tournament reports', 'Forms', 'Other'] }, { k: 'date', l: 'Date', t: 'date' }] }, { k: 'url', l: 'File', t: 'file', h: 'Upload a PDF or Word file, or paste a link (e.g. a Google Drive share link).' }] },
    lifeMasters: { noun: 'Life Master', title: (i) => i.name || 'New Life Master', sub: (i) => fmtDate(i.date),
      blank: () => ({ name: '', club: '', date: todayISO() }),
      fields: [{ row: [{ k: 'name', l: 'Player' }, { k: 'club', l: 'Home club' }] }, { k: 'date', l: 'Date', t: 'date' }] },
    milestones: { noun: 'milestone', title: (i) => i.name || 'New milestone', sub: (i) => i.achievement || '',
      blank: () => ({ name: '', achievement: '', date: todayISO() }),
      fields: [{ row: [{ k: 'name', l: 'Player' }, { k: 'achievement', l: 'Achievement', h: 'e.g. "Silver Life Master" or "500 masterpoints"' }] }, { k: 'date', l: 'Date', t: 'date' }] },
    links: { noun: 'link', title: (i) => i.title || 'New link', sub: () => '',
      blank: () => ({ title: '', url: '' }), fields: [{ k: 'title', l: 'Link text' }, { k: 'url', l: 'Address', t: 'url' }] },
    partnerLinks: { noun: 'footer link', title: (i) => i.name || 'New link', sub: () => '',
      blank: () => ({ name: '', url: '', img: '' }), fields: [{ k: 'name', l: 'Name' }, { k: 'url', l: 'Address', t: 'url' }, { k: 'img', l: 'Logo image (optional)', t: 'image' }] },
    teachers: { noun: 'teacher or class', title: (i) => i.name || 'New teacher or class', sub: (i) => i.area || '',
      blank: () => ({ name: '', area: '', when: '', contact: '', url: '', notes: '' }),
      fields: [{ row: [{ k: 'name', l: 'Teacher or class name' }, { k: 'area', l: 'Where', h: 'Town or club' }] }, { row: [{ k: 'when', l: 'When', h: 'e.g. "Tuesdays in October, 10 am"' }, { k: 'contact', l: 'Contact' }] }, { k: 'url', l: 'Link (optional)', t: 'url' }, { k: 'notes', l: 'Notes', t: 'textarea', rows: 3 }] },
    albums: { noun: 'photo album', title: (i) => i.title || 'New album', sub: (i) => (i.photos || []).length + ' photos' + (i.date ? ' · ' + fmtDate(i.date) : ''),
      blank: () => ({ title: '', date: todayISO(), photos: [] }),
      fields: [{ row: [{ k: 'title', l: 'Album title', h: 'e.g. "Rochester Fall Sectional 2026"' }, { k: 'date', l: 'Date', t: 'date' }] }, { k: 'photos', l: 'Photos', t: 'photos' }] },
  };

  // ---- path helpers ("tournaments.3.name") ----
  function getPath(p) { return p.split('.').reduce((o, k) => (o == null ? o : o[k]), site); }
  function setPath(p, v) { const ks = p.split('.'), last = ks.pop(); const o = ks.reduce((o, k) => o[k], site); o[last] = v; }
  const fid = (path) => 'f-' + path.replace(/\./g, '-');

  // ---- field rendering ----
  function inputHTML(t, path, v, extra = '') {
    return `<input type="${t}" id="${fid(path)}" data-path="${path}" value="${esc(v)}"${extra}>`;
  }
  function selectHTML(opts, path, v, extra = '') {
    return `<select id="${fid(path)}" data-path="${path}"${extra}>${opts.map((o) => { const val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o; return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
  }
  function fileControl(path, v, isImg, label, kind) {
    const id = fid(path);
    const prev = v ? (isImg ? `<img class="imgprev" src="${esc(v)}" alt="Current image">` : `<a href="${esc(v)}">${v.startsWith('data:') ? 'Uploaded file' : esc(v.length > 60 ? v.slice(0, 57) + '…' : v)}</a>`) : '<span class="muted">None yet</span>';
    return `<div>${prev}</div><div class="btnrow"><label class="btn small alt" for="${id}-up">Upload ${isImg ? 'image' : 'file'}</label><input class="sr" type="file" id="${id}-up" data-upload="${path}" data-kind="${kind || (isImg ? 'image' : 'file')}" accept="${isImg ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt,image/*'}">
      ${v ? `<button class="btn small danger" data-act="clearfield" data-path="${path}">Remove</button>` : ''}</div>
      ${!isImg ? `<input type="url" id="${id}" data-path="${path}" value="${v && !v.startsWith('data:') ? esc(v) : ''}" placeholder="…or paste a link" aria-label="${esc(label)} link">` : ''}`;
  }
  function fieldHTML(f, base) {
    if (f.row) return `<div class="row2">${f.row.map((x) => fieldHTML(x, base)).join('')}</div>`;
    if (f.sep) return `<div class="sep"><h3>${esc(f.sep)}</h3>${f.h ? `<p class="help">${esc(f.h)}</p>` : ''}</div>`;
    const path = base + '.' + f.k, id = fid(path), v = getPath(path);
    const help = f.h ? `<span class="help" id="${id}-h">${esc(f.h)}</span>` : '';
    const dby = f.h ? ` aria-describedby="${id}-h"` : '';
    const t = f.t || 'text';
    if (t === 'check') return `<div class="field check"><input type="checkbox" id="${id}" data-path="${path}" ${v ? 'checked' : ''}><label for="${id}">${esc(f.l)}</label></div>`;
    if (t === 'textarea') return `<div class="field"><label for="${id}">${esc(f.l)}</label><textarea id="${id}" data-path="${path}"${dby} rows="${f.rows || 7}">${esc(v)}</textarea>${help}</div>`;
    if (t === 'select') return `<div class="field"><label for="${id}">${esc(f.l)}</label>${selectHTML(f.o, path, v)}${help}</div>`;
    if (t === 'image' || t === 'file' || t === 'icon') return `<div class="field"><span class="lbl">${esc(f.l)}</span>${fileControl(path, v, t !== 'file', f.l, t === 'icon' ? 'icon' : null)}${help}</div>`;
    if (t === 'sublist') {
      const rows = v || [];
      return `<fieldset class="field sublist"><legend class="lbl">${esc(f.l)}</legend>${help}
        ${rows.length ? `<ol class="subrows">${rows.map((r, j) => `<li>${f.cols.map((c) => {
          const cp = path + '.' + j + '.' + c.k, lab = `${c.l} (${f.noun} ${j + 1})`;
          if (c.t === 'select') return `<div class="field"><label for="${fid(cp)}">${esc(c.l)}</label>${selectHTML(c.o, cp, r[c.k])}</div>`;
          if (c.t === 'file') return `<div class="field wide"><span class="lbl">${esc(c.l)}</span>${fileControl(cp, r[c.k], false, lab)}</div>`;
          return `<div class="field${c.t ? '' : ' wide'}"><label for="${fid(cp)}">${esc(c.l)}</label>${inputHTML(c.t || 'text', cp, r[c.k], c.ph ? ` placeholder="${esc(c.ph)}"` : '')}</div>`;
        }).join('')}<button class="btn small danger" data-act="subdel" data-path="${path}" data-i="${j}">Remove ${esc(f.noun)}</button></li>`).join('')}</ol>` : `<p class="empty">No ${esc(f.noun)}s yet.</p>`}
        <div><button class="btn small green" data-act="subadd" data-path="${path}" data-blank='${esc(JSON.stringify(f.blank))}'>Add a ${esc(f.noun)}</button></div></fieldset>`;
    }
    if (t === 'photos') {
      const ph = v || [];
      return `<fieldset class="field sublist"><legend class="lbl">${esc(f.l)}</legend>
        ${ph.length ? `<ol class="photoedit">${ph.map((p, j) => `<li><img src="${esc(p.url)}" alt=""><div class="field"><label for="${fid(path + '.' + j + '.caption')}">Caption</label>${inputHTML('text', path + '.' + j + '.caption', p.caption, ' placeholder="Who and what is in the photo"')}</div>
          <div class="btnrow"><button class="btn small alt" data-act="up" data-list="${path}" data-i="${j}" ${j === 0 ? 'disabled' : ''}>Earlier</button><button class="btn small alt" data-act="down" data-list="${path}" data-i="${j}" ${j === ph.length - 1 ? 'disabled' : ''}>Later</button><button class="btn small danger" data-act="subdel" data-path="${path}" data-i="${j}">Remove</button></div></li>`).join('')}</ol>` : '<p class="empty">No photos yet.</p>'}
        <div class="btnrow"><label class="btn small green" for="${id}-multi">Add photos</label><input class="sr" type="file" multiple accept="image/*" id="${id}-multi" data-multi="${path}"></div>
        <span class="help">You can pick several photos at once. Large photos are shrunk automatically. Captions help people using screen readers.</span></fieldset>`;
    }
    return `<div class="field"><label for="${id}">${esc(f.l)}</label>${inputHTML(t, path, v, dby)}${help}</div>`;
  }

  function derivedHTML(listKey, i) {
    const it = getPath(listKey)[i];
    if (listKey === 'tournaments') {
      const L = tLinks(it), s = String(it.sanction || '').trim();
      const warn = s && !validSanction(s) ? '<div style="color:#9B1C1C;font-weight:700">A sanction number is 7 digits. Check the ACBL flyer.</div>' : '';
      return `${warn}<div><strong>Status:</strong> ${({ upcoming: 'Upcoming', live: 'Playing now', past: 'Completed' })[tStatus(it)]}</div>
        <div><strong>${L.flyerLabel}:</strong> ${L.flyer ? `<a href="${esc(L.flyer)}">${esc(L.flyer)}</a>` : 'none'}</div>
        <div><strong>Results:</strong> ${L.results ? `<a href="${esc(L.results)}">${esc(L.results)}</a>` : 'none'}</div>
        <div><strong>Tournament page:</strong> ${hasDetails(it) ? `<a href="#t-${esc(it.id)}">view it</a>` : 'not yet (fill in the Tournament page section)'}</div>`;
    }
    const L = cLinks(it);
    return `<div><strong>Results link:</strong> ${L.live ? `<a href="${esc(L.live)}">${esc(L.live)}</a>` : 'none'}</div><div><strong>Common Game:</strong> ${L.tcg ? `<a href="${esc(L.tcg)}">${esc(L.tcg)}</a>` : 'none'}</div>`;
  }

  // opts: openIndex, extraButtons, only (array of ids: show just these), locked (no add/move/delete)
  function listEditor(schemaKey, listPath, opts = {}) {
    const S = SCHEMAS[schemaKey], arr = getPath(listPath) || [];
    const items = arr.map((it, i) => {
      if (opts.only && !opts.only.includes(it.id)) return '';
      const key = listPath + '|' + i;
      const open = opts.openIndex === i || (opts.only && opts.only.length === 1) || pendingDelete === key ? ' open' : '';
      const confirm = pendingDelete === key
        ? `<div class="confirm" role="alert">Delete this ${S.noun}? <button class="btn small danger" data-act="del-yes" data-list="${listPath}" data-i="${i}">Yes, delete</button><button class="btn small alt" data-act="del-no">Keep it</button></div>`
        : `<button class="btn small danger" data-act="del" data-list="${listPath}" data-i="${i}">Delete</button>`;
      const tools = opts.locked ? '' : `<div class="item-tools"><button class="btn small alt" data-act="up" data-list="${listPath}" data-i="${i}" ${i === 0 ? 'disabled' : ''}>Move up</button><button class="btn small alt" data-act="down" data-list="${listPath}" data-i="${i}" ${i === arr.length - 1 ? 'disabled' : ''}>Move down</button>${confirm}</div>`;
      return `<details class="item"${open}><summary><span data-sum="${listPath}.${i}" data-schema="${schemaKey}">${esc(S.title(it))}</span><span class="sub" data-subsum="${listPath}.${i}">${esc(S.sub(it))}</span></summary>
        <div class="body">${S.fields.map((f) => fieldHTML(f, listPath + '.' + i)).join('')}
        ${S.derived ? `<div class="derived" id="derived-${listPath.replace(/\./g, '-')}-${i}" aria-live="polite">${derivedHTML(listPath, i)}</div>` : ''}
        ${tools}</div></details>`;
    }).join('');
    return `<div class="stack" style="gap:.6rem">
      ${opts.locked ? '' : `<div class="btnrow"><button class="btn green" data-act="add" data-list="${listPath}" data-schema="${schemaKey}">Add a ${S.noun}</button>${opts.extraButtons || ''}</div>`}
      ${items || `<p class="empty">${opts.locked ? 'Nothing has been assigned to your account yet. Ask the webmaster.' : `Nothing here yet. Press "Add a ${S.noun}".`}</p>`}</div>`;
  }
  let openAfterAdd = null; // {list, i}
  function openIdx(list) { return openAfterAdd && openAfterAdd.list === list ? openAfterAdd.i : -1; }

  function orderList(listPath, row) {
    const arr = getPath(listPath);
    return `<ol class="orderlist">${arr.map((it, i) => `<li>
      <button class="btn small alt" data-act="up" data-list="${listPath}" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
      <button class="btn small alt" data-act="down" data-list="${listPath}" data-i="${i}" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
      ${row(it, i)}</li>`).join('')}</ol>`;
  }

  // async-loaded admin data (accounts, subscribers)
  let accounts = null, editingUser = null, subs = null, campaignList = null, mailDraft = null, sugg = null;

  function passwordPanel() {
    if (mode !== 'live') return `<div class="panel"><h3>Change your password</h3><p>This is the demo copy. Demo passwords can't be changed. On the live site you change yours here.</p></div>`;
    return `<div class="panel"><h3>Change your password</h3><div class="row2"><div class="field"><label for="pw-cur">Current password</label><input type="password" id="pw-cur" autocomplete="current-password"></div><div class="field"><label for="pw-new">New password (10+ characters)</label><input type="password" id="pw-new" autocomplete="new-password"></div></div><div class="btnrow" style="margin-top:.75rem"><button class="btn" data-act="changepw">Change password</button></div></div>`;
  }

  // ---- tabs ----
  const ADMIN_TABS = {
    alert() {
      const A = site.settings.alert;
      const live = A.on && A.text && (!A.until || todayISO() <= A.until);
      return `<h2>Urgent notice</h2><div class="form">
        <p>Shows a bright bar across the top of every page. Use it for cancellations, weather closures and venue changes.</p>
        <div class="notice"><p><strong>Right now:</strong> ${live ? 'the notice is showing on the site' : 'no notice is showing'}${A.on && A.until && todayISO() > A.until ? ' (it switched off after ' + esc(fmtDate(A.until)) + ')' : ''}.</p></div>
        ${fieldHTML({ k: 'on', l: 'Show the notice', t: 'check' }, 'settings.alert')}
        ${fieldHTML({ k: 'text', l: 'Message', h: 'Keep it short, e.g. "Syracuse game cancelled today (Tuesday) because of snow."' }, 'settings.alert')}
        <div class="row2">${fieldHTML({ k: 'level', l: 'Style', t: 'select', o: [['urgent', 'Urgent (red)'], ['warning', 'Warning (yellow)'], ['info', 'Information (blue)']] }, 'settings.alert')}
        ${fieldHTML({ k: 'until', l: 'Switch off after (optional)', t: 'date', h: 'The notice disappears on its own after this date.' }, 'settings.alert')}</div>
        ${fieldHTML({ k: 'link', l: 'Link for more information (optional)', t: 'url' }, 'settings.alert')}
        <p class="help">Press Save for members to see the change.</p></div>`;
    },
    branding() {
      const st = site.settings, c = st.colors;
      const warn = [];
      if (contrast(c.text, c.bg) < 7) warn.push('Text on the page background is below the high-readability level (7:1). Consider a darker text color.');
      if (contrast(c.primary, onColor(c.primary)) < 4.5) warn.push('Button and header text will be hard to read on the main color.');
      if (contrast(c.secondary, onColor(c.secondary)) < 4.5) warn.push('Menu text will be hard to read on the menu bar color.');
      return `<h2>Look & logo</h2><div class="form">
        ${fieldHTML({ k: 'siteName', l: 'Site name' }, 'settings')}
        ${fieldHTML({ k: 'tagline', l: 'Tagline (top bar)' }, 'settings')}
        ${fieldHTML({ k: 'logo', l: 'Logo', t: 'image' }, 'settings')}
        ${fieldHTML({ k: 'logoAlt', l: 'Logo description for screen readers' }, 'settings')}
        ${fieldHTML({ k: 'favicon', l: 'Site icon (the small picture in browser tabs and bookmarks)', t: 'icon', h: 'Optional. A square image works best, at least 180 × 180 pixels. Without one, the site uses a "112" badge in your main color.' }, 'settings')}
        <div class="field"><span class="lbl">Color presets</span><div class="presets">${Object.keys(PRESETS).map((n) => `<button class="preset" data-act="preset" data-name="${esc(n)}"><i style="background:${PRESETS[n].primary}"></i><i style="background:${PRESETS[n].secondary}"></i>${esc(n)}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Colors</span><div class="swatches">${Object.keys(COLOR_LABELS).map((k) => `<div class="swatch"><input type="color" id="col-${k}" data-path="settings.colors.${k}" value="${esc(c[k])}"><label for="col-${k}">${COLOR_LABELS[k]}<code>${esc(c[k])}</code></label></div>`).join('')}</div>
        <div id="contrast-warn" aria-live="polite">${warn.length ? `<div class="notice"><p><strong>Readability check:</strong> ${warn.join(' ')}</p></div>` : '<p class="help" style="color:var(--secondary);font-weight:700">Readability check: colors pass.</p>'}</div></div>
        <div class="row2">${fieldHTML({ k: 'font', l: 'Text typeface', t: 'select', o: Object.keys(FONTS).filter((k) => !FONTS[k].headingOnly).map((k) => [k, FONTS[k].label]) }, 'settings')}
        ${fieldHTML({ k: 'headingFont', l: 'Heading typeface', t: 'select', o: [['same', 'Same as text']].concat(Object.keys(FONTS).map((k) => [k, FONTS[k].label])) }, 'settings')}</div>
        <div class="fontsample" aria-hidden="true"><div class="fs-h">Rochester Fall Sectional</div><div>Open Pairs start at 10 am. Bring your partner and your convention card. ♠ A K Q <span class="red">♥ J 10</span></div></div>
        ${fieldHTML({ k: 'baseSize', l: 'Standard text size', t: 'select', o: [['18', 'Medium (18px)'], ['20', 'Large (20px), recommended'], ['22', 'Larger (22px)'], ['24', 'Extra large (24px)']] }, 'settings')}
        <div class="row2">${fieldHTML({ k: 'headerStyle', l: 'Header layout', t: 'select', o: [['left', 'Logo on the left'], ['center', 'Logo centered']] }, 'settings')}
        ${fieldHTML({ k: 'showSuits', l: 'Show ♠♥♦♣ in the top bar', t: 'check' }, 'settings')}</div>
        ${fieldHTML({ k: 'footerText', l: 'Footer text', t: 'textarea', rows: 3 }, 'settings')}
        ${fieldHTML({ k: 'contactEmail', l: 'Unit contact email (optional)', t: 'email' }, 'settings')}
        <h3>Footer links and logos</h3>${listEditor('partnerLinks', 'settings.partnerLinks')}</div>`;
    },
    layout() {
      return `<h2>Menu & home layout</h2><div class="form">
        <h3>Menu</h3><p class="help">Rename pages, change their order, or hide the ones you do not use. Hidden pages keep their content.</p>
        ${orderList('pages', (p, i) => `<input type="text" data-path="pages.${i}.title" value="${esc(p.title)}" aria-label="Menu name for ${esc(p.title)}">
          ${p.id === 'home' ? '<span class="tag">always shown</span>' : `<label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" data-path="pages.${i}.show" ${p.show ? 'checked' : ''} style="width:1.3rem;height:1.3rem"> Show</label>`}
          <span class="tag">${p.custom ? 'your page' : 'built-in'}</span>
          ${p.custom ? (pendingDelete === 'pages|' + i ? `<span class="confirm">Delete page? <button class="btn small danger" data-act="del-yes" data-list="pages" data-i="${i}">Yes</button><button class="btn small alt" data-act="del-no">No</button></span>` : `<button class="btn small danger" data-act="del" data-list="pages" data-i="${i}">Delete</button>`) : ''}`)}
        <div class="btnrow"><button class="btn green" data-act="addpage">Add a new page</button></div>
        <p class="help">New pages get their text on the Page text tab.</p>
        <h3>Home page sections</h3><p class="help">Choose which blocks appear on the home page and in what order.</p>
        ${orderList('settings.homeSections', (s, i) => `<label style="display:flex;gap:.5rem;align-items:center;flex:1"><input type="checkbox" data-path="settings.homeSections.${i}.show" ${s.show ? 'checked' : ''} style="width:1.3rem;height:1.3rem"> ${esc(s.label)}</label>`)}
      </div>`;
    },
    home() {
      return `<h2>Home page & news</h2><div class="form">
        ${fieldHTML({ k: 'welcomeTitle', l: 'Welcome heading' }, 'content')}
        ${fieldHTML({ k: 'welcome', l: 'Welcome message', t: 'textarea', h: MDHELP }, 'content')}
        <h3>News & announcements</h3><p class="help">The six newest items show on the home page. Pinned items come first. Items with a "Hide after" date disappear on their own.</p>
        ${listEditor('news', 'news', { openIndex: openIdx('news') })}</div>`;
    },
    tournaments() {
      return `<h2>Tournaments</h2><div class="form">
        <div class="notice"><p><strong>Automatic results:</strong> enter the 7-digit ACBL sanction number and the site links the ACBL flyer before the tournament, then switches to the ACBL Live results link on the first day of play. Completed tournaments move to Past results on their own.</p></div>
        ${fieldHTML({ k: 'tournamentsIntro', l: 'Introduction at the top of the page', t: 'textarea', rows: 3 }, 'content')}
        ${listEditor('tournaments', 'tournaments', { openIndex: openIdx('tournaments'), extraButtons: '<button class="btn alt" data-act="sortlist" data-list="tournaments">Sort by date</button>' })}</div>`;
    },
    mytournaments() {
      return `<h2>My tournaments</h2><div class="form"><p>You can update the tournaments assigned to you: schedule, hotels, bulletins and links. Press Save when you're done.</p>
        ${listEditor('tournaments', 'tournaments', { only: (user && user.tournaments) || [], locked: true })}</div>`;
    },
    clubs() {
      return `<h2>Clubs</h2><div class="form">
        ${fieldHTML({ k: 'clubsIntro', l: 'Introduction at the top of the page', t: 'textarea', rows: 3 }, 'content')}
        ${listEditor('clubs', 'clubs', { openIndex: openIdx('clubs') })}</div>`;
    },
    myclubs() {
      return `<h2>My club</h2><div class="form"><p>Keep your game days, times and contact details current. Press Save when you're done.</p>
        ${listEditor('clubs', 'clubs', { only: (user && user.clubs) || [], locked: true })}</div>`;
    },
    learn() {
      return `<h2>Learn to Play</h2><div class="form">
        ${fieldHTML({ k: 'learn', l: 'Introduction', t: 'textarea', rows: 5, h: MDHELP }, 'content')}
        <h3>Teachers and classes</h3>${listEditor('teachers', 'learn.teachers', { openIndex: openIdx('learn.teachers') })}
        <h3>Learn-at-home links</h3>${listEditor('links', 'learn.resources', { openIndex: openIdx('learn.resources') })}</div>`;
    },
    gallery() {
      return `<h2>Photos</h2><div class="form">
        ${fieldHTML({ k: 'galleryIntro', l: 'Introduction', t: 'textarea', rows: 2 }, 'content')}
        ${mode === 'live' ? '' : '<div class="notice"><p>Demo copy: photos are stored in this browser, which holds only a few dozen. The live site holds up to 1 GB.</p></div>'}
        ${listEditor('albums', 'gallery', { openIndex: openIdx('gallery') })}</div>`;
    },
    text() {
      const custom = site.pages.map((p, i) => [p, i]).filter(([p]) => p.custom);
      return `<h2>Page text</h2><div class="form"><p class="help">${esc(MDHELP)}</p>
        ${fieldHTML({ k: 'newplayers', l: 'New Players page', t: 'textarea', rows: 14 }, 'content')}
        ${fieldHTML({ k: 'about', l: 'About the Unit page', t: 'textarea', rows: 8 }, 'content')}
        ${fieldHTML({ k: 'contact', l: 'Contact page', t: 'textarea', rows: 5 }, 'content')}
        ${fieldHTML({ k: 'recognitionIntro', l: 'Player Recognition introduction', t: 'textarea', rows: 3 }, 'content')}
        ${fieldHTML({ k: 'documentsIntro', l: 'Board Documents introduction', t: 'textarea', rows: 3 }, 'content')}
        ${fieldHTML({ k: 'signupTitle', l: 'Email sign-up heading' }, 'content')}
        ${fieldHTML({ k: 'signupText', l: 'Email sign-up text', t: 'textarea', rows: 3 }, 'content')}
        ${custom.length ? '<h3>Your pages</h3>' + custom.map(([p, i]) => fieldHTML({ k: 'body', l: p.title + ' page', t: 'textarea', rows: 10 }, 'pages.' + i)).join('') : '<p class="help">Pages you add on the Menu tab appear here.</p>'}</div>`;
    },
    people() {
      return `<h2>Board & documents</h2><div class="form"><h3>Board members</h3>${listEditor('board', 'board', { openIndex: openIdx('board') })}
        <h3>Board documents</h3>${listEditor('documents', 'documents', { openIndex: openIdx('documents') })}</div>`;
    },
    recognition() {
      return `<h2>Player recognition</h2><div class="form"><h3>New Life Masters</h3>${listEditor('lifeMasters', 'recognition.lifeMasters', { openIndex: openIdx('recognition.lifeMasters') })}
        <h3>Milestones and rank changes</h3>${listEditor('milestones', 'recognition.milestones', { openIndex: openIdx('recognition.milestones') })}
        <h3>Standings links</h3>${listEditor('links', 'recognition.links')}</div>`;
    },
    email() {
      if (subs === null) { loadSubs(); return '<h2>Email reminders</h2><p>Loading subscribers…</p>'; }
      const upcoming = site.tournaments.filter((t) => tStatus(t) === 'upcoming').sort(byStart);
      const d = mailDraft || { tid: '', subject: '', text: '', test: '' };
      const partial = (campaignList || []).filter((c) => c.remaining > 0);
      return `<h2>Email reminders</h2><div class="form">
        ${mode === 'live' ? '' : '<div class="notice"><p>Demo copy: sign-ups are kept in this browser and sending is switched off. On the live site, emails go out through Resend once it is connected (README, step 9).</p></div>'}
        <div class="panel"><h3>Subscribers: ${subs.length}</h3>
          <p class="help">People sign up with the box on the home page. Everyone gets an unsubscribe link in each email.</p>
          ${subs.length ? `<div class="tablewrap"><table><thead><tr><th scope="col">Email</th><th scope="col">Name</th><th scope="col">Since</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>${subs.map((s) => `<tr><td>${esc(s.email)}</td><td>${esc(s.name || '')}</td><td>${esc(fmtDate(s.date))}</td><td><button class="btn small danger" data-act="unsub" data-email="${esc(s.email)}">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No subscribers yet.</p>'}
          <div class="row2" style="margin-top:1rem"><div class="field"><label for="addsub-email">Add an email by hand</label><input type="email" id="addsub-email"></div><div class="field"><label for="addsub-name">Name (optional)</label><input type="text" id="addsub-name"></div></div>
          <div class="btnrow" style="margin-top:.6rem"><button class="btn small alt" data-act="addsub">Add subscriber</button><button class="btn small alt" data-act="subscsv">Show list as CSV</button></div><div id="csvbox"></div></div>
        <div class="panel"><h3>Write a reminder</h3>
          <div class="field"><label for="mail-t">Start from a tournament</label><select id="mail-t" data-mail="tid"><option value="">Choose…</option>${upcoming.map((t) => `<option value="${esc(t.id)}" ${d.tid === t.id ? 'selected' : ''}>${esc(t.name)}: ${esc(fmtRange(t.start, t.end))}</option>`).join('')}</select><span class="help">Fills in the subject and message. You can change both.</span></div>
          <div class="field"><label for="mail-subject">Subject</label><input type="text" id="mail-subject" data-mail="subject" value="${esc(d.subject)}"></div>
          <div class="field"><label for="mail-text">Message</label><textarea id="mail-text" data-mail="text" rows="10">${esc(d.text)}</textarea><span class="help">Plain text. An unsubscribe link is added at the bottom automatically.</span></div>
          <div class="row2"><div class="field"><label for="mail-test">Send a test to</label><input type="email" id="mail-test" data-mail="test" value="${esc(d.test)}"></div><div class="btnrow" style="align-items:end"><button class="btn alt" data-act="mailtest">Send test</button></div></div>
          <div class="btnrow" style="margin-top:1rem">${pendingConfirm === 'sendall' ? `<div class="confirm" role="alert">Send this to all ${subs.length} subscribers? <button class="btn small green" data-act="mailall-yes">Yes, send</button><button class="btn small alt" data-act="cancel">Not yet</button></div>` : `<button class="btn green" data-act="mailall" ${subs.length ? '' : 'disabled'}>Send to all ${subs.length} subscribers</button>`}</div>
          <p class="help">Resend's free plan sends 100 emails a day. With more subscribers than that, the rest are held and a "Continue sending" button appears below the next day.</p></div>
        ${partial.length ? `<div class="panel"><h3>Unfinished sends</h3><ul>${partial.map((c) => `<li>${esc(c.subject)}: ${c.sent} sent, ${c.remaining} waiting <button class="btn small green" data-act="mailcontinue" data-id="${esc(c.id)}">Continue sending</button></li>`).join('')}</ul></div>` : ''}
      </div>`;
    },
    accounts() {
      if (accounts === null) { loadAccounts(); return '<h2>Editor accounts</h2><p>Loading accounts…</p>'; }
      const u = editingUser;
      const form = u ? `<div class="panel"><h3>${u.isNew ? 'New account' : 'Edit ' + esc(u.username)}</h3><div class="form">
        <div class="row2"><div class="field"><label for="acc-username">Username</label><input type="text" id="acc-username" data-acc="username" value="${esc(u.username)}" ${u.isNew ? '' : 'readonly'} autocomplete="off"><span class="help">Lowercase letters and numbers, e.g. "ithaca".</span></div>
        <div class="field"><label for="acc-name">Display name</label><input type="text" id="acc-name" data-acc="name" value="${esc(u.name)}"></div></div>
        <div class="field"><label for="acc-role">What can they edit?</label><select id="acc-role" data-acc="role">${['editor', 'club', 'tournament'].map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLES[r].label}</option>`).join('')}</select></div>
        ${u.role === 'club' ? `<fieldset class="field"><legend class="lbl">Clubs they manage</legend><div class="checks">${site.clubs.map((c) => `<label><input type="checkbox" data-accitem="clubs" value="${esc(c.id)}" ${u.clubs.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}</div></fieldset>` : ''}
        ${u.role === 'tournament' ? `<fieldset class="field"><legend class="lbl">Tournaments they manage</legend><div class="checks">${site.tournaments.map((t) => `<label><input type="checkbox" data-accitem="tournaments" value="${esc(t.id)}" ${u.tournaments.includes(t.id) ? 'checked' : ''}> ${esc(t.name)} (${esc(fmtRange(t.start, t.end))})</label>`).join('')}</div></fieldset>` : ''}
        <div class="field"><label for="acc-pw">${u.isNew ? 'Password (10+ characters)' : 'New password (leave blank to keep the current one)'}</label><input type="text" id="acc-pw" data-acc="password" value="${esc(u.password || '')}" autocomplete="off"><span class="help">Give this to them privately. They can change it after logging in.</span></div>
        <div class="btnrow"><button class="btn green" data-act="acc-save">Save account</button><button class="btn alt" data-act="acc-cancel">Cancel</button></div></div></div>` : '';
      const nm = (ids, list) => ids.map((id) => (site[list].find((x) => x.id === id) || {}).name).filter(Boolean).join(', ');
      return `<h2>Editor accounts</h2><div class="form">
        <p>Give helpers their own login. A club manager can change only their club's listing; a tournament chair only their tournaments. Accounts save right away; you don't need to press Save.</p>
        ${mode === 'live' ? '' : '<div class="notice"><p>Demo copy: two example accounts are set up. Try logging in as <strong>ithaca</strong> / <strong>club112</strong> or <strong>rochester</strong> / <strong>chair112</strong> to see what they see.</p></div>'}
        ${form}
        <div class="tablewrap"><table><thead><tr><th scope="col">Username</th><th scope="col">Name</th><th scope="col">Can edit</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>
        ${accounts.map((a) => `<tr><td>${esc(a.username)}</td><td>${esc(a.name || '')}</td><td>${a.role === 'owner' ? 'Everything, including accounts' : a.role === 'editor' ? 'All content' : a.role === 'club' ? 'Club: ' + esc(nm(a.clubs || [], 'clubs') || 'none yet') : 'Tournaments: ' + esc(nm(a.tournaments || [], 'tournaments') || 'none yet')}</td>
          <td>${a.role === 'owner' ? '' : pendingConfirm === 'acc-del:' + a.username ? `<span class="confirm">Delete? <button class="btn small danger" data-act="acc-del-yes" data-u="${esc(a.username)}">Yes</button><button class="btn small alt" data-act="cancel">No</button></span>` : `<div class="btnrow"><button class="btn small alt" data-act="acc-edit" data-u="${esc(a.username)}">Edit</button><button class="btn small danger" data-act="acc-del" data-u="${esc(a.username)}">Delete</button></div>`}</td></tr>`).join('')}
        </tbody></table></div>
        ${u ? '' : '<div class="btnrow"><button class="btn green" data-act="acc-new">Add an account</button></div>'}</div>`;
    },
    suggestions() {
      if (sugg === null) { backend.suggestions().then((r) => { sugg = r; if (adminTab === 'suggestions') rerenderAdmin(); }).catch((e) => { sugg = { to: '', suggestions: [] }; toast(e.message); }); return '<h2>Website suggestions</h2><p>Loading…</p>'; }
      const list = sugg.suggestions || [];
      return `<h2>Website suggestions</h2><div class="form">
        <p>Visitors can suggest changes with the form at the bottom of the Contact page. Each suggestion is saved here${mode === 'live' && sugg.emailReady ? ' and emailed to the address below' : ''}.</p>
        ${mode !== 'live' ? '<div class="notice"><p>Demo copy: suggestions are saved in this browser only and not emailed. On the live site they are emailed once Resend is connected (README, step 9).</p></div>' : !sugg.emailReady ? '<div class="notice"><p>Email is not connected yet, so suggestions are only saved here. Connect Resend (README, step 9) to have them emailed.</p></div>' : ''}
        <div class="panel"><h3>Where suggestions are emailed</h3>
          <div class="field"><label for="sugg-to">Email address</label><input type="email" id="sugg-to" value="${esc(sugg.to)}" autocomplete="off"><span class="help">This address is never shown on the public site.</span></div>
          <div class="btnrow" style="margin-top:.6rem"><button class="btn" data-act="sugg-to">Save address</button></div></div>
        ${fieldHTML({ k: 'showSuggest', l: 'Show the suggestion form on the Contact page', t: 'check' }, 'settings')}
        <div class="row2">${fieldHTML({ k: 'suggestTitle', l: 'Form heading' }, 'content')}${fieldHTML({ k: 'suggestText', l: 'Form introduction' }, 'content')}</div>
        <p class="help">Press Save changes after changing the checkbox, heading or introduction.</p>
        <h3>Received (${list.length})</h3>
        ${list.length ? `<ul class="suggestions">${list.map((x) => `<li class="panel"><div class="muted">${esc(new Date(x.date).toLocaleString())}${x.page ? ' · ' + esc(x.page) : ''}</div>
          <p style="white-space:pre-wrap;margin:.4rem 0">${esc(x.message)}</p>
          <div>${esc(x.name || 'No name given')}${x.email ? ` · <a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ''}</div>
          <div class="btnrow" style="margin-top:.5rem">${pendingConfirm === 'sugg-del:' + x.key ? `<span class="confirm">Delete this suggestion? <button class="btn small danger" data-act="sugg-del-yes" data-key="${esc(x.key)}">Yes</button><button class="btn small alt" data-act="cancel">No</button></span>` : `<button class="btn small danger" data-act="sugg-del" data-key="${esc(x.key)}">Delete</button>`}</div></li>`).join('')}</ul>` : '<p class="empty">No suggestions yet.</p>'}
      </div>`;
    },
    password() { return `<h2>My password</h2><div class="form">${passwordPanel()}</div>`; },
    backup() {
      const live = mode === 'live';
      return `<h2>Backup, password & handoff</h2><div class="form">
        <div class="panel"><h3>Download a backup</h3><p>Everything on the site (text, tournaments, clubs, colors, logos, photos) is one backup file. Keep a copy after big changes and give it to the next webmaster.</p>
          <div class="btnrow"><button class="btn" data-act="export">Download backup file</button><button class="btn alt" data-act="showjson">Show backup as text</button></div>
          <div id="jsonbox"></div></div>
        <div class="panel"><h3>Restore from a backup</h3><p>Loads a backup into the editor. Nothing changes on the public site until you press Save.</p>
          <div class="field"><label for="importfile">Backup file (.json)</label><input type="file" id="importfile" accept=".json,application/json"></div>
          <div class="field"><label for="importtext">…or paste backup text</label><textarea id="importtext" rows="4"></textarea></div>
          <div class="btnrow"><button class="btn alt" data-act="import">Load this backup</button></div>
          ${live ? '<h3 style="margin-top:1.25rem">Automatic server backups</h3><p class="help">The server keeps a copy every time anyone saves, for 90 days.</p><div id="serverbackups"><button class="btn small alt" data-act="listbackups">Show saved versions</button></div>' : ''}</div>
        ${passwordPanel()}
        <div class="panel"><h3>Visitor numbers</h3><p>Turn on Cloudflare Web Analytics for the site (README, step 10) to see how many people visit and which pages they read. It is free and does not track individual visitors.</p></div>
        <div class="panel"><h3>Handing the site to someone else</h3><ol class="rich">
          <li>Download a backup file (above) and send it to the new webmaster.</li>
          <li>Change the password here and give them the new one.</li>
          <li>For full control, add them to the hosting account as an owner. The README in the site folder has the steps.</li></ol></div>
        <div class="panel"><h3>Start over</h3><p>Replace everything with the original starting content.</p>
          ${pendingConfirm === 'reset' ? '<div class="confirm" role="alert">Replace all content in the editor? <button class="btn small danger" data-act="reset-yes">Yes, start over</button><button class="btn small alt" data-act="cancel">Cancel</button></div>' : '<button class="btn danger" data-act="reset">Reset to starting content</button>'}</div>
      </div>`;
    },
  };

  async function loadAccounts() { try { accounts = await backend.listUsers(); } catch (e) { accounts = []; toast(e.message); } if (adminTab === 'accounts') rerenderAdmin(); }
  async function loadSubs() {
    try { subs = await backend.listSubs(); campaignList = await backend.campaigns(); } catch (e) { subs = []; toast(e.message); }
    if (adminTab === 'email') rerenderAdmin();
  }
  function reminderFor(t) {
    const L = tLinks(t), base = mode === 'live' ? location.origin : '';
    const lines = [`${t.name}`, `${fmtRange(t.start, t.end)}${t.city ? ' · ' + t.city : ''}`, ''];
    if (t.venue || t.address) lines.push('Where: ' + [t.venue, t.address, t.city].filter(Boolean).join(', '));
    if (t.notes) lines.push(t.notes);
    const s = (t.sessions || []).slice().sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));
    if (s.length) { lines.push('', 'Schedule:'); s.forEach((x) => { const d = parseDate(x.date); lines.push(`  ${d ? DAYS[d.getDay()] : ''} ${fmtTime(x.time)}  ${x.event}`); }); }
    if (t.partnership) lines.push('', 'Need a partner? ' + stripMd(t.partnership).replace(/\s+/g, ' ').trim());
    lines.push('');
    if (L.flyer) lines.push(L.flyerLabel + ': ' + L.flyer);
    if (hasDetails(t) && base) lines.push('Details: ' + base + '/#t-' + t.id);
    lines.push('', 'We hope to see you there!', site.settings.siteName);
    return { subject: `Reminder: ${t.name}, ${fmtRange(t.start, t.end)}`, text: lines.join('\n') };
  }

  function renderAdmin() {
    if (!token) {
      return `<div class="login panel"><h1>Webmaster login</h1>
        <form id="loginform" class="form"><div class="field"><label for="un">Username</label><input type="text" id="un" autocomplete="username" value="webmaster" autocapitalize="none"></div>
        <div class="field"><label for="pw">Password</label><input type="password" id="pw" autocomplete="current-password" required></div>
        <div id="loginerr" role="alert"></div><button class="btn" type="submit">Log in</button></form>
        ${mode === 'demo' ? `<div class="notice" style="margin-top:1rem"><p>Demo copy: log in as <strong>webmaster</strong> with password <strong>${DEMO_PASSWORD}</strong>. Example helper logins: <strong>ithaca</strong> / <strong>club112</strong> (club manager) and <strong>rochester</strong> / <strong>chair112</strong> (tournament chair). Changes are saved in this browser only.</p></div>` : ''}</div>`;
    }
    const tabs = myTabs();
    if (!tabs.find((t) => t[0] === adminTab)) adminTab = tabs[0][0];
    const body = ADMIN_TABS[adminTab]();
    openAfterAdd = null;
    const leave = pendingConfirm === 'logout' ? `<div class="confirm" role="alert" style="margin-bottom:1rem">You have unsaved changes. <button class="btn small green" data-act="save-logout">Save and log out</button><button class="btn small danger" data-act="discard-logout">Log out without saving</button><button class="btn small alt" data-act="cancel">Stay</button></div>` : '';
    return `${leave}<div class="admin"><div class="admin-tabs" role="tablist" aria-label="Admin sections">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === adminTab}" data-act="tab" data-tab="${k}">${l}</button>`).join('')}</div>
      <section class="panel" role="tabpanel" aria-label="${esc((tabs.find((t) => t[0] === adminTab) || [])[1])}">${body}
      ${['accounts', 'email', 'password'].includes(adminTab) ? '' : '<div class="btnrow" style="margin-top:1.5rem;border-top:1px solid var(--line);padding-top:1rem"><button class="btn green" data-act="save">Save changes</button><a class="btn alt" href="#home">View the site</a></div>'}</section></div>`;
  }
  function rerenderAdmin(keepOpen = true) {
    if (route() !== 'admin') return;
    const y = window.scrollY;
    const open = keepOpen ? [...document.querySelectorAll('details.item[open] [data-sum]')].map((e) => e.dataset.sum) : [];
    $('#view').innerHTML = renderAdmin();
    open.forEach((k) => { const s = document.querySelector(`[data-sum="${k}"]`); if (s) s.closest('details').open = true; });
    window.scrollTo(0, y);
  }

  // ---- admin clicks ----
  async function adminClick(b, act, e) {
    const list = b.dataset.list, i = +b.dataset.i;
    switch (act) {
      case 'tab': adminTab = b.dataset.tab; pendingDelete = null; pendingConfirm = null; editingUser = null; rerenderAdmin(false); $('.admin-tabs [aria-selected="true"]').focus(); if (window.innerWidth < 900) $('[role=tabpanel]').scrollIntoView(); return;
      case 'add': { const arr = getPath(list); const it = Object.assign({ id: uid('x') }, SCHEMAS[b.dataset.schema].blank()); arr.push(it); openAfterAdd = { list, i: arr.length - 1 }; markDirty(); rerenderAdmin(); const f = document.querySelectorAll('details.item[open] input, details.item[open] textarea'); if (f.length) f[0].focus(); return; }
      case 'up': case 'down': { const arr = getPath(list), j = act === 'up' ? i - 1 : i + 1; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; markDirty(); const sm = document.querySelector(`[data-sum="${list}.${i}"]`), wasOpen = sm && sm.closest('details').open; rerenderAdmin(false); if (wasOpen) { const n = document.querySelector(`[data-sum="${list}.${j}"]`); if (n) n.closest('details').open = true; } const mv = document.querySelector(`[data-act="${act}"][data-list="${list}"][data-i="${j}"]`); if (mv && !mv.disabled) mv.focus(); if (list === 'pages') renderChrome(); return; }
      case 'del': pendingDelete = list + '|' + i; rerenderAdmin(); return;
      case 'del-no': pendingDelete = null; rerenderAdmin(); return;
      case 'del-yes': getPath(list).splice(i, 1); pendingDelete = null; markDirty(); rerenderAdmin(false); if (list === 'pages') renderChrome(); toast('Deleted. Press Save to update the site.'); return;
      case 'subadd': { const arr = getPath(b.dataset.path); arr.push(JSON.parse(b.dataset.blank)); markDirty(); rerenderAdmin(); const rows = document.querySelectorAll(`[data-path^="${b.dataset.path}.${arr.length - 1}."]`); if (rows.length) rows[0].focus(); return; }
      case 'subdel': getPath(b.dataset.path).splice(i, 1); markDirty(); rerenderAdmin(); return;
      case 'sortlist': getPath(list).sort(byStart); markDirty(); rerenderAdmin(); return;
      case 'addpage': site.pages.push({ id: uid('page-'), title: 'New page', show: true, custom: true, body: '## Heading\nWrite your text here.' }); markDirty(); renderChrome(); rerenderAdmin(); toast('Page added. Rename it here and write its text on the Page text tab.'); return;
      case 'preset': site.settings.colors = Object.assign({}, PRESETS[b.dataset.name]); markDirty(); applyTheme(); rerenderAdmin(); return;
      case 'clearfield': setPath(b.dataset.path, ''); markDirty(); rerenderAdmin(); renderChrome(); return;
      case 'export': {
        const blob = new Blob([JSON.stringify(site, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'unit112-site-backup-' + todayISO() + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        toast('If no file downloaded, use "Show backup as text" and copy it.'); return;
      }
      case 'showjson': $('#jsonbox').innerHTML = `<div class="field" style="margin-top:1rem"><label for="jsontext">Backup text</label><textarea id="jsontext" rows="8" readonly>${esc(JSON.stringify(site, null, 2))}</textarea></div><button class="btn small alt" data-act="copyjson">Copy to clipboard</button>`; return;
      case 'copyjson': { const t = $('#jsontext'); try { await navigator.clipboard.writeText(t.value); toast('Copied.'); } catch (err) { t.focus(); t.select(); toast('Press Ctrl+C (or ⌘C) to copy the selected text.'); } return; }
      case 'import': {
        let text = $('#importtext').value.trim();
        const f = $('#importfile').files[0];
        if (f) text = await f.text();
        const j = safe(() => JSON.parse(text), null);
        if (!j || !j.settings || !Array.isArray(j.pages)) { toast('That is not a Unit 112 backup file.'); return; }
        site = j; markDirty(); applyTheme(); render(); toast('Backup loaded. Press Save to publish it.'); return;
      }
      case 'listbackups': {
        const bl = await backend.listBackups();
        $('#serverbackups').innerHTML = bl.length ? `<ul>${bl.map((k) => `<li>${esc(new Date(k.time).toLocaleString())} <button class="btn small alt" data-act="loadbackup" data-key="${esc(k.key)}">Load</button></li>`).join('')}</ul>` : '<p class="empty">No saved versions yet.</p>';
        return;
      }
      case 'loadbackup': try { site = await backend.getBackup(b.dataset.key); markDirty(); applyTheme(); render(); toast('Older version loaded. Press Save to publish it.'); } catch (err) { toast(err.message); } return;
      case 'changepw': {
        const cur = $('#pw-cur').value, nx = $('#pw-new').value;
        if (nx.length < 10) { toast('Use at least 10 characters for the new password.'); return; }
        try { await backend.changePassword(cur, nx); $('#pw-cur').value = ''; $('#pw-new').value = ''; toast('Password changed.'); } catch (err) { toast(err.message); }
        return;
      }
      // accounts
      case 'acc-new': editingUser = { isNew: true, username: '', name: '', role: 'club', clubs: [], tournaments: [], password: '' }; rerenderAdmin(); $('#acc-username').focus(); return;
      case 'acc-edit': { const a = accounts.find((x) => x.username === b.dataset.u); editingUser = Object.assign({ clubs: [], tournaments: [] }, clone(a), { password: '' }); rerenderAdmin(); $('#acc-name').focus(); return; }
      case 'acc-cancel': editingUser = null; rerenderAdmin(); return;
      case 'acc-save': {
        const u = editingUser;
        u.username = (u.username || '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,30}$/.test(u.username)) { toast('Username: 3–30 lowercase letters or numbers.'); return; }
        if (u.isNew && accounts.find((a) => a.username === u.username)) { toast('That username is taken.'); return; }
        if ((u.isNew || u.password) && (u.password || '').length < (mode === 'live' ? 10 : 4)) { toast('Use at least 10 characters for the password.'); return; }
        try { await backend.saveUser({ username: u.username, name: u.name || u.username, role: u.role, clubs: u.role === 'club' ? u.clubs : [], tournaments: u.role === 'tournament' ? u.tournaments : [], password: u.password || undefined }); editingUser = null; accounts = null; toast('Account saved.'); rerenderAdmin(); }
        catch (err) { toast(err.message); }
        return;
      }
      case 'acc-del': pendingConfirm = 'acc-del:' + b.dataset.u; rerenderAdmin(); return;
      case 'acc-del-yes': try { await backend.deleteUser(b.dataset.u); pendingConfirm = null; accounts = null; rerenderAdmin(); toast('Account deleted.'); } catch (err) { toast(err.message); } return;
      // email
      case 'unsub': try { await backend.removeSub(b.dataset.email); subs = null; rerenderAdmin(); toast('Removed.'); } catch (err) { toast(err.message); } return;
      case 'addsub': { const em = $('#addsub-email').value.trim(); if (!validEmail(em)) { toast('Enter a full email address.'); return; } try { await backend.addSub(em, $('#addsub-name').value.trim()); subs = null; rerenderAdmin(); toast('Subscriber added.'); } catch (err) { toast(err.message); } return; }
      case 'subscsv': { const csv = 'email,name,since\n' + subs.map((s) => [s.email, s.name || '', s.date || ''].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); $('#csvbox').innerHTML = `<div class="field" style="margin-top:1rem"><label for="csvtext">Subscribers (CSV)</label><textarea id="csvtext" rows="6" readonly>${esc(csv)}</textarea></div>`; $('#csvtext').select(); return; }
      case 'mailtest': case 'mailall': case 'mailall-yes': case 'mailcontinue': {
        const d = mailDraft || {};
        if (act !== 'mailcontinue' && (!d.subject || !d.text)) { toast('Write a subject and a message first.'); return; }
        if (act === 'mailtest' && !validEmail(d.test)) { toast('Enter the address to send the test to.'); return; }
        if (act === 'mailall') { pendingConfirm = 'sendall'; rerenderAdmin(); return; }
        pendingConfirm = null;
        try {
          const r = await backend.send(act === 'mailtest' ? { subject: '[TEST] ' + d.subject, text: d.text, test: d.test } : act === 'mailcontinue' ? { continueId: b.dataset.id } : { subject: d.subject, text: d.text });
          toast(act === 'mailtest' ? 'Test sent to ' + d.test + '.' : `Sent to ${r.sent}.${r.remaining ? ' ' + r.remaining + ' will need "Continue sending" tomorrow.' : ''}`);
          if (act !== 'mailtest') { subs = null; rerenderAdmin(); }
        } catch (err) { toast(err.message); rerenderAdmin(); }
        return;
      }
      case 'sugg-to': { const to = $('#sugg-to').value.trim(); if (!validEmail(to)) { toast('Enter a full email address, like name@example.com.'); return; } try { await backend.setSuggestTo(to); sugg.to = to; toast('Suggestions will now go to ' + to + '.'); } catch (err) { toast(err.message); } return; }
      case 'sugg-del': pendingConfirm = 'sugg-del:' + b.dataset.key; rerenderAdmin(); return;
      case 'sugg-del-yes': try { await backend.deleteSuggestion(b.dataset.key); pendingConfirm = null; sugg = null; rerenderAdmin(); toast('Deleted.'); } catch (err) { toast(err.message); } return;
      case 'reset': pendingConfirm = 'reset'; rerenderAdmin(); return;
      case 'reset-yes': site = clone(window.DEFAULT_SITE); pendingConfirm = null; markDirty(); applyTheme(); render(); toast('Starting content loaded. Press Save to publish it.'); return;
      case 'cancel': pendingConfirm = null; rerenderAdmin(); return;
      case 'save-logout': await doSave(); if (!dirty) { pendingConfirm = null; logout(); location.hash = '#home'; } return;
      case 'discard-logout': pendingConfirm = null; dirty = false; site = await backend.load(); applyTheme(); logout(); location.hash = '#home'; return;
    }
    void e;
  }

  // ---- admin typing ----
  function onEdit(e) {
    const el = e.target, ds = el.dataset || {};
    if (ds.acc && editingUser) { editingUser[ds.acc] = el.value; if (ds.acc === 'role' && e.type === 'change') rerenderAdmin(); return; }
    if (ds.accitem && editingUser) { const arr = editingUser[ds.accitem]; const k = arr.indexOf(el.value); if (el.checked && k < 0) arr.push(el.value); if (!el.checked && k >= 0) arr.splice(k, 1); return; }
    if (ds.mail) {
      mailDraft = mailDraft || { tid: '', subject: '', text: '', test: '' };
      mailDraft[ds.mail] = el.value;
      if (ds.mail === 'tid' && e.type === 'change') { const t = site.tournaments.find((x) => x.id === el.value); if (t) Object.assign(mailDraft, reminderFor(t)); rerenderAdmin(); }
      return;
    }
    const path = ds.path;
    if (!path) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (path === 'settings.baseSize') v = +v;
    setPath(path, v);
    markDirty();
    if (path.startsWith('settings.colors') || path === 'settings.font' || path === 'settings.headingFont' || path === 'settings.baseSize') {
      applyTheme();
      if (el.type === 'color') { const code = el.parentElement.querySelector('code'); if (code) code.textContent = v; }
      if (e.type === 'change' && path.startsWith('settings.colors')) rerenderAdmin();
    }
    if (/^settings\.(siteName|tagline|headerStyle|showSuits|footerText|contactEmail|alert\.)/.test(path) || /^pages\.\d+\.(title|show)$/.test(path)) renderChrome();
    const m = /^(.+?)\.(\d+)\./.exec(path);
    if (m) {
      const sum = document.querySelector(`[data-sum="${m[1]}.${m[2]}"]`);
      if (sum) { const S = SCHEMAS[sum.dataset.schema], it = getPath(m[1] + '.' + m[2]); sum.textContent = S.title(it); const sub = document.querySelector(`[data-subsum="${m[1]}.${m[2]}"]`); if (sub) sub.textContent = S.sub(it); }
      const d = document.getElementById(`derived-${m[1].replace(/\./g, '-')}-${m[2]}`);
      if (d) d.innerHTML = derivedHTML(m[1], +m[2]);
    }
  }
  document.addEventListener('input', onEdit);
  document.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.upload) {
      const f = el.files[0]; if (!f) return;
      toast('Uploading…');
      try { const url = await backend.upload(f, el.dataset.kind); setPath(el.dataset.upload, url); markDirty(); rerenderAdmin(); renderChrome(); toast('Uploaded. Press Save to update the site.'); }
      catch (err) { toast(err.message); }
      return;
    }
    if (el.dataset && el.dataset.multi) {
      const files = [...el.files]; if (!files.length) return;
      const arr = getPath(el.dataset.multi); let n = 0;
      for (const f of files) {
        toast(`Uploading photo ${n + 1} of ${files.length}…`);
        try { arr.push({ id: uid('ph'), url: await backend.upload(f, 'photo'), caption: '' }); n++; } catch (err) { toast(err.message); break; }
      }
      markDirty(); rerenderAdmin(); if (n) toast(`${n} photo${n === 1 ? '' : 's'} added. Add captions, then press Save.`);
      return;
    }
    if (el.type === 'color' || el.tagName === 'SELECT' || el.type === 'checkbox') onEdit(e);
  });
  document.addEventListener('submit', async (e) => {
    if (e.target.id !== 'loginform') return;
    e.preventDefault();
    let ok = false;
    try { ok = await backend.login($('#un').value, $('#pw').value); } catch (err) { $('#loginerr').innerHTML = `<p style="color:#9B1C1C;font-weight:700">${esc(err.message)}</p>`; return; }
    if (ok) { accounts = null; subs = null; sugg = null; adminTab = myTabs()[0][0]; render(); toast('Logged in as ' + (user.name || user.username) + '.'); }
    else { $('#loginerr').innerHTML = '<p style="color:#9B1C1C;font-weight:700">That username or password is not correct. Check Caps Lock and try again.</p>'; $('#pw').select(); }
  });
