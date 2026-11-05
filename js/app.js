/* ============================================================
   Loan Tracking — UI
   (from _template-pwa-sheets: login, nav, sync, More, PIN and logins
   are the proven Loan CRM code; Home / Proposals / form are this app's)
   ============================================================ */
(function () {
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------------------------------------------- helpers */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function inr(n) {
  n = Number(n) || 0;
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2) + ' Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}
const inrFull = n => '₹' + (Number(n) || 0).toLocaleString('en-IN');

const todayStr = () => todayISO();
function daysFrom(dateStr) {
  if (!dateStr) return null;
  const a = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  const b = new Date(todayStr() + 'T00:00:00');
  if (isNaN(a)) return null;
  return Math.round((a - b) / 86400000);
}
function prettyDate(d) {
  if (!d) return '—';
  const n = daysFrom(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  const dt = new Date(String(d).slice(0, 10) + 'T00:00:00');
  if (isNaN(dt)) return d;
  const sameYear = dt.getFullYear() === new Date().getFullYear();
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: sameYear ? undefined : '2-digit' });
}
function longDate(d) {
  const dt = d ? new Date(String(d).slice(0, 10) + 'T00:00:00') : new Date();
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function prettyTime(iso) {
  const dt = new Date(iso);
  if (isNaN(dt)) return '';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' +
         dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const sum = (arr, k = 'amount') => arr.reduce((s, x) => s + (Number(x[k]) || 0), 0);

const ICON = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 8-8 3 3-3 3-2-2-2 2"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 10h-1.3A7 7 0 1 0 5 16"/><path d="M12 12v9M8 17l4 4 4-4"/></svg>'
};

/* ---------------------------------------------- toast */
let toastT;
function toast(msg, kind) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast on' + (kind ? ' ' + kind : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.className = 'toast', 2600);
}

/* ---------------------------------------------- bottom sheet */
let sheetLocked = false;
function openSheet(html, locked) {
  sheetLocked = !!locked;
  $('#sheetBody').innerHTML = html;
  $('#sheet').scrollTop = 0;
  $('#sheetBg').classList.add('on');
  $('#sheet').classList.add('on');
}
function closeSheet() {
  sheetLocked = false;
  $('#sheetBg').classList.remove('on');
  $('#sheet').classList.remove('on');
}
$('#sheetBg').addEventListener('click', () => { if (!sheetLocked) closeSheet(); });

/* ============================================================
   LOGIN
   ============================================================ */
let pin = '';
function renderPinpad() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  $('#pinPad').innerHTML = keys.map(k =>
    k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('');
  $('#pinPad').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k;
    if (k === '⌫') pin = pin.slice(0, -1);
    else if (pin.length < 6) pin += k;
    drawDots();
    if (navigator.vibrate) navigator.vibrate(8);
  };
  drawDots();
}
function drawDots() {
  $('#pinDots').innerHTML = Array.from({ length: 6 },
    (_, i) => `<span class="pindot${i < pin.length ? ' on' : ''}"></span>`).join('');
}

async function doLogin() {
  const u = $('#loginUser').value.trim();
  const btn = $('#loginBtn');
  $('#loginMsg').textContent = '';
  if (!u) { $('#loginMsg').textContent = 'Enter your username.'; return; }
  if (pin.length < 4) { $('#loginMsg').textContent = 'Enter your 4-digit PIN.'; return; }
  if (!Store.configured()) { $('#loginMsg').textContent = 'API_URL is not set in js/config.js yet.'; return; }
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  try {
    const typed = pin;
    const r = await Store.login(u, pin);
    pin = ''; drawDots();
    await enterApp();
    if (r.mustChangePin) changePin(typed);
  } catch (err) {
    // Chrome says "Failed to fetch", Safari "Load failed", Firefox "NetworkError…"
    const network = err instanceof TypeError || /fetch|load failed|network/i.test(err.message);
    $('#loginMsg').textContent = network
      ? 'Cannot reach the server (' + err.message + '). Tap "Run connection check" below.'
      : err.message;
    $('#netCheckBtn').classList.toggle('hidden', !network);
    pin = ''; drawDots();
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in';
  }
}
$('#loginBtn').addEventListener('click', doLogin);

