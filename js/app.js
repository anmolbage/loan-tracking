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
const initials = n => (String(n || '?').replace(/[^A-Za-z\s]/g, ' ').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '?').toUpperCase();
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
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2a.4.4 0 0 0 0-.4L9.5 7.9c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.9 2.9 0 0 0 7 10a5.1 5.1 0 0 0 1 2.6 11.5 11.5 0 0 0 4.5 4 5.1 5.1 0 0 0 3.1.6 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
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
  if (!Store.configured()) { $('#loginMsg').textContent = 'Not connected to a Sheet yet. Open the link from the installer, or paste it below.'; showConnect(); return; }
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
  lines.push('Server: …' + String(Store.apiUrl()).slice(-16));
  await step('Read server (GET)', async () => {
    const r = await fetch(Store.apiUrl(), { method: 'GET', redirect: 'follow', cache: 'no-store' });
    const t = await r.text(); return r.status + ' ' + t.slice(0, 40);
  });
  await step('Send to server (POST ping)', async () => {
    const r = await fetch(Store.apiUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping' }), redirect: 'follow', cache: 'no-store' });
    const t = await r.text(); return r.status + ' ' + t.slice(0, 40);
  });
  lines.push('', 'Take a screenshot of this box and send it to support.');
  show();
}
$('#netCheckBtn').addEventListener('click', connectionCheck);

/* ---------------- connect to the RM's Sheet ---------------- */
// The installer link looks like .../loan-tracking/?api=<Apps Script /exec address>
function apiFromText(t) {
  t = String(t || '').trim();
  const m = t.match(/[?&]api=([^&\s]+)/);
  if (m) { try { t = decodeURIComponent(m[1]); } catch (e) {} }
  return t;
}
function showConnect() { $('#connectBox').classList.remove('hidden'); }
$('#connectBtn').addEventListener('click', () => {
  const u = apiFromText($('#connectInput').value);
  if (!Store.setApiUrl(u)) { $('#loginMsg').textContent = 'That is not the link from the installer. It should contain script.google.com/macros/…/exec'; return; }
  $('#connectBox').classList.add('hidden');
  $('#loginMsg').textContent = '';
  toast('Connected. Sign in with rm and your PIN.', 'ok');
});
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
const badgeCls = p => p.stage === 'Note dispatched' ? 'b-done' : p.stage === 'Rejected' ? 'b-lost'
  : ({ branch: 'b-branch', officer: 'b-officer', head: 'b-ro', note: 'b-sanctioned' })[holderOf(p)] || 'b-branch';
const HOLDER_LABEL = { branch: 'With branch', officer: 'With processing officer', head: 'With AMH Head', note: 'Disbursed · sanction note to be dispatched', closed: 'Closed' };
const HOLDER_COLOR = { branch: '#1d4ed8', officer: '#0e7490', head: '#6d28d9', note: '#b45309' };
// Which moves make sense from each stage (the follow-up form offers only these)
const MOVES = {
  'Customer met': ['Docs pending', 'App generated', 'Sent to RO', 'Rejected'],
  'Docs pending': ['App generated', 'Sent to RO', 'Rejected'],
  'App generated': ['Sent to RO', 'Rejected'],
  'Sent to RO': ['Processing', 'Rejected'],
  'Processing': ['Sent to AMH Head', 'Rejected'],
  'Sent to AMH Head': ['Disbursed', 'Rejected'],
  'Disbursed': ['Note dispatched'],
  'Note dispatched': [], 'Rejected': []
};
const MOVE_LABEL = { 'Docs pending': 'Documents pending', 'App generated': 'Application generated', 'Sent to RO': 'Sent to RO / AMH',
  'Processing': 'Taken up for processing', 'Sent to AMH Head': 'Sent to AMH Head for sanction', 'Disbursed': 'Disbursed',
  'Note dispatched': 'Sanction note dispatched', 'Rejected': 'Rejected / Withdrawn' };
const KEY_DATE = { 'App generated': 'appGenDate', 'Sent to RO': 'receivedAmhDate', 'Sent to AMH Head': 'putUpDate', 'Disbursed': 'disbDate', 'Note dispatched': 'noteDate' };
const TRACK = ['Customer met', 'Docs pending', 'App generated', 'Sent to RO', 'Processing', 'Sent to AMH Head', 'Disbursed', 'Note dispatched'];