// Step-by-step test of the path to the Apps Script server, so a failing phone can
// show which hop breaks. Sends no PIN or token — only the public "ping".
async function connectionCheck() {
  const out = $('#netCheck');
  out.classList.remove('hidden');
  const lines = [];
  const show = () => { out.textContent = lines.join('\n'); };
  const step = async (label, fn) => {
    lines.push('… ' + label); show();
    const t0 = Date.now();
    try { const r = await fn(); lines[lines.length - 1] = '✔ ' + label + ' — ' + r + ' (' + (Date.now() - t0) + ' ms)'; }
    catch (e) { lines[lines.length - 1] = '✘ ' + label + ' — ' + (e.name || 'Error') + ': ' + e.message + ' (' + (Date.now() - t0) + ' ms)'; }
    show();
  };
  lines.push('App v' + CFG.VERSION + ' · online: ' + navigator.onLine + ' · ' + (matchMedia('(display-mode: standalone)').matches ? 'installed app' : 'browser tab'));
  lines.push(navigator.userAgent);
  lines.push('Server: …' + String(CFG.API_URL).slice(-16));
  await step('Read server (GET)', async () => {
    const r = await fetch(CFG.API_URL, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    const t = await r.text(); return r.status + ' ' + t.slice(0, 40);
  });
  await step('Send to server (POST ping)', async () => {
    const r = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping' }), redirect: 'follow', cache: 'no-store' });
    const t = await r.text(); return r.status + ' ' + t.slice(0, 40);
  });
  lines.push('', 'Take a screenshot of this box and send it to support.');
  show();
}
$('#netCheckBtn').addEventListener('click', connectionCheck);
$('#loginUser').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.addEventListener('keydown', e => {
  if ($('#login').classList.contains('hidden')) return;
  if (document.activeElement === $('#loginUser')) return;
  if (/^\d$/.test(e.key) && pin.length < 6) { pin += e.key; drawDots(); }
  if (e.key === 'Backspace') { pin = pin.slice(0, -1); drawDots(); }
  if (e.key === 'Enter') doLogin();
});

/* ============================================================
   NAVIGATION
   ============================================================ */
let current = 'home';
function go(screen) {
  current = screen;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + screen));
  $$('.nav button[data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === screen));
  window.scrollTo({ top: 0 });
  render();
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go);
});
$('#addBtn').addEventListener('click', () => openForm(null));
window.addEventListener('scroll', () => {
  $$('.topbar').forEach(t => t.classList.toggle('scrolled', window.scrollY > 6));
});

/* ============================================================
   PIPELINE HELPERS
   ============================================================ */