const REASONS = ['Documents', 'CIBIL', 'Valuation', 'Legal / title', 'Customer not responding', 'Branch slow', 'Officer pending', 'AMH Head pending', 'Other'];
const staleLimit = () => Number(Store.settings.staleDays) || 7;
const lastTouch = p => String(p.lastHeard || p.stageSince || p.createdAt || '').slice(0, 10);
function silentDays(p) { const n = daysFrom(lastTouch(p)); return n === null ? 0 : Math.max(0, -n); }
const isStale = p => isLive(p) && silentDays(p) > staleLimit();
const dayDiff = (a, b) => { if (!a || !b) return null; const d = (new Date(String(b).slice(0, 10) + 'T00:00:00') - new Date(String(a).slice(0, 10) + 'T00:00:00')) / 86400000; return isNaN(d) ? null : Math.round(d); };
const lateLimit = h => Number((Store.settings.lateDays || {})[h]) || ({ branch: 10, officer: 5, head: 3, note: 7 })[h] || 10;
function holderDays(p) { const n = daysFrom(p.holderSince || p.stageSince); return n === null ? 0 : Math.max(0, -n); }
const isLate = p => isLive(p) && holderDays(p) > lateLimit(holderOf(p));
const isDue = p => isLive(p) && !!p.nextFollowup && daysFrom(p.nextFollowup) <= 0;
const inWeek = p => { if (!isLive(p) || !p.nextFollowup) return false; const n = daysFrom(p.nextFollowup); return n > 0 && n <= 7; };
const byAge = list => list.slice().sort((a, b) => (isLive(b) - isLive(a)) || holderDays(b) - holderDays(a));
const byNext = list => list.slice().sort((a, b) => String(a.nextFollowup || '9999').localeCompare(String(b.nextFollowup || '9999')));
function agePill(p) {
  if (!isLive(p)) return '';
  const lim = lateLimit(holderOf(p)), n = holderDays(p);
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
// Who holds the file now, with the mobile from the Branches / Desks tab
function holderContact(p) {
  const h = holderOf(p);
  if (h === 'branch') { const b = Store.branch(p.branchCode) || {}; return { short: 'BM', name: (b.bmName || 'BM') + ', ' + branchName(p), greet: b.bmName || 'Branch Manager, ' + branchName(p), mobile: b.bmMobile || '' }; }
  if (h === 'closed') return { short: '', name: '—', greet: '', mobile: '' };
  // 'note' = disbursed, sanction note still to be dispatched by the segment's processing officer at AMH
  const d = Store.desk(h === 'head' ? 'head' : p.segment) || { title: h === 'head' ? 'AMH Head' : (SEG[p.segment] || '') + ' Officer' };
  return { short: h === 'head' ? 'AMH Head' : 'officer', name: d.name ? d.title + ' · ' + d.name : d.title, greet: d.name || d.title, mobile: d.mobile || '' };
}
const digits10 = m => { const d = String(m || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; };
function waText(p) {
  const c = holderContact(p);
  return `Dear ${c.greet},\nWhat is the current status of the loan proposal of ${p.borrower} (${branchName(p)}) – ${p.product} ${lakh(p.amount)}? ` +
    `It has been at "${stageDef(p.stage).name}" since ${longDate(p.stageSince)}.\nKindly update me.\n– Regional Manager, ${CFG.OFFICE_NAME}`;
}

// Segment filter shared by Home and Chase
let segF = '';
const inSeg = p => !segF || p.segment === segF;
const segChips = () => [['', 'All segments'], ...Object.entries(SEG)].map(([k, l]) =>
  `<button class="chip${segF === k ? ' on' : ''}${k ? ' segc segc-' + k : ''}" data-segf="${k}">${esc(l)}</button>`).join('');
document.addEventListener('click', e => { const c = e.target.closest('[data-segf]'); if (c) { segF = c.dataset.segf; render(); } });

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const u = Store.user || {};
  const hour = new Date().getHours();
  $('#greetName').textContent = (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening') + ', ' + String(u.name || '').split(' ')[0];
  $('#greetSub').textContent = CFG.OFFICE_NAME + ' · ' + longDate() + (Store.queue.length ? ' · ' + Store.queue.length + ' unsynced' : '');
  $('#homeAvatar').textContent = initials(u.name);
  $('#homeBanner').innerHTML = syncBanner();

  const all = Store.items.filter(inSeg), live = all.filter(isLive);
  const pipe = live.filter(p => holderOf(p) !== 'note'), sanc = live.filter(p => holderOf(p) === 'note');
  const due = live.filter(isDue), late = byAge(live.filter(isLate));
  const tile = (h, t, s) => { const ls = pipe.filter(p => holderOf(p) === h);
    return `<button class="ph" style="--pc:${HOLDER_COLOR[h]}" data-chase="${h}"><b>${ls.length}</b><span>${t}</span><small>${lakh(sum(ls))} · ${s}</small></button>`; };

  $('#homeBody').innerHTML = `
    <div class="chips">${segChips()}</div>
    <div class="hero" style="margin-bottom:20px">
      <button style="display:block;width:100%;text-align:left;color:inherit;position:relative" data-chase="pipe">
        <div class="label">In pipeline</div>
        <div class="value">${lakh(sum(pipe))}</div>
        <div class="note">${pipe.length} proposal${pipe.length === 1 ? '' : 's'}${segF ? ' · ' + SEG[segF] : ''}</div></button>
      <div class="hero-row">
        <button class="hero-chip" data-chase="sanc" style="color:inherit;text-align:left"><b>${lakh(sum(sanc))}</b><span>${sanc.length} disbursed, note due</span></button>
        <button class="hero-chip" data-chase="due" style="color:inherit;text-align:left"><b>${due.length}</b><span>follow-ups due</span></button>
        <button class="hero-chip" data-chase="late" style="color:inherit;text-align:left"><b>${late.length}</b><span>late files</span></button>
      </div>
    </div>
    <div class="sec">
      <div class="sec-head"><h2>Where the files are</h2><span class="link" data-chase="late">Chase</span></div>
      <div class="split">${tile('branch', 'With branches', 'to chase')}${tile('officer', 'With processing officers', 'processing')}${tile('head', 'With AMH Head', 'for sanction')}</div>
    </div>
    <div class="sec" style="margin-top:-10px"><div class="desks">${DESK_KEYS.map(k => { const ls = live.filter(p => deskOf(p) === k), d = deskInfo(k);
      return `<button class="desk" data-pdesk="${k}"><span>${esc(k === 'head' ? 'AMH Head' : SEG[k] + ' officer')}</span><b>${ls.length}</b><small>${esc(d.name || '—')}</small></button>`; }).join('')}</div></div>
    ${whyStuck(live)}
    <div class="sec">
      <div class="sec-head"><h2>By stage</h2><span class="link" data-go="items">View all</span></div>
      <div class="stats">${STAGES.map(s => { const ls = all.filter(p => p.stage === s.id);
        return `<button class="stat" data-pstage="${esc(s.id)}"><b>${ls.length}</b><span class="amt">${lakh(sum(ls))}</span><span><i class="dot" style="background:${HOLDER_COLOR[s.holder] || '#94a3b8'}"></i>${esc(s.name)}</span></button>`; }).join('')}</div>
    </div>
    ${branchSummary(live)}
    ${late.length ? `<div class="sec"><div class="sec-head"><h2>Late files</h2><span class="link" data-chase="late">All ${late.length}</span></div>
      <div class="list" style="padding:0">${late.slice(0, 4).map(itemCard).join('')}</div></div>` : ''}
    <div class="sec"><div class="sec-head"><h2>Due &amp; overdue</h2><span class="link" data-chase="due">All ${due.length}</span></div>
      <div class="list" style="padding:0">${due.length ? byNext(due).slice(0, 5).map(itemCard).join('')
        : (Store.items.length ? emptyBlock('Nothing due today', 'Follow-ups set for later show up here on their day.') : emptyBlock('No proposals yet', 'Tap + after a call with a BM or the AMH to add the first one.'))}</div></div>`;
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-chase]');
  if (c) { chaseTab = c.dataset.chase; go('chase'); return; }
  const s = e.target.closest('[data-pstage]');
  if (s) { filters.stage = s.dataset.pstage; filters.branch = ''; go('items'); return; }
  const b = e.target.closest('[data-pbranch]');
  if (b) { filters.branch = b.dataset.pbranch; filters.stage = ''; filters.reason = ''; filters.desk = ''; go('items'); return; }
  const dk = e.target.closest('[data-pdesk]');
  if (dk) { filters.desk = dk.dataset.pdesk; filters.branch = ''; filters.stage = ''; filters.reason = ''; go('items'); return; }
  const r = e.target.closest('[data-preason]');
  if (r) { filters.reason = r.dataset.preason; filters.stage = ''; filters.branch = ''; filters.desk = ''; go('items'); return; }
  if (e.target.closest('[data-brall]')) { showAllBranches = !showAllBranches; renderHome(); }
});

// Why files are stuck: live files grouped by their latest reason tag
function whyStuck(live) {
  const tagged = live.filter(p => p.reason), stale = live.filter(isStale);
  if (!tagged.length && !stale.length) return '';
  const groups = REASONS.map(r => ({ r, ls: tagged.filter(p => p.reason === r) })).filter(g => g.ls.length).sort((a, b) => b.ls.length - a.ls.length);
  return `<div class="sec"><div class="sec-head"><h2>Why files are stuck</h2><span class="link" data-openrep="time">Reports</span></div>
    <div class="stats">${groups.map(g => `<button class="stat" data-preason="${esc(g.r)}"><b>${g.ls.length}</b><span class="amt">${lakh(sum(g.ls))}</span><span>${esc(g.r)}</span></button>`).join('')}
    ${stale.length ? `<button class="stat" data-chase="stale"><b style="color:var(--danger)">${stale.length}</b><span class="amt">${lakh(sum(stale))}</span><span>No update ${staleLimit()}+ days</span></button>` : ''}</div></div>`;
}