const STAGES = CFG.STAGES;
const stageDef = id => STAGES.find(s => s.id === id) || { id, name: id || '—', holder: 'branch' };
const holderOf = p => stageDef(p.stage).holder;
const isLive = p => holderOf(p) !== 'closed';
const SEG = CFG.SEGMENTS;
// amount is kept in ₹ lakh
const lakh = n => { n = Number(n) || 0; return n >= 100 ? '₹' + (n / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : '₹' + (Math.round(n * 100) / 100) + ' L'; };
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const badgeCls = p => p.stage === 'Disbursed' ? 'b-done' : p.stage === 'Rejected' ? 'b-lost' : p.stage === 'Sanctioned' ? 'b-sanctioned'
  : ({ branch: 'b-branch', officer: 'b-officer', head: 'b-ro' })[holderOf(p)] || 'b-branch';
const HOLDER_LABEL = { branch: 'With branch', officer: 'With processing officer', head: 'With AMH Head', closed: 'Closed' };
function holderDays(p) { const n = daysFrom(p.holderSince || p.stageSince); return n === null ? 0 : Math.max(0, -n); }
function agePill(p) {
  if (!isLive(p)) return '';
  const lim = (Store.settings.lateDays || {})[holderOf(p)] || 10, n = holderDays(p);
  const cls = n > lim ? ' stuck' : n > lim * 0.6 ? ' warn' : '';
  return `<span class="age${cls}">${n}d</span>`;
}
function dueTxt(p) {
  if (!isLive(p)) return '';
  if (!p.nextFollowup) return `<span class="due">${ICON.cal}No follow-up</span>`;
  const n = daysFrom(p.nextFollowup);
  return `<span class="due${n < 0 ? ' over' : n === 0 ? ' today' : ''}">${ICON.cal}${esc(prettyDate(p.nextFollowup))}${n < 0 ? ' · ' + (-n) + 'd over' : ''}</span>`;
}
const branchName = p => p.branchName || (Store.branch(p.branchCode) || {}).name || String(p.branchCode || '');

/* ============================================================
   HOME — slice 1: live total + latest (slice 3 adds Chase and counts)
   ============================================================ */
function renderHome() {
  const u = Store.user || {};
  const hour = new Date().getHours();
  $('#greetName').textContent = (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening') + ', ' + String(u.name || '').split(' ')[0];
  $('#greetSub').textContent = CFG.OFFICE_NAME + ' · ' + longDate() + (Store.queue.length ? ' · ' + Store.queue.length + ' unsynced' : '');
  $('#homeAvatar').textContent = initials(u.name);
  $('#homeBanner').innerHTML = syncBanner();

  const live = Store.items.filter(isLive);
  $('#kpiTotal').textContent = lakh(sum(live));
  $('#kpiNote').textContent = live.length + ' live proposal' + (live.length === 1 ? '' : 's') + ' · ' + Store.branches.length + ' branches';

  const latest = Store.items.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 5);
  $('#homeList').innerHTML = latest.length ? latest.map(itemCard).join('')
    : emptyBlock('No proposals yet', 'Tap + after a call with a BM or the AMH to add the first one.');
}

/* ============================================================
   PROPOSALS — list, search, filter
   ============================================================ */
const filters = { q: '', stage: '' };

function itemCard(p) {
  return `<button class="item" data-item="${esc(p.id)}" style="--acc:var(--seg-${esc(p.segment || 'personal')})">
    <div class="ini">${esc(String(branchName(p)).slice(0, 3))}</div>
    <div class="body">
      <div class="r1">
        <span class="nm">${esc(p.borrower || '(no name)')}</span>
        <span class="badge ${badgeCls(p)}">${esc(p.stage)}</span>
      </div>
      <div class="meta">${esc(branchName(p))} · ${esc(p.product || SEG[p.segment] || '')}</div>
      <div class="r3">
        <span class="amt">${lakh(p.amount)}</span>
        ${agePill(p)}
        ${dueTxt(p)}
      </div>
    </div>
  </button>`;
}

function filteredItems() {
  const q = filters.q.toLowerCase();
  return Store.items
    .filter(p => !filters.stage || p.stage === filters.stage)
    .filter(p => !q || [p.borrower, branchName(p), p.branchCode, p.product, p.stage, p.remarks].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (isLive(b) - isLive(a)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function renderItems() {
  const counts = {};
  Store.items.forEach(p => { counts[p.stage] = (counts[p.stage] || 0) + 1; });
  $('#statusChips').innerHTML = [{ id: '', name: 'All' }, ...STAGES].map(s =>
    `<button class="chip${filters.stage === s.id ? ' on' : ''}" data-stage="${esc(s.id)}">${esc(s.id ? s.id : 'All')}${s.id ? ' · ' + (counts[s.id] || 0) : ''}</button>`).join('');
  const list = filteredItems();
  $('#itemCount').textContent = list.length + ' proposal' + (list.length === 1 ? '' : 's') + ' · ' + lakh(sum(list));
  $('#itemList').innerHTML = list.length ? list.map(itemCard).join('')
    : (Store.syncing && !Store.items.length ? syncBanner() : emptyBlock('No proposals', 'Nothing matches this filter.'));
}
$('#searchInput').addEventListener('input', e => { filters.q = e.target.value; renderItems(); });
document.addEventListener('click', e => {
  const c = e.target.closest('[data-stage]');
  if (c) { filters.stage = c.dataset.stage; renderItems(); return; }
  const it = e.target.closest('[data-item]');
  if (it) openDetail(it.dataset.item);
});

function emptyBlock(t, p) { return `<div class="empty">${ICON.inbox}<b>${esc(t)}</b><p>${esc(p)}</p></div>`; }
function kv(k, v) { return `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`; }

/* ---------------- detail (slice 2 adds history and the follow-up form) ---------------- */
function openDetail(id) {
  const p = Store.items.find(i => i.id === id);
  if (!p) return;
  const b = Store.branch(p.branchCode) || {};
  openSheet(`
    <h3>${esc(p.borrower)}</h3>
    <p class="sub">${esc(branchName(p))} (${esc(p.branchCode)}) · ${esc(SEG[p.segment] || '')} · ${esc(p.product)}</p>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><span class="badge ${badgeCls(p)}">${esc(stageDef(p.stage).name)}</span>${agePill(p)}</div>
    <div class="card">
      ${kv('Amount', lakh(p.amount))}
      ${kv('File is with', isLive(p) ? HOLDER_LABEL[holderOf(p)] + ' · ' + holderDays(p) + ' days' : 'Closed')}
      ${kv('Stage since', p.stageSince ? longDate(p.stageSince) : '—')}
      ${kv('Next follow-up', isLive(p) ? (p.nextFollowup ? longDate(p.nextFollowup) : 'Not set') : '—')}
      ${kv('Last heard', (p.lastHeard ? longDate(p.lastHeard) : '—') + (p.heardFrom ? ' · from ' + p.heardFrom : ''))}
      ${kv('Branch Manager', b.bmName ? b.bmName + (b.bmMobile ? ' · ' + b.bmMobile : '') : 'Not in the Branches tab yet')}
      ${kv('Added', prettyTime(p.createdAt))}
    </div>
    ${p.remarks ? `<div class="card" style="margin-top:12px"><div class="card-title">Remarks</div><div style="font-size:14.5px;line-height:1.5">${esc(p.remarks)}</div></div>` : ''}
    <button class="btn" data-act="edit" data-id="${esc(p.id)}" style="margin-top:16px">${ICON.edit} Edit</button>
    <button class="btn ghost" data-act="delete" data-id="${esc(p.id)}" style="margin-top:10px;color:var(--danger)">${ICON.trash} Delete</button>
  `);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const id = a.dataset.id;
  if (a.dataset.act === 'edit') { closeSheet(); openForm(id); }
  if (a.dataset.act === 'delete') {
    if (!confirm('Delete this proposal? It stays in the Sheet marked deleted.')) return;
    Store.deleteItem(id); closeSheet(); toast('Deleted', 'ok'); render();
  }
});

/* ============================================================
   FORM — new / edit proposal
   ============================================================ */
let formItem = null;
const products = seg => ((Store.settings.products || {})[seg] || []).slice();
const blankItem = () => ({
  id: '', branchCode: '', borrower: '', segment: 'personal', product: products('personal')[0] || '', amount: '',
  stage: 'Lead', stageSince: todayStr(), nextFollowup: addDays(todayStr(), Number(Store.settings.nextDays) || 3),
  lastHeard: todayStr(), heardFrom: 'BM', remarks: ''
});

function openForm(id) {
  const src = id ? Store.items.find(x => x.id === id) : null;
  formItem = Object.assign(blankItem(), src ? JSON.parse(JSON.stringify(src)) : {});
  $('#formTitle').textContent = id ? 'Edit proposal' : 'New proposal';
  drawForm();
  $('#form').classList.add('on');
  $('#form').scrollTop = 0;
}
function closeForm() { $('#form').classList.remove('on'); }
$('#formClose').addEventListener('click', closeForm);

const sel = (id, opts, val, extra = '') => `<select id="${id}" ${extra}>${opts.map(o => { const v = typeof o === 'object' ? o.v : o, t = typeof o === 'object' ? o.t : o; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;

function drawForm() {
  const x = formItem, editing = !!x.id;
  const branches = Store.branches.slice().sort((a, b) => a.name.localeCompare(b.name));
  const prods = products(x.segment);
  if (x.product && !prods.includes(x.product)) prods.push(x.product);
  const stages = editing ? STAGES.map(s => ({ v: s.id, t: s.name })) : CFG.START_STAGES.map(id => ({ v: id, t: stageDef(id).name }));
  $('#formBody').innerHTML = `
    <div class="field"><label>Branch *</label>${sel('fBranch', [{ v: '', t: branches.length ? 'Choose branch' : 'Sync to load branches' }, ...branches.map(b => ({ v: b.code, t: b.name + ' (' + b.code + ')' }))], x.branchCode)}</div>
    <div class="field"><label>Borrower / firm *</label><input id="fBorrower" value="${esc(x.borrower)}" placeholder="e.g. Ramesh Mahto"></div>
    <div class="row2">
      <div class="field"><label>Segment</label>${sel('fSeg', Object.keys(SEG).map(k => ({ v: k, t: SEG[k] })), x.segment)}</div>
      <div class="field"><label>Product</label>${sel('fProd', prods, x.product)}</div>
    </div>
    <div class="row2">
      <div class="field"><label>Amount (₹ lakh) *</label><input id="fAmount" type="number" inputmode="decimal" step="0.01" value="${esc(x.amount === 0 ? '' : x.amount)}" placeholder="25"></div>
      <div class="field"><label>Stage</label>${sel('fStage', stages, x.stage)}</div>
    </div>
    <div class="row2">
      <div class="field"><label>At this stage since</label><input id="fSince" type="date" value="${esc(x.stageSince)}" max="${todayStr()}"></div>
      <div class="field"><label>Next follow-up</label><input id="fNext" type="date" value="${esc(x.nextFollowup)}"></div>
    </div>
    <div class="field"><label>Heard from</label>${sel('fHeard', CFG.HEARD_FROM, x.heardFrom)}</div>
    <div class="field"><label>Remarks</label><textarea id="fRemarks" rows="3" placeholder="What the BM or AMH said">${esc(x.remarks)}</textarea></div>
  `;
  $('#fSeg').onchange = e => { collectInto(); formItem.segment = e.target.value; formItem.product = products(e.target.value)[0] || ''; drawForm(); };
}
// keep typed values when the form is redrawn
function collectInto() {
  const v = id => ($('#' + id) || {}).value;
  Object.assign(formItem, { branchCode: v('fBranch'), borrower: v('fBorrower'), amount: v('fAmount'), stage: v('fStage') || formItem.stage,
    stageSince: v('fSince'), nextFollowup: v('fNext'), heardFrom: v('fHeard'), remarks: v('fRemarks') });
}

$('#formSave').addEventListener('click', () => {
  const prev = formItem.id ? Store.items.find(x => x.id === formItem.id) : null;
  const code = $('#fBranch').value;
  const b = Store.branch(code);
  const x = Object.assign({}, formItem, {
    branchCode: code ? Number(code) : '',
    branchName: b ? b.name : '',
    borrower: $('#fBorrower').value.trim(),
    segment: $('#fSeg').value,
    product: $('#fProd').value,
    amount: Number($('#fAmount').value) || 0,
    stage: $('#fStage').value,
    stageSince: $('#fSince').value || todayStr(),
    nextFollowup: $('#fNext').value,
    heardFrom: $('#fHeard').value,
    remarks: $('#fRemarks').value.trim()
  });
  if (!x.branchCode) { toast('Choose the branch', 'err'); return; }
  if (!x.borrower) { toast('Borrower name is required', 'err'); return; }
  if (!(x.amount > 0)) { toast('Enter the amount in ₹ lakh', 'err'); return; }
  if (x.stageSince > todayStr()) { toast('Stage date cannot be in the future', 'err'); return; }
  if (!isLive(x)) x.nextFollowup = '';
  // holderSince: when the current holder got the file. Unchanged while the holder stays the same.
  const holderChanged = !prev || stageDef(prev.stage).holder !== stageDef(x.stage).holder;
  x.holderSince = holderChanged ? x.stageSince : (prev.holderSince || prev.stageSince);
  if (!prev || prev.stage !== x.stage) x.lastHeard = todayStr();
  // key dates, set the first time a file reaches the stage
  const keyDate = { 'Received AMH': 'receivedAmhDate', 'With AMH Head': 'putUpDate', 'Sanctioned': 'sanctionDate', 'Disbursed': 'disbDate' }[x.stage];
  if (keyDate && !x[keyDate]) x[keyDate] = x.stageSince;
  Store.saveItem(x);
  closeForm();
  toast(navigator.onLine ? 'Saved' : 'Saved on this phone — will sync', 'ok');
  render();
});

/* ============================================================
   MORE
   ============================================================ */
function renderMore() {
  const u = Store.user || {};
  $('#moreAvatar').textContent = initials(u.name);
  $('#moreName').textContent = u.name || '—';
  $('#moreRole').textContent = (u.role || 'Staff') + ' · @' + (u.username || '');
  $('#verLabel').textContent = CFG.APP_NAME + ' v' + CFG.VERSION +
    (Store.lastSync ? ' · synced ' + prettyTime(Store.lastSync) : '');

  const isAdmin = u.role === 'Admin';
  const dark = document.documentElement.dataset.theme === 'dark';
  const items = [
    { k: 'sync', i: ICON.cloud, t: 'Sync now', s: Store.queue.length ? Store.queue.length + ' pending change(s)' : 'Everything is up to date' },
    { k: 'export', i: ICON.down, t: 'Export CSV', s: 'Download the proposals currently on screen' },
    isAdmin ? { k: 'staff', i: ICON.users, t: 'Logins & PINs', s: Store.users.length + ' login' + (Store.users.length === 1 ? '' : 's') } : null,
    { k: 'pin', i: ICON.key, t: 'Change my PIN', s: 'Keep your account secure' },
    { k: 'theme', i: ICON.moon, t: 'Dark mode', s: dark ? 'On' : 'Follows your phone', toggle: dark },
    isAdmin && CFG.SHEET_URL ? { k: 'sheet', i: ICON.sheet, t: 'Open Google Sheet', s: 'The database behind this app' } : null
  ].filter(Boolean);

  $('#moreMenu').innerHTML = items.map(it => `
    <button class="listrow" data-more="${it.k}" style="width:100%">
      <div class="ic">${it.i}</div>
      <div class="tx"><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div>
      ${it.toggle === undefined ? `<span class="arrow">${ICON.chev}</span>` : `<span class="switch${it.toggle ? ' on' : ''}"></span>`}
    </button>`).join('');
}

document.addEventListener('click', async e => {
  const m = e.target.closest('[data-more]'); if (!m) return;
  const k = m.dataset.more;
  if (k === 'sync') { await doSync(); }
  if (k === 'export') exportCSV();
  if (k === 'staff') editStaff();
  if (k === 'pin') changePin();
  if (k === 'sheet') window.open(CFG.SHEET_URL, '_blank');
  if (k === 'theme') {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(LS.THEME, dark ? 'light' : 'dark'); } catch (err) {}
    renderMore();
  }
});

/* ---------------- logins & PINs (Admin) ---------------- */
function editStaff() {
  const users = JSON.parse(JSON.stringify(Store.users));
  const baseline = users.map(u => u.username);
  openSheet(`
    <h3>Logins & PINs</h3>
    <p class="sub">Usernames that can open this app. Keep at least one Admin. A PIN you set here is temporary — the person must choose their own the first time they sign in.</p>
    <div id="staffList">${users.map(u => staffRow(u, false)).join('')}</div>
    <button class="btn ghost sm" id="addStaff" style="margin-top:6px">+ Add login</button>
    <button class="btn" id="saveStaff" style="margin-top:14px">Save logins</button>
  `);
  $('#addStaff').onclick = () => $('#staffList').insertAdjacentHTML('beforeend',
    staffRow({ username: '', name: '', role: 'Staff', active: true }, true));
  $('#staffList').addEventListener('click', ev => {
    const d = ev.target.closest('.del');
    if (d) {
      const un = d.closest('.card').querySelector('[data-u]').value.trim().toLowerCase();
      if (un && un === (Store.user || {}).username) { toast('You cannot remove your own login', 'err'); return; }
      d.closest('.card').remove();
    }
    const sw = ev.target.closest('.switch'); if (sw) sw.classList.toggle('on');
  });
  $('#saveStaff').onclick = () => {
    const out = [];
    for (const c of $$('#staffList .card')) {
      const u = {
        username: c.querySelector('[data-u]').value.trim().toLowerCase(),
        name: c.querySelector('[data-n]').value.trim(),
        pin: c.querySelector('[data-p]').value.trim(),
        role: c.querySelector('[data-r]').value,
        active: c.querySelector('.switch').classList.contains('on'),
        isNew: c.dataset.new === '1'
      };
      if (!u.username && !u.name) continue;
      if (!u.username || !u.name) { toast('Every login needs a name and a username', 'err'); return; }
      if (!/^[a-z0-9._-]+$/.test(u.username)) { toast('Username "' + u.username + '": letters and numbers only', 'err'); return; }
      if (u.isNew && !u.pin) { toast('Set a temporary PIN for ' + u.name, 'err'); return; }
      if (u.pin && !/^\d{4,6}$/.test(u.pin)) { toast('PIN for ' + u.name + ' must be 4-6 digits', 'err'); return; }
      if (out.some(x => x.username === u.username)) { toast('Username "' + u.username + '" is used twice', 'err'); return; }
      out.push(u);
    }
    if (!out.some(u => u.role === 'Admin' && u.active)) { toast('Keep at least one active Admin', 'err'); return; }
    Store.saveUsers(out, baseline);
    closeSheet(); toast('Logins saved', 'ok'); render();
  };
}
function staffRow(u, isNew) {
  return `<div class="card" style="margin-bottom:10px" data-new="${isNew ? 1 : 0}">
    <div class="row2">
      <div class="field" style="margin-bottom:8px"><label>Name</label><input data-n value="${esc(u.name)}"></div>
      <div class="field" style="margin-bottom:8px"><label>Username</label><input data-u value="${esc(u.username)}" autocapitalize="none" ${isNew ? '' : 'readonly'}></div>
    </div>
    <div class="row2">
      <div class="field" style="margin-bottom:8px"><label>${isNew ? 'Temporary PIN' : 'Reset PIN'}</label><input data-p inputmode="numeric" maxlength="6" placeholder="${isNew ? '4-6 digits' : 'Leave blank to keep'}"></div>
      <div class="field" style="margin-bottom:8px"><label>Role</label>
        <select data-r><option${u.role !== 'Admin' ? ' selected' : ''}>Staff</option><option${u.role === 'Admin' ? ' selected' : ''}>Admin</option></select></div>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:13px;color:var(--text-2);flex:1">Active${u.mustChangePin ? ' · <em>has a temporary PIN</em>' : ''}</span>
      <span class="switch${u.active !== false ? ' on' : ''}"></span>
      <button class="del" style="width:36px;height:36px;border-radius:11px;background:var(--surface-2);color:var(--danger);display:grid;place-items:center">${ICON.trash}</button>
    </div>
  </div>`;
}

/* ---------------- change PIN ---------------- */
// forcedOld: set when signing in with a temporary PIN — the sheet cannot be dismissed.
function changePin(forcedOld) {
  const forced = typeof forcedOld === 'string';
  openSheet(`
    <h3>${forced ? 'Choose your own PIN' : 'Change PIN'}</h3>
    <p class="sub">${forced ? 'You signed in with a temporary PIN. Pick a new 4 to 6 digit PIN to continue.' : 'Use 4 to 6 digits.'}</p>
    ${forced ? '' : '<div class="field"><label>Current PIN</label><input id="pOld" inputmode="numeric" type="password"></div>'}
    <div class="field"><label>New PIN</label><input id="pNew" inputmode="numeric" type="password" maxlength="6"></div>
    <div class="field"><label>Confirm new PIN</label><input id="pNew2" inputmode="numeric" type="password" maxlength="6"></div>
    <button class="btn" id="pSave">Update PIN</button>
  `, forced);
  $('#pSave').onclick = async () => {
    const o = forced ? forcedOld : $('#pOld').value.trim(), n = $('#pNew').value.trim(), n2 = $('#pNew2').value.trim();
    if (!/^\d{4,6}$/.test(n)) { toast('PIN must be 4-6 digits', 'err'); return; }
    if (n !== n2) { toast('New PINs do not match', 'err'); return; }
    if (n === o) { toast('Pick a PIN different from the old one', 'err'); return; }
    try {
      const r = await Store.api('changePin', { oldPin: o, newPin: n });
      if (r.ok) {
        if (r.token) Store.setSession(r.token, Store.user);
        closeSheet(); toast('PIN updated', 'ok');
      }
      else toast(r.message || 'Could not update PIN', 'err');
    } catch (err) {
      if (String(err.message) === 'SESSION_EXPIRED') { closeSheet(); showLogin(); toast('Session expired, sign in again', 'err'); }
      else toast('Needs internet connection', 'err');
    }
  };
}

/* ---------------- export ---------------- */
function exportCSV() {
  const rows = current === 'items' ? filteredItems() : Store.items;
  if (!rows.length) { toast('Nothing to export', 'err'); return; }
  const head = ['SR', 'Branch code', 'Branch', 'Borrower', 'Segment', 'Product', 'Amount (Rs lakh)', 'Stage', 'Stage since', 'With', 'Days with holder', 'Next follow-up', 'Last heard', 'Heard from', 'Remarks', 'Updated'];
  const body = rows.map((p, i) => [i + 1, p.branchCode, branchName(p), p.borrower, SEG[p.segment] || p.segment, p.product, p.amount, p.stage, p.stageSince,
    HOLDER_LABEL[holderOf(p)], isLive(p) ? holderDays(p) : '', p.nextFollowup, p.lastHeard, p.heardFrom, p.remarks, p.updatedAt]);
  const csv = [head, ...body].map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = CFG.STORAGE_PREFIX + '-' + todayStr() + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('CSV downloaded', 'ok');
}
$('#exportBtn').addEventListener('click', exportCSV);

/* ============================================================
   SYNC
   ============================================================ */
// Shown on Home (and in an empty list) so a slow or failed sync is never
// mistaken for "no data".
function syncBanner() {
  if (Store.syncing && !Store.items.length) return `<div class="banner sync">${ICON.cloud}Loading… this can take a few seconds.</div>`;
  if (!Store.lastError) return '';
  const when = Store.lastSync ? 'showing data saved ' + prettyTime(Store.lastSync) : 'nothing saved on this phone yet';
  return `<div class="banner offline">${ICON.cloud}Couldn't sync: ${esc(Store.lastError)} — ${when}. Tap ↻ to try again.</div>`;
}

async function doSync() {
  const btn = $('#syncBtn');
  btn.style.opacity = '.5';
  const r = await Store.sync({ full: true });
  btn.style.opacity = '';
  if (r.offline) toast('You are offline — will sync later');
  else if (r.ok) {
    if (r.failed && r.failed.length) toast(r.failed[0], 'err');
    else toast(r.pushed ? 'Synced ' + r.pushed + ' change(s)' : 'Up to date', 'ok');
  }
  else if (r.error === 'SESSION_EXPIRED') { showLogin(); toast('Session expired, sign in again', 'err'); }
  else if (!r.skipped) toast(r.error || 'Sync failed', 'err');
  render();
}
$('#syncBtn').addEventListener('click', doSync);
window.addEventListener('online', () => { toast('Back online — syncing'); doSync(); });
window.addEventListener('offline', () => { toast('Offline — changes saved on this phone'); render(); });

/* ============================================================
   BOOT
   ============================================================ */
function render() {
  if (current === 'home') renderHome();
  if (current === 'items') renderItems();
  if (current === 'more') renderMore();
}
Store.on(() => { if (!$('#app').classList.contains('hidden')) render(); });

function showLogin() {
  $('#login').classList.remove('hidden');
  $('#app').classList.add('hidden');
}

async function enterApp() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  go('home');
  const r = await Store.sync({ full: true });   // full load on open picks up hand edits in the Sheet
  if (r.error === 'SESSION_EXPIRED') { showLogin(); toast('Session expired, sign in again', 'err'); return; }
  render();
}

$('#logoutBtn').addEventListener('click', () => {
  if (Store.queue.length && !confirm('You have unsynced changes. Sign out anyway?')) return;
  Store.clearSession();
  showLogin();
});

(function boot() {
  try {
    const th = localStorage.getItem(LS.THEME);
    if (th) document.documentElement.dataset.theme = th;
  } catch (e) {}

  Store.load();
  renderPinpad();

  if (Store.token && Store.user) enterApp();
  else showLogin();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  // Push pending changes and pull everyone else's every minute while the app is open.
  const bgSync = async () => {
    if (!Store.token || !navigator.onLine || document.hidden) return;
    const r = await Store.sync({ silent: true });
    if (r.error === 'SESSION_EXPIRED') { showLogin(); toast('Session expired, sign in again', 'err'); }
  };
  setInterval(bgSync, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) bgSync(); });
})();

})();