// Branch summary: live files and amount per branch, plus the branches with nothing in the pipeline
let showAllBranches = false;
function branchSummary(live) {
  const rows = Store.branches.map(b => {
    const ls = live.filter(p => Number(p.branchCode) === Number(b.code));
    return { b, n: ls.length, amt: sum(ls), late: ls.filter(isLate).length };
  });
  const active = rows.filter(r => r.n).sort((a, b) => b.amt - a.amt || b.n - a.n);
  const zero = rows.filter(r => !r.n).sort((a, b) => a.b.name.localeCompare(b.b.name));
  const shown = showAllBranches ? active : active.slice(0, 8);
  return `<div class="sec">
    <div class="sec-head"><h2>Branches with proposals · ${active.length}</h2>${active.length > 8 ? `<span class="link" data-brall="1">${showAllBranches ? 'Top 8' : 'All ' + active.length}</span>` : ''}</div>
    <div class="card brs">${shown.length ? shown.map(r => `<button class="brrow" data-pbranch="${r.b.code}">
        <span class="bn">${esc(r.b.name)} <i>${r.b.code}</i></span>
        ${r.late ? `<span class="age stuck">${r.late} late</span>` : '<span></span>'}
        <span class="bc">${r.n}</span><span class="ba">${lakh(r.amt)}</span></button>`).join('')
      : '<p class="sub" style="margin:0">No live proposals yet.</p>'}</div>
  </div>
  <div class="sec">
    <div class="sec-head"><h2>Branches with no leads · ${zero.length}</h2></div>
    <div class="zero">${zero.map(r => `<button data-pbranch="${r.b.code}">${esc(r.b.name)}</button>`).join('')}</div>
  </div>`;
}

/* ============================================================
   CHASE — who to follow up with, and what changed
   ============================================================ */
let chaseTab = 'due';
const CHASE_TABS = [
  ['due', 'Due & overdue', l => byNext(l.filter(isDue)), 'Follow-up date is today or has passed.'],
  ['late', 'Late', l => byAge(l.filter(isLate)), 'With one person longer than the day limit.'],
  ['branch', 'With branches', l => byAge(l.filter(p => holderOf(p) === 'branch')), 'Customer met, documents pending, application generated.'],
  ['officer', 'With processing officers', l => byAge(l.filter(p => holderOf(p) === 'officer')), 'Received at AMH or under processing.'],
  ['head', 'With AMH Head', l => byAge(l.filter(p => holderOf(p) === 'head')), 'Put up for sanction.'],
  ['sanc', 'Sanction note due', l => byAge(l.filter(p => holderOf(p) === 'note')), 'Disbursed; sanction note not yet dispatched.'],
  ['stale', 'No update', l => l.filter(isStale).sort((a, b) => silentDays(b) - silentDays(a)), 'Live files nobody has heard about for 7+ days.'],
  ['week', 'Next 7 days', l => byNext(l.filter(inWeek)), 'Follow-ups coming up this week.'],
  ['pipe', 'In pipeline', l => byAge(l.filter(p => isLive(p) && holderOf(p) !== 'note')), 'Every live file up to disbursal.'],
  ['activity', 'Recent activity', null, 'Every conversation you logged, newest first.']
];
let chaseQ = '';
function renderChase() {
  const q = chaseQ.toLowerCase();
  const base = Store.items.filter(inSeg).filter(p => !q || [p.borrower, branchName(p), p.branchCode, p.product].join(' ').toLowerCase().includes(q));
  const tab = CHASE_TABS.find(t => t[0] === chaseTab) || CHASE_TABS[0];
  $('#chaseSeg').innerHTML = segChips();
  $('#chaseChips').innerHTML = `<button class="chip" data-opencal="1">${ICON.cal} Calendar</button>` + CHASE_TABS.map(([k, l, fn]) =>
    `<button class="chip${tab[0] === k ? ' on' : ''}" data-ctab="${k}">${esc(l)}${fn ? ' · ' + fn(base).length : ''}</button>`).join('');
  if (tab[0] === 'activity') {
    const ids = new Set(base.map(p => p.id));
    const fus = Store.followups.filter(f => ids.has(f.proposalId))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 50);
    $('#chaseNote').textContent = fus.length + ' entries — ' + tab[3];
    $('#chaseList').innerHTML = fus.length ? `<div class="card"><div class="timeline">${fus.map(f => {
      const p = Store.items.find(x => x.id === f.proposalId) || {};
      return `<button class="tl" data-item="${esc(f.proposalId)}" style="display:block;width:100%;text-align:left">
        <div class="tm">${esc(prettyDate(f.date))} · ${esc(branchName(p))} · from ${esc(f.heardFrom || '—')}</div>
        <div class="tn"><b>${esc(p.borrower || '')}</b> — ${esc(f.note)}</div>
        <div class="tb">${f.stageTo && f.stageTo !== f.stageFrom ? (f.stageFrom ? 'Moved to ' : 'Added at ') + esc(stageDef(f.stageTo).name) : ''}${f.nextDate ? (f.stageTo && f.stageTo !== f.stageFrom ? ' · ' : '') + 'next ' + esc(prettyDate(f.nextDate)) : ''}</div>
      </button>`; }).join('')}</div></div>` : emptyBlock('No activity yet', 'Log a follow-up from any proposal.');
    return;
  }
  const list = tab[2](base);
  $('#chaseNote').textContent = list.length + ' file' + (list.length === 1 ? '' : 's') + ' · ' + lakh(sum(list)) + ' — ' + tab[3];
  $('#chaseList').innerHTML = list.length ? list.map(itemCard).join('') : emptyBlock('All clear', 'Nothing in this bucket.');
}
document.addEventListener('click', e => { const t = e.target.closest('[data-ctab]'); if (t) { chaseTab = t.dataset.ctab; renderChase(); } });

/* ---------------- calendar: follow-ups by date ---------------- */
let calY = null, calM = null, calSel = null;
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function openCalendar() {
  const today = todayStr();
  if (calY === null) { const t = new Date(today + 'T00:00:00'); calY = t.getFullYear(); calM = t.getMonth(); calSel = today; }
  const live = Store.items.filter(inSeg).filter(p => isLive(p) && p.nextFollowup);
  const map = {}; live.forEach(p => { const d = String(p.nextFollowup).slice(0, 10); (map[d] = map[d] || []).push(p); });
  const first = new Date(calY, calM, 1), lead = (first.getDay() + 6) % 7, days = new Date(calY, calM + 1, 0).getDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  let grid = '';
  for (let i = 0; i < cells; i++) {
    const d = new Date(calY, calM, 1 - lead + i), k = ymd(d), n = (map[k] || []).length;
    grid += `<button class="cal-day${d.getMonth() !== calM ? ' out' : ''}${k === today ? ' today' : ''}${k === calSel ? ' sel' : ''}${n && k < today ? ' over' : ''}" data-calday="${k}"><span>${d.getDate()}</span>${n ? `<span class="n">${n}</span>` : ''}</button>`;
  }
  const sel = byAge(map[calSel] || []);
  const overdue = calSel === today ? byNext(live.filter(p => String(p.nextFollowup).slice(0, 10) < today)) : [];
  const month = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  openSheet(`
    <h3>Follow-up calendar</h3>
    <p class="sub">Tap a day to see whose follow-up falls on it.${segF ? ' · ' + SEG[segF] : ''}</p>
    <div class="card cal">
      <div class="cal-head"><button class="iconbtn" data-calmove="-1" aria-label="Previous month">‹</button><b>${month}</b><button class="iconbtn" data-calmove="1" aria-label="Next month">›</button></div>
      <div class="cal-grid cal-dow"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div class="cal-grid">${grid}</div>
    </div>
    <div class="sec-head" style="margin:16px 0 10px"><h2>${esc(longDate(calSel))} · ${sel.length}</h2></div>
    <div class="list" style="padding:0">${sel.length ? sel.map(itemCard).join('') : '<p class="sub" style="margin:0">No follow-ups on this day.</p>'}</div>
    ${overdue.length ? `<div class="sec-head" style="margin:16px 0 10px"><h2 style="color:var(--danger)">Overdue from earlier · ${overdue.length}</h2></div>
      <div class="list" style="padding:0">${overdue.map(itemCard).join('')}</div>` : ''}
  `);
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-opencal]')) { calY = null; openCalendar(); return; }
  const m = e.target.closest('[data-calmove]');
  if (m) { calM += Number(m.dataset.calmove); if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } openCalendar(); return; }
  const d = e.target.closest('[data-calday]');
  if (d) { calSel = d.dataset.calday; openCalendar(); }
});
$('#chaseSearch').addEventListener('input', e => { chaseQ = e.target.value; renderChase(); });

/* ============================================================
   PROPOSALS — list, search, filter
   ============================================================ */
const filters = { q: '', stage: '', branch: '', reason: '', desk: '' };

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
      ${isLive(p) && (p.reason || isStale(p)) ? `<div class="r4">${p.reason ? `<span class="rsn">${esc(p.reason)}</span>` : ''}${isStale(p) ? `<span class="stale">No update ${silentDays(p)}d</span>` : ''}</div>` : ''}
    </div>
  </button>`;
}

function filteredItems() {
  const q = filters.q.toLowerCase();
  return Store.items
    .filter(p => !filters.stage || p.stage === filters.stage)
    .filter(p => !filters.branch || Number(p.branchCode) === Number(filters.branch))
    .filter(p => !filters.reason || (isLive(p) && p.reason === filters.reason))
    .filter(p => !filters.desk || (isLive(p) && deskOf(p) === filters.desk))
    .filter(p => !q || [p.borrower, branchName(p), p.branchCode, p.product, p.stage, p.remarks].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (isLive(b) - isLive(a)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function renderItems() {
  const counts = {};
  Store.items.forEach(p => { counts[p.stage] = (counts[p.stage] || 0) + 1; });
  const fb = filters.branch ? Store.branch(filters.branch) : null;
  $('#statusChips').innerHTML = (fb ? `<button class="chip on" data-clearbranch="1">${esc(fb.name)} ✕</button>` : '') +
    (filters.reason ? `<button class="chip on" data-clearreason="1">${esc(filters.reason)} ✕</button>` : '') +
    (filters.desk ? `<button class="chip on" data-cleardesk="1">${esc(deskInfo(filters.desk).title)} ✕</button>` : '') + [{ id: '', name: 'All' }, ...STAGES].map(s =>
    `<button class="chip${filters.stage === s.id ? ' on' : ''}" data-stage="${esc(s.id)}">${esc(s.id ? s.id : 'All')}${s.id ? ' · ' + (counts[s.id] || 0) : ''}</button>`).join('');
  const list = filteredItems();
  $('#itemCount').textContent = list.length + ' proposal' + (list.length === 1 ? '' : 's') + ' · ' + lakh(sum(list));
  $('#itemList').innerHTML = (fb ? branchCard(fb) : filters.desk ? deskCard(filters.desk) : '') + (list.length ? list.map(itemCard).join('')
    : (Store.syncing && !Store.items.length ? syncBanner() : emptyBlock('No proposals', 'Nothing matches this filter.')));
}

// Branch view: BM contact and one WhatsApp listing every pending file of the branch
// One contact card (BM, processing officer or AMH Head): Call · WhatsApp · Copy message
let cardText = '';
function contactCard({ role, name, sub, mobile, live, text, waLabel, callLabel }) {
  const mob = digits10(mobile);
  cardText = text;
  return `<div class="card bmcard">
    <div class="bm-top"><div><div class="card-title" style="margin:0">${esc(role)}</div>
      <b>${esc(name)}</b><div class="sub" style="margin:2px 0 0">${esc(sub)}${mobile ? ' · ' + esc(mobile) : ''}</div></div>
      <div class="bm-n"><b>${live.length}</b><span>${lakh(sum(live))} live</span></div></div>
    <div class="btn-row3">
      ${mob ? `<a class="btn ghost" href="tel:+91${mob}">${ICON.phone} ${esc(callLabel)}</a>` : `<button class="btn ghost" disabled>${ICON.phone} No mobile</button>`}
      <a class="btn ghost" style="color:#128c7e" target="_blank" rel="noopener" href="https://wa.me/${mob ? '91' + mob : ''}?text=${encodeURIComponent(text)}">${ICON.wa} ${esc(waLabel)}</a>
      <button class="btn ghost" data-copycard="1">${ICON.copy} Copy message</button>
    </div></div>`;
}
function branchCard(b) {
  const live = byAge(Store.items.filter(p => isLive(p) && Number(p.branchCode) === Number(b.code)));
  return contactCard({ role: 'Branch Manager', name: b.bmName || 'Not in the Branches tab', sub: b.name + ' (' + b.code + ')', mobile: b.bmMobile,
    live, text: live.length ? bmListText(b, live) : bmNudgeText(b), waLabel: live.length ? 'WhatsApp list' : 'Ask for leads', callLabel: 'Call BM' });
}
// Desk = a processing officer (by segment) or the AMH Head; files they hold right now
const DESK_KEYS = ['personal', 'sme', 'agri', 'head'];
const deskOf = p => { const h = holderOf(p); return h === 'head' ? 'head' : (h === 'officer' || h === 'note') ? p.segment : ''; };
const deskInfo = k => Store.desk(k) || { key: k, title: k === 'head' ? 'AMH Head' : (SEG[k] || '') + ' Officer', name: '', mobile: '' };
function deskCard(k) {
  const d = deskInfo(k), live = byAge(Store.items.filter(p => isLive(p) && deskOf(p) === k));
  return contactCard({ role: k === 'head' ? 'AMH Head' : 'Processing officer · ' + SEG[k], name: d.name || d.title, sub: k === 'head' ? 'Sanction' : SEG[k] + ' segment',
    mobile: d.mobile, live, text: deskListText(k, d, live), waLabel: 'WhatsApp list', callLabel: k === 'head' ? 'Call AMH Head' : 'Call officer' });
}
function deskListText(k, d, live) {
  const who = d.name || d.title;
  if (!live.length) return `Dear ${who},\nNo loan proposal is pending with you at present as per my list. Kindly let me know if any file is with you.\n– Regional Manager, ${CFG.OFFICE_NAME}`;
  return `Dear ${who},\nStatus of loan proposals pending with you${k === 'head' ? ' for sanction' : ' (' + SEG[k] + ' segment)'} as on ${longDate()}:\n` +
    live.map((p, i) => `${i + 1}. ${p.borrower} (${branchName(p)}) – ${p.product} ${lakh(p.amount)} – ${stageDef(p.stage).name} (${holderDays(p)} days)${p.reason ? ' – ' + p.reason : ''}`).join('\n') +
    `\n\nKindly share the expected date for each.\n– Regional Manager, ${CFG.OFFICE_NAME}`;
}
function bmListText(b, live) {
  return `Dear ${b.bmName || 'Branch Manager'} (${b.name} branch),\nStatus of your branch's loan proposals as on ${longDate()}:\n` +
    live.map((p, i) => `${i + 1}. ${p.borrower} – ${p.product} ${lakh(p.amount)} – ${stageDef(p.stage).name} (${holderDays(p)} days)${p.reason ? ' – ' + p.reason : ''}`).join('\n') +
    `\n\nKindly share the latest status and the expected date for each.\n– Regional Manager, ${CFG.OFFICE_NAME}`;
}
function bmNudgeText(b) {
  return `Dear ${b.bmName || 'Branch Manager'} (${b.name} branch),\nThere is no loan proposal from your branch in the pipeline at present. Kindly share the prospective Home, Vehicle, MSME and KCC proposals.\n– Regional Manager, ${CFG.OFFICE_NAME}`;
}
$('#searchInput').addEventListener('input', e => { filters.q = e.target.value; renderItems(); });
document.addEventListener('click', e => {
  if (e.target.closest('[data-clearbranch]')) { filters.branch = ''; renderItems(); return; }
  if (e.target.closest('[data-clearreason]')) { filters.reason = ''; renderItems(); return; }
  if (e.target.closest('[data-cleardesk]')) { filters.desk = ''; renderItems(); return; }
  if (e.target.closest('[data-copycard]')) { copyText(cardText); return; }
  const c = e.target.closest('[data-stage]');
  if (c) { filters.stage = c.dataset.stage; renderItems(); return; }
  const it = e.target.closest('[data-item]');
  if (it) openDetail(it.dataset.item);
});

function emptyBlock(t, p) { return `<div class="empty">${ICON.inbox}<b>${esc(t)}</b><p>${esc(p)}</p></div>`; }
function kv(k, v) { return `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`; }

/* ============================================================
   FILE PAGE
   ============================================================ */
function openDetail(id) {
  const p = Store.items.find(i => i.id === id);
  if (!p) return;
  const live = isLive(p), c = holderContact(p);
  const idx = TRACK.indexOf(p.stage);
  const strip = TRACK.map((s, i) => `<i class="${p.stage === 'Rejected' ? 'lost' : i < idx ? 'done' : i === idx ? 'cur' : ''}"></i>`).join('');
  const dbox = (k, l) => `<div class="${p[k] ? 'set' : ''}"><b>${p[k] ? esc(prettyDate(p[k])) : '—'}</b><span>${l}</span></div>`;
  const mob = digits10(c.mobile);
  const hist = Store.followupsFor(p.id);
  openSheet(`
    <h3>${esc(p.borrower)}</h3>
    <p class="sub">${esc(branchName(p))} (${esc(p.branchCode)}) · ${esc(SEG[p.segment] || '')} · ${esc(p.product)} · ${lakh(p.amount)}</p>
    <div style="display:flex;gap:8px;align-items:center"><span class="badge ${badgeCls(p)}">${esc(stageDef(p.stage).name)}</span>${agePill(p)}</div>
    <div class="stages">${strip}</div>
    <div class="stage-line"><span>${live ? esc(HOLDER_LABEL[holderOf(p)]) + ' · ' + holderDays(p) + ' day' + (holderDays(p) === 1 ? '' : 's') : 'Closed'}</span>
      <span>${live && p.nextFollowup ? 'Next: ' + esc(prettyDate(p.nextFollowup)) : ''}</span></div>
    <div class="dates d5">${dbox('appGenDate', 'App. gen.')}${dbox('receivedAmhDate', 'Sent to RO')}${dbox('putUpDate', 'To AMH Head')}${dbox('disbDate', 'Disbursed')}${dbox('noteDate', 'Note sent')}</div>
    ${live ? `<button class="btn" data-act="followup" data-id="${esc(p.id)}">${ICON.edit} Follow-up / move stage</button>
    <div class="btn-row" style="margin-top:10px">
      ${mob ? `<a class="btn ghost" href="tel:+91${mob}">${ICON.phone} Call ${esc(c.short)}</a>` : `<button class="btn ghost" disabled>${ICON.phone} No mobile</button>`}
      <a class="btn ghost" style="color:#128c7e" target="_blank" rel="noopener" href="https://wa.me/${mob ? '91' + mob : ''}?text=${encodeURIComponent(waText(p))}">${ICON.wa} Ask status</a>
    </div>` : ''}
    <div class="card" style="margin-top:14px">
      ${kv('File is with', live ? c.name + (c.mobile ? ' · ' + c.mobile : '') : 'Closed')}
      ${kv('Stage since', p.stageSince ? longDate(p.stageSince) : '—')}
      ${kv('Next follow-up', live ? (p.nextFollowup ? longDate(p.nextFollowup) : 'Not set') : '—')}
      ${kv('Last heard', (p.lastHeard ? longDate(p.lastHeard) : '—') + (p.heardFrom ? ' · from ' + p.heardFrom : '') + (live && isStale(p) ? ' · no update ' + silentDays(p) + 'd' : ''))}
      ${live && p.reason ? kv('Stuck because', p.reason) : ''}
      ${kv('Added', prettyTime(p.createdAt))}
    </div>
    ${hist.length ? `<div style="margin-top:18px"><div class="sec-head"><h2>Follow-up history</h2></div>
      <div class="timeline">${hist.map(f => `<div class="tl">
        <div class="tm">${esc(longDate(f.date))} · from ${esc(f.heardFrom || '—')}</div>
        <div class="tn">${esc(f.note || '—')}${f.reason ? ` <span class="rsn">${esc(f.reason)}</span>` : ''}</div>
        <div class="tb">${f.stageTo && f.stageTo !== f.stageFrom ? (f.stageFrom ? 'Moved to ' : 'Added at ') + esc(stageDef(f.stageTo).name) : ''}${f.nextDate ? (f.stageTo && f.stageTo !== f.stageFrom ? ' · ' : '') + 'next ' + esc(prettyDate(f.nextDate)) : ''}</div>
      </div>`).join('')}</div></div>` : ''}
    <div class="btn-row" style="margin-top:18px">
      <button class="btn ghost" data-act="edit" data-id="${esc(p.id)}">${ICON.edit} Edit</button>
      <button class="btn ghost" data-act="delete" data-id="${esc(p.id)}" style="color:var(--danger)">${ICON.trash} Delete</button>
    </div>
  `);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const id = a.dataset.id;
  if (a.dataset.act === 'edit') { closeSheet(); openForm(id); }
  if (a.dataset.act === 'followup') { openFollowup(id); }
  if (a.dataset.act === 'delete') {
    if (!confirm('Delete this proposal? It stays in the Sheet marked deleted.')) return;
    Store.deleteItem(id); closeSheet(); toast('Deleted', 'ok'); render();
  }
});

/* ============================================================
   FOLLOW-UP — what happened, move stage, next date
   ============================================================ */
const QUICK_NOTES = ['No change', 'Documents still pending', 'Query replied by branch', 'Officer will put up this week', 'Discussed in meeting'];
function openFollowup(id) {
  const p = Store.items.find(x => x.id === id); if (!p) return;
  const next = addDays(todayStr(), Number(Store.settings.nextDays) || 3);
  openSheet(`
    <h3>Follow-up</h3>
    <p class="sub">${esc(p.borrower)} · ${esc(branchName(p))} · ${esc(stageDef(p.stage).name)}</p>
    <div class="field"><label>What happened? *</label>
      <textarea id="fuNote" rows="3" placeholder="e.g. BM says sale deed copy will come on Monday"></textarea></div>
    <div class="quick">${QUICK_NOTES.map(t => `<button data-qnote="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="field" style="margin-bottom:6px"><label>Why is it stuck? (optional, one tap)</label></div>
    <div class="quick reasons">${REASONS.map(r => `<button data-reason="${esc(r)}" class="${p.reason === r ? 'on' : ''}">${esc(r)}</button>`).join('')}</div>
    <div class="row2">
      <div class="field"><label>Move stage to</label>${sel('fuStage', [{ v: '', t: 'No change' }, ...(MOVES[p.stage] || []).map(m => ({ v: m, t: MOVE_LABEL[m] }))], '')}</div>
      <div class="field"><label>Heard from</label>${sel('fuHeard', CFG.HEARD_FROM, p.heardFrom || 'BM')}</div>
    </div>
    <div class="row2">
      <div class="field"><label>Date it happened</label><input id="fuDate" type="date" value="${todayStr()}" max="${todayStr()}"></div>
      <div class="field"><label>Next follow-up</label><input id="fuNext" type="date" value="${next}" min="${todayStr()}"></div>
    </div>
    <div class="quick" style="margin-top:-4px">${[[1, 'Tomorrow'], [3, '3 days'], [7, '1 week'], [15, '15 days']].map(([n, t]) => `<button data-qnext="${addDays(todayStr(), n)}">${t}</button>`).join('')}</div>
    <button class="btn" id="fuSave" style="margin-top:6px">Save follow-up</button>
  `);
  $('#fuSave').onclick = () => {
    const note = $('#fuNote').value.trim();
    if (!note) { toast('Write a short note on what happened', 'err'); return; }
    const to = $('#fuStage').value, date = $('#fuDate').value || todayStr(), heard = $('#fuHeard').value;
    if (date > todayStr()) { toast('The date cannot be in the future', 'err'); return; }
    const x = JSON.parse(JSON.stringify(p));
    if (to) {
      const holderChanged = stageDef(p.stage).holder !== stageDef(to).holder;
      x.stage = to; x.stageSince = date;
      if (holderChanged) x.holderSince = date;
      if (KEY_DATE[to] && !x[KEY_DATE[to]]) x[KEY_DATE[to]] = date;
    }
    x.nextFollowup = isLive(x) ? $('#fuNext').value : '';
    x.lastHeard = date; x.heardFrom = heard; x.remarks = note;
    const rb = document.querySelector('.reasons button.on'), reason = rb ? rb.dataset.reason : '';
    // a stage move clears the old reason unless a new one is picked; a closed file has none
    x.reason = !isLive(x) ? '' : reason || (to ? '' : (p.reason || ''));
    Store.saveFollowup({ proposalId: p.id, date, note, stageFrom: p.stage, stageTo: to || p.stage, nextDate: x.nextFollowup, heardFrom: heard, reason }, x);
    toast(to ? 'Saved · moved to ' + stageDef(to).name : 'Follow-up saved', 'ok');
    render(); openDetail(p.id);
  };
}
document.addEventListener('click', e => {
  const rs = e.target.closest('[data-reason]');
  if (rs) { const on = rs.classList.contains('on'); document.querySelectorAll('.reasons button').forEach(x => x.classList.remove('on')); if (!on) rs.classList.add('on'); return; }
  const q = e.target.closest('[data-qnote]');
  if (q) { const t = $('#fuNote'); t.value = t.value ? t.value + '. ' + q.dataset.qnote : q.dataset.qnote; return; }
  const n = e.target.closest('[data-qnext]');
  if (n) $('#fuNext').value = n.dataset.qnext;
});

/* ============================================================
   FORM — new / edit proposal
   ============================================================ */
let formItem = null;
const products = seg => ((Store.settings.products || {})[seg] || []).slice();
const blankItem = () => ({
  id: '', branchCode: '', borrower: '', segment: 'personal', product: products('personal')[0] || '', amount: '',
  stage: 'Customer met', stageSince: todayStr(), nextFollowup: addDays(todayStr(), Number(Store.settings.nextDays) || 3),
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
    ${editing ? '<p class="hint" style="font-size:12px;color:var(--text-3)">To log a conversation, use Follow-up on the proposal page — it keeps the history.</p>' : ''}
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
  if (!prev) {
    const norm = t => String(t || '').toLowerCase().replace(/^dummy\s*-\s*/, '').replace(/[^a-z0-9]/g, '');
    const nb = norm(x.borrower);
    const dup = Store.items.find(o => isLive(o) && Number(o.branchCode) === Number(x.branchCode) && nb.length >= 3 &&
      (norm(o.borrower) === nb || (norm(o.borrower).length >= 4 && (norm(o.borrower).includes(nb) || nb.includes(norm(o.borrower))))));
    if (dup && !confirm('A similar proposal already exists at ' + branchName(dup) + ':\n\n' + dup.borrower + ' – ' + dup.product + ' ' + lakh(dup.amount) + ' – ' + stageDef(dup.stage).name + '\n\nSave this one anyway?')) return;
  }
  if (x.stageSince > todayStr()) { toast('Stage date cannot be in the future', 'err'); return; }
  if (!isLive(x)) x.nextFollowup = '';
  // holderSince: when the current holder got the file. Unchanged while the holder stays the same.
  const holderChanged = !prev || stageDef(prev.stage).holder !== stageDef(x.stage).holder;
  x.holderSince = holderChanged ? x.stageSince : (prev.holderSince || prev.stageSince);
  if (!prev || prev.stage !== x.stage) x.lastHeard = todayStr();
  if (KEY_DATE[x.stage] && !x[KEY_DATE[x.stage]]) x[KEY_DATE[x.stage]] = x.stageSince;
  if (x.stage === 'Processing' && !x.receivedAmhDate) x.receivedAmhDate = x.stageSince;
  const saved = Store.saveItem(x);
  if (!prev) Store.saveFollowup({ proposalId: saved.id, date: todayStr(), note: x.remarks || 'Proposal added', stageFrom: '', stageTo: x.stage, nextDate: x.nextFollowup, heardFrom: x.heardFrom }, null);
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
    { k: 'manual', i: ICON.book, t: 'User manual', s: 'How to use this app, step by step' },
    { k: 'sync', i: ICON.cloud, t: 'Sync now', s: Store.queue.length ? Store.queue.length + ' pending change(s)' : 'Everything is up to date' },
    { k: 'export', i: ICON.down, t: 'Export CSV', s: 'Download the proposals currently on screen' },
    { k: 'reminders', i: ICON.bell, t: 'Follow-up reminders', s: Store.reminders && Store.reminders.on ? 'On · Google Tasks list "' + Store.reminders.name + '"' : Store.reminders && Store.reminders.hold ? 'On hold for now · Chase shows what is due' : 'Off · ask support to switch them on' },
    { k: 'reports', i: ICON.chart, t: 'Reports', s: 'Processing time · monthly summary to share' },
    isAdmin ? { k: 'products', i: ICON.box, t: 'Products', s: Object.values(Store.settings.products || {}).reduce((n, l) => n + l.length, 0) + ' products in Personal, SME, Agri' } : null,
    isAdmin ? { k: 'staff', i: ICON.users, t: 'Logins & PINs', s: Store.users.length + ' login' + (Store.users.length === 1 ? '' : 's') } : null,
    { k: 'pin', i: ICON.key, t: 'Change my PIN', s: 'Keep your account secure' },
    { k: 'theme', i: ICON.moon, t: 'Dark mode', s: dark ? 'On' : 'Follows your phone', toggle: dark },
    { k: 'connect', i: ICON.sheet, t: 'Connected Sheet', s: Store.configured() ? 'Server …' + String(Store.apiUrl()).slice(-14, -5) : 'Not connected' },
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
  if (k === 'manual') openSheet(window.manualHtml(Store.settings));
  if (k === 'sync') { await doSync(); }
  if (k === 'export') exportCSV();
  if (k === 'connect') toast('To connect another Sheet: sign out, then open the new installer link');
  if (k === 'reminders') toast(Store.reminders && Store.reminders.on ? 'Each follow-up date is a task in Google Tasks' : 'Phone reminders are on hold. Open Chase → Due & overdue each morning.');
  if (k === 'staff') editStaff();
  if (k === 'products') editProducts();
  if (k === 'reports') openReports('time');
  if (k === 'pin') changePin();
  if (k === 'sheet') window.open(CFG.SHEET_URL, '_blank');
  if (k === 'theme') {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(LS.THEME, dark ? 'light' : 'dark'); } catch (err) {}
    renderMore();
  }
});

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Message copied', 'ok'); }
  catch (err) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Message copied', 'ok'); } catch (e2) { toast('Could not copy', 'err'); } ta.remove(); }
}

/* ---------------- reports: processing time + monthly summary ---------------- */
let repTab = 'time', repSeg = '', repMonth = null;
const STEPS = [
  { t: 'Branch: added → sent to RO', a: p => String(p.createdAt || '').slice(0, 10), b: 'receivedAmhDate', now: p => holderOf(p) === 'branch' },
  { t: 'Processing officer: sent to RO → sent to AMH Head', a: p => p.receivedAmhDate, b: 'putUpDate', now: p => holderOf(p) === 'officer' },
  { t: 'AMH Head: sent for sanction → disbursed', a: p => p.putUpDate, b: 'disbDate', now: p => holderOf(p) === 'head' },
  { t: 'Sanction note: disbursed → dispatched', a: p => p.disbDate, b: 'noteDate', now: p => holderOf(p) === 'note' }
];
function openReports(tab) {
  repTab = tab || repTab;
  if (!repMonth) { const t = new Date(todayStr() + 'T00:00:00'); repMonth = { y: t.getFullYear(), m: t.getMonth() }; }
  const tabs = `<div class="chips" style="padding:0 0 12px">${[['time', 'Processing time'], ['month', 'Monthly summary']].map(([k, l]) =>
    `<button class="chip${repTab === k ? ' on' : ''}" data-reptab="${k}">${l}</button>`).join('')}</div>`;
  openSheet(`<h3>Reports</h3><p class="sub">From the dates recorded on each proposal.</p>${tabs}${repTab === 'time' ? repTime() : repMonthly()}`);
}
function repTime() {
  const segs = `<div class="chips" style="padding:0 0 12px">${[['', 'All'], ...Object.entries(SEG)].map(([k, l]) => `<button class="chip${repSeg === k ? ' on' : ''}" data-repseg="${k}">${esc(l)}</button>`).join('')}</div>`;
  const items = Store.items.filter(p => !repSeg || p.segment === repSeg);
  const rows = STEPS.map(s => {
    const done = items.map(p => dayDiff(s.a(p), p[s.b])).filter(d => d !== null && d >= 0);
    const waiting = items.filter(p => isLive(p) && s.now(p));
    const oldest = waiting.reduce((m, p) => Math.max(m, holderDays(p)), 0);
    const avg = done.length ? (done.reduce((a, b) => a + b, 0) / done.length) : null;
    return `<tr><td>${esc(s.t)}</td><td class="n">${avg === null ? '–' : avg.toFixed(1)}<small>${done.length ? done.length + ' files' : ''}</small></td><td class="n">${waiting.length}</td><td class="n${oldest > 7 ? ' bad' : ''}">${waiting.length ? oldest + 'd' : '–'}</td></tr>`;
  }).join('');
  return segs + `<div class="card" style="padding:6px 12px;overflow-x:auto"><table class="rep"><thead><tr><th>Step</th><th>Avg days</th><th>Waiting now</th><th>Oldest</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="sub" style="margin-top:10px">Avg days counts files that have finished the step. "Waiting now" and "Oldest" show files in that step today. ${repSeg ? SEG[repSeg] + ' segment' : 'Pick a segment to see one processing officer.'}</p>`;
}
function monthData() {
  const { y, m } = repMonth, key = y + '-' + String(m + 1).padStart(2, '0');
  const inM = d => String(d || '').slice(0, 7) === key;
  const all = Store.items;
  const pick = f => all.filter(f);
  const g = { added: pick(p => inM(p.createdAt)), sent: pick(p => inM(p.putUpDate)), disb: pick(p => inM(p.disbDate)), note: pick(p => inM(p.noteDate)) };
  const byBr = {};
  Object.entries(g).forEach(([k, ls]) => ls.forEach(p => { const b = byBr[p.branchCode] = byBr[p.branchCode] || { name: branchName(p), added: [], sent: [], disb: [], note: [] }; b[k].push(p); }));
  const label = new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  return { g, byBr, label };
}
function repMonthly() {
  const { g, byBr, label } = monthData();
  const cell = ls => ls.length ? `${ls.length}<small>${lakh(sum(ls))}</small>` : '–';
  const rows = Object.values(byBr).sort((a, b) => sum(b.disb) - sum(a.disb) || b.added.length - a.added.length)
    .map(b => `<tr><td>${esc(b.name)}</td><td class="n">${cell(b.added)}</td><td class="n">${cell(b.sent)}</td><td class="n">${cell(b.disb)}</td><td class="n">${b.note.length || '–'}</td></tr>`).join('');
  const text = monthText();
  return `<div class="cal-head" style="padding:0 0 10px"><button class="iconbtn" data-repmonth="-1" aria-label="Previous month">‹</button><b>${esc(label)}</b><button class="iconbtn" data-repmonth="1" aria-label="Next month">›</button></div>
    <div class="stats" style="margin-bottom:12px">
      <div class="stat"><b>${g.added.length}</b><span class="amt">${lakh(sum(g.added))}</span><span>New proposals</span></div>
      <div class="stat"><b>${g.sent.length}</b><span class="amt">${lakh(sum(g.sent))}</span><span>Sent for sanction</span></div>
      <div class="stat"><b>${g.disb.length}</b><span class="amt">${lakh(sum(g.disb))}</span><span>Disbursed</span></div>
    </div>
    <div class="card" style="padding:6px 12px;overflow-x:auto"><table class="rep"><thead><tr><th>Branch</th><th>New</th><th>To AMH Head</th><th>Disbursed</th><th>Notes</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="sub">Nothing recorded this month.</td></tr>'}</tbody></table></div>
    <div class="btn-row" style="margin-top:12px">
      <a class="btn" style="background:#128c4a" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">${ICON.wa} Share on WhatsApp</a>
      <button class="btn ghost" id="repCopy">Copy text</button>
    </div>`;
}
function monthText() {
  const { g, byBr, label } = monthData();
  const live = Store.items.filter(isLive);
  const line = (t, ls) => `${t}: ${ls.length}${ls.length ? ' · ' + lakh(sum(ls)) : ''}`;
  const brs = Object.values(byBr).filter(b => b.disb.length).sort((a, b) => sum(b.disb) - sum(a.disb)).map(b => `- ${b.name}: ${b.disb.length} · ${lakh(sum(b.disb))}`);
  return `*Loan pipeline – ${CFG.OFFICE_NAME} – ${label}*\n${line('New proposals', g.added)}\n${line('Sent to AMH Head for sanction', g.sent)}\n${line('Disbursed', g.disb)}\nSanction notes dispatched: ${g.note.length}` +
    (brs.length ? `\n\n*Branch-wise disbursed*\n${brs.join('\n')}` : '') +
    `\n\nIn pipeline now: ${live.filter(p => holderOf(p) !== 'note').length} · ${lakh(sum(live.filter(p => holderOf(p) !== 'note')))} · late ${live.filter(isLate).length}`;
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-openrep]')) { openReports(e.target.closest('[data-openrep]').dataset.openrep); return; }
  const t = e.target.closest('[data-reptab]'); if (t) { openReports(t.dataset.reptab); return; }
  const s = e.target.closest('[data-repseg]'); if (s) { repSeg = s.dataset.repseg; openReports('time'); return; }
  const m = e.target.closest('[data-repmonth]');
  if (m) { repMonth.m += Number(m.dataset.repmonth); if (repMonth.m < 0) { repMonth.m = 11; repMonth.y--; } if (repMonth.m > 11) { repMonth.m = 0; repMonth.y++; } openReports('month'); return; }
  if (e.target.id === 'repCopy') {
    const text = monthText();
    try { await navigator.clipboard.writeText(text); toast('Copied', 'ok'); }
    catch (err) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copied', 'ok'); } catch (e2) { toast('Could not copy', 'err'); } ta.remove(); }
  }
});

/* ---------------- products (Admin) ---------------- */
// Edits the product list per segment. Saved to the Settings tab; existing proposals keep their product.
let prodDraft = null;
function editProducts() {
  prodDraft = JSON.parse(JSON.stringify(Store.settings.products || {}));
  Object.keys(SEG).forEach(k => { prodDraft[k] = prodDraft[k] || []; });
  drawProducts();
}
function drawProducts() {
  openSheet(`
    <h3>Products</h3>
    <p class="sub">The products offered in the New proposal form. Removing one does not change proposals already saved with it.</p>
    ${Object.entries(SEG).map(([k, l]) => `<div class="card" style="margin-bottom:12px">
      <div class="card-title">${esc(l)}</div>
      <div class="prods">${prodDraft[k].map((p, i) => `<span class="prod">${esc(p)}<button data-delprod="${k}|${i}" aria-label="Remove ${esc(p)}">✕</button></span>`).join('') || '<span class="sub">No products</span>'}</div>
      <div class="addp"><input id="np-${k}" placeholder="Add a ${esc(l)} product" autocomplete="off"><button class="btn sm" data-addprod="${k}">Add</button></div>
    </div>`).join('')}
    <button class="btn" id="saveProducts">Save products</button>
  `);
  $('#saveProducts').onclick = () => {
    if (Object.keys(SEG).some(k => !prodDraft[k].length)) { toast('Keep at least one product in each segment', 'err'); return; }
    Store.saveSettings(Object.assign({}, Store.settings, { products: prodDraft }));
    closeSheet(); toast('Products saved', 'ok'); render();
  };
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-addprod]');
  if (a) {
    const k = a.dataset.addprod, v = ($('#np-' + k).value || '').trim().replace(/\s+/g, ' ');
    if (!v) return;
    if (prodDraft[k].some(p => p.toLowerCase() === v.toLowerCase())) { toast('Already in the list', 'err'); return; }
    prodDraft[k].push(v); drawProducts(); return;
  }
  const d = e.target.closest('[data-delprod]');
  if (d) { const [k, i] = d.dataset.delprod.split('|'); prodDraft[k].splice(Number(i), 1); drawProducts(); }
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
  if (current === 'chase') renderChase();
  const due = Store.items.filter(isDue).length;
  $('#chaseBadge').textContent = due; $('#chaseBadge').classList.toggle('hidden', !due);
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

  // Opened from the installer link: remember the Sheet's address, then clean the address bar
  if (/[?&]api=/.test(location.search)) {
    const ok = Store.setApiUrl(apiFromText(location.search));
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (ok) setTimeout(() => toast('Connected to your Sheet. Sign in with rm and the PIN from the installer.', 'ok'), 300);
  }
  Store.load();
  renderPinpad();
  if (!Store.configured()) showConnect();

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
