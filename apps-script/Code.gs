/**
 * Loan Tracking — Google Apps Script backend
 * (from _template-pwa-sheets; auth, sync and setup are the proven Loan CRM code)
 * Database: Google Sheets
 *
 * SETUP
 * 1. Open your Google Sheet -> Extensions -> Apps Script
 * 2. Delete everything, paste this file, Save.
 * 3. Run the function `setup` once and approve permissions.
 *    It creates the tabs, the 40 branches and an `rm` login with a random temporary
 *    PIN, written in the Users tab. You choose your own PIN at first sign-in.
 * 4. Deploy -> New deployment -> type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the /exec URL into js/config.js of the web app.
 *
 * PINs: a PIN typed into the Users tab by hand (plain digits) is treated as
 * temporary — it works once and the person must then pick their own, which
 * is stored only as a salted hash.
 *
 * ADAPTING THIS TEMPLATE
 * - Leave SHEET_ID blank: the script then uses the Sheet it is pasted into.
 * - Rename ITEM_COLS / the Items tab to your main record (e.g. Visits, Snapshots).
 *   Keep id, createdAt, updatedAt, createdBy, deleted — sync depends on them.
 * - Add a case in doPost for every new action, and a MIGRATIONS entry for every
 *   change to an existing live Sheet.
 */

// ============================================================ CONFIG
var SHEET_ID = '';              // blank = the Sheet this script is bound to
var TOKEN_TTL_DAYS = 30;
var MAX_PIN_TRIES = 5;          // wrong PINs in a row before a login is locked
var LOCK_MINUTES = 15;          // ...for this long

var TABS = {
  ITEMS: 'Proposals',
  FOLLOWUPS: 'FollowUps',
  BRANCHES: 'Branches',
  DESKS: 'Desks',
  USERS: 'Users',
  SETTINGS: 'Settings',
  LOG: 'ActivityLog'
};

// One column per field so the Sheet stays readable and filterable.
// amount is in ₹ lakh. stage holds the stage label from js/config.js (e.g. "Received AMH").
var ITEM_COLS = ['id', 'createdAt', 'updatedAt', 'branchCode', 'branchName', 'borrower', 'segment', 'product', 'amount',
  'stage', 'stageSince', 'holderSince', 'nextFollowup', 'lastHeard', 'heardFrom', 'remarks',
  'receivedAmhDate', 'putUpDate', 'sanctionDate', 'disbDate', 'createdBy', 'deleted'];
var NUM_COLS = ['amount'];
var DATE_COLS = ['stageSince', 'holderSince', 'nextFollowup', 'lastHeard', 'receivedAmhDate', 'putUpDate', 'sanctionDate', 'disbDate'];

// One row per conversation logged by the RM. Stage history and Recent activity come from here.
var FU_COLS = ['id', 'createdAt', 'updatedAt', 'proposalId', 'date', 'note', 'stageFrom', 'stageTo', 'nextDate', 'heardFrom', 'createdBy', 'deleted'];
var FU_DATE_COLS = ['date', 'nextDate'];
var CLOSED_STAGES = { 'Disbursed': true, 'Rejected': true };

// Branch Managers and AMH contacts are typed or pasted into these tabs in the Sheet
// (never kept in this file: the repo is public).
var BRANCH_COLS = ['code', 'name', 'bmName', 'bmMobile'];
var DESK_COLS = ['key', 'title', 'name', 'mobile'];

var USER_COLS = ['username', 'name', 'pin', 'role', 'mobile', 'active'];
var SETTING_COLS = ['key', 'value'];
var LOG_COLS = ['at', 'by', 'action', 'entity', 'entityId', 'detail'];

// ============================================================ DEFAULTS
// Admin-editable lists live in the Settings tab as JSON. Fixed lists belong in js/config.js.
function defaultSettings_() {
  return {
    products: {
      personal: ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan'],
      sme: ['MSME Term Loan', 'MSME Cash Credit', 'GST Plus', 'Mudra', 'SRTO'],
      agri: ['KCC', 'Agri Term Loan', 'Dairy / AH', 'Agri Infra']
    },
    lateDays: { branch: 10, officer: 5, head: 3 },
    nextDays: 3
  };
}

function defaultUsers_() {
  var pin = String(100000 + Math.floor(Math.random() * 900000));
  return [
    ['rm', 'Regional Manager', "'" + pin, 'Admin', '', 'TRUE']
  ];
}

// The 40 branches of RO Hazaribag (staff list as on 30.09.2026). BM name and mobile go in the Sheet.
var BRANCH_LIST = [[313,'Bahera'],[314,'Chatra'],[315,'Gidhour'],[316,'Hunterganj'],[317,'Itkhori'],[318,'Mayurhand'],
  [319,'Mishrol'],[320,'Pandepura'],[321,'Pitiz'],[322,'Pratappur'],[323,'Shila'],[403,'Barhi'],[404,'Barkagaon'],
  [405,'Barkattha'],[406,'Bishnugarh'],[407,'Bishrampur (H)'],[408,'Chalkusha'],[409,'Chouparan'],[410,'Choutha'],
  [411,'Gorbanda'],[412,'Hazaribag'],[413,'Ichak'],[414,'Katkamdag'],[415,'Korrah Chowk'],[416,'Surajpura'],
  [417,'Turkabad'],[418,'Urimari'],[428,'Bariadih'],[429,'Khutta'],[430,'Koderma'],[431,'Parsabad'],
  [439,'Chattarmandu'],[440,'Gola'],[441,'Mandu Bazar'],[442,'Patratu'],[443,'Ramgarh Cantt'],[552,'Daru'],
  [556,'Dadpur'],[557,'Korambey'],[559,'Rampur']];
var DESK_LIST = [['personal', 'Personal Officer'], ['sme', 'SME Officer'], ['agri', 'Agri Officer'], ['head', 'AMH Head']];

// ============================================================ SETUP
function setup() {
  var ss = ss_();
  ensureTab_(ss, TABS.ITEMS, ITEM_COLS);
  ensureTab_(ss, TABS.FOLLOWUPS, FU_COLS);
  var br = ensureTab_(ss, TABS.BRANCHES, BRANCH_COLS);
  if (br.getLastRow() < 2) {
    br.getRange(2, 1, BRANCH_LIST.length, 4).setValues(BRANCH_LIST.map(function (b) { return [b[0], b[1], '', '']; }));
    br.getRange(2, 4, BRANCH_LIST.length, 1).setNumberFormat('@');   // keep mobiles as text
  }
  var dk = ensureTab_(ss, TABS.DESKS, DESK_COLS);
  if (dk.getLastRow() < 2) {
    dk.getRange(2, 1, DESK_LIST.length, 4).setValues(DESK_LIST.map(function (d) { return [d[0], d[1], '', '']; }));
    dk.getRange(2, 4, DESK_LIST.length, 1).setNumberFormat('@');
  }
  ensureTab_(ss, TABS.LOG, LOG_COLS);

  var users = ensureTab_(ss, TABS.USERS, USER_COLS);
  var newPin = null;
  if (users.getLastRow() < 2) {
    var first = defaultUsers_();
    newPin = String(first[0][2]).replace("'", '');
    users.getRange(2, 1, first.length, USER_COLS.length).setValues(first);
    Logger.log('Login created. Username: rm   Temporary PIN: ' + String(first[0][2]).replace("'", ''));
  }

  var settings = ensureTab_(ss, TABS.SETTINGS, SETTING_COLS);
  if (settings.getLastRow() < 2) writeSettings_(defaultSettings_());

  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1 && s1.getLastRow() === 0) ss.deleteSheet(s1);

  if (!props_().getProperty('SECRET')) {
    props_().setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  props_().setProperty('SETUP_DONE', '1');
  props_().setProperty('MIGRATION', String(MIGRATIONS.length));
  Logger.log('Setup complete. Your starting PIN is in the Users tab. Now deploy as a Web app.');
  return { pin: newPin, message: 'Setup complete.' };
}

// Runs setup automatically the first time the web app is called, in case it was skipped.
function ensureSetup_() {
  if (props_().getProperty('SETUP_DONE') === '1') return;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { if (props_().getProperty('SETUP_DONE') !== '1') setup(); }
  finally { lock.releaseLock(); }
}

// One-time changes to an existing Sheet, run in order on the next request after an update.
// A fresh setup already has them, so setup() marks them all as done. Never reorder or remove.
var MIGRATIONS = [
  // 1: example — function () { var s = readSettings_(); s.statuses.push('On hold'); writeSettings_(s); }
];
function runMigrations_() {
  var done = Number(props_().getProperty('MIGRATION') || 0);
  if (done >= MIGRATIONS.length) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    done = Number(props_().getProperty('MIGRATION') || 0);
    for (var i = done; i < MIGRATIONS.length; i++) {
      MIGRATIONS[i]();
      props_().setProperty('MIGRATION', String(i + 1));
    }
  } finally { lock.releaseLock(); }
}

function ensureTab_(ss, name, cols) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var head = sh.getRange(1, 1, 1, cols.length).getValues()[0];
  if (head.join('|') !== cols.join('|')) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  }
  sh.getRange(1, 1, 1, cols.length)
    .setFontWeight('bold').setBackground('#0f2a4a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  return sh;
}

function props_() { return PropertiesService.getScriptProperties(); }
// Opening the spreadsheet is slow, so do it once per request (globals reset every run).
var SS_ = null;
function ss_() {
  return SS_ || (SS_ = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet());
}

// ============================================================ INSTALLER
// The RM makes a copy of the template Sheet, then clicks Loan Tracking → Install.
// Google shows its permission screen (Allow / Deny). On Allow this sets up the tabs and the
// rm login, switches on Google Tasks reminders, publishes the script as a web app through the
// Apps Script API, and shows a link that connects the phone app to this Sheet.
var APP_HOME = 'https://anmolbage.github.io/loan-tracking/';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Loan Tracking')
    .addItem('Install / update the app connection', 'install')
    .addItem('Show the app link again', 'showAppLink')
    .addToUi();
}

function install() {
  var res = setup();
  var tasks;
  try { setupTasks(); tasks = { ok: true, text: 'Follow-up reminders are on (Google Tasks list "' + TASK_LIST + '").' }; }
  catch (e) { tasks = { ok: false, text: 'Reminders could not be switched on: ' + String(e && e.message || e) }; }
  var url = null, deployErr = null;
  try { url = deployWebApp_(); } catch (e) { deployErr = String(e && e.message || e); }
  log_('installer', 'install', 'app', '', url ? 'published' : 'publish failed: ' + deployErr);
  showDialog_(res.pin, url, tasks, deployErr);
}

function showAppLink() {
  var url = props_().getProperty('WEBAPP_URL') || (ScriptApp.getService().getUrl ? ScriptApp.getService().getUrl() : '');
  showDialog_(null, url || null, null, url ? null : 'The app is not published yet. Use Loan Tracking → Install.');
}

// Publishes (or updates) the web app with the Apps Script API, so nobody has to use Deploy by hand.
// Needs "Google Apps Script API" switched on at https://script.google.com/home/usersettings
function deployWebApp_() {
  var base = 'https://script.googleapis.com/v1/projects/' + ScriptApp.getScriptId();
  var call = function (method, path, body) {
    var r = UrlFetchApp.fetch(base + path, {
      method: method, contentType: 'application/json', muteHttpExceptions: true,
      payload: body ? JSON.stringify(body) : '',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });
    var j = {}; try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) {}
    if (r.getResponseCode() >= 300) throw new Error((j.error && j.error.message) || ('HTTP ' + r.getResponseCode()));
    return j;
  };
  var v = call('post', '/versions', { description: 'Loan Tracking ' + todayStr_() });
  var cfg = { versionNumber: v.versionNumber, manifestFileName: 'appsscript', description: 'Loan Tracking API' };
  var id = props_().getProperty('DEPLOYMENT_ID'), d = null;
  if (id) { try { d = call('put', '/deployments/' + id, { deploymentConfig: cfg }); } catch (e) { d = null; } }
  if (!d) d = call('post', '/deployments', cfg);
  props_().setProperty('DEPLOYMENT_ID', d.deploymentId);
  var ep = (d.entryPoints || []).filter(function (e) { return e.entryPointType === 'WEB_APP'; })[0];
  var url = ep && ep.webApp && ep.webApp.url;
  if (!url) throw new Error('Published, but Google did not return the web address.');
  props_().setProperty('WEBAPP_URL', url);
  return url;
}

function showDialog_(pin, url, tasks, deployErr) {
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var link = url ? APP_HOME + '?api=' + encodeURIComponent(url) : '';
  var share = link ? 'https://wa.me/?text=' + encodeURIComponent('Loan Tracking app: ' + link) : '';
  var apiOff = deployErr && /Apps Script API|has not been used|disabled|PERMISSION_DENIED/i.test(deployErr);
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#0f172a">' +
    (url ? '<p style="color:#0b7a42;font-weight:bold;margin-top:0">✔ The app is connected to this Sheet.</p>' : '') +
    (tasks ? '<p style="margin:6px 0;color:' + (tasks.ok ? '#0b7a42' : '#a1670a') + '">' + (tasks.ok ? '✔ ' : '⚠ ') + esc(tasks.text) + '</p>' : '') +
    (pin ? '<div style="background:#f4f6fa;border-radius:10px;padding:10px 12px;margin:10px 0"><b>Sign in on the phone with</b><br>Username: <b>rm</b><br>Temporary PIN: <b style="font-size:18px;letter-spacing:2px">' + esc(pin) + '</b><br><span style="color:#5b6478;font-size:12px">The app then asks you to choose your own PIN. This PIN is also in the Users tab until then.</span></div>'
         : (url ? '<p style="color:#5b6478">Sign in with username <b>rm</b> and your PIN.</p>' : '')) +
    (url ? '<p style="margin:12px 0 6px"><b>Open the app with this link</b> (on the phone, then Add to Home screen):</p>' +
      '<textarea readonly style="width:100%;height:70px;font-size:12px" onclick="this.select()">' + esc(link) + '</textarea>' +
      '<p><a href="' + esc(link) + '" target="_blank" style="display:inline-block;background:#0f2a4a;color:#fff;padding:9px 14px;border-radius:9px;text-decoration:none;margin-right:6px">Open the app</a>' +
      '<a href="' + esc(share) + '" target="_blank" style="display:inline-block;background:#128c4a;color:#fff;padding:9px 14px;border-radius:9px;text-decoration:none">Send link to my phone (WhatsApp)</a></p>'
         : '') +
    (deployErr ? '<div style="background:#fdf1d6;border-radius:10px;padding:10px 12px;margin-top:10px"><b>One more step to publish the app</b><br>' +
      (apiOff ? '1. Open <a href="https://script.google.com/home/usersettings" target="_blank">script.google.com/home/usersettings</a> and switch <b>Google Apps Script API</b> to <b>On</b>.<br>2. Come back here and click <b>Loan Tracking → Install</b> again.'
              : esc(deployErr) + '<br>Then click <b>Loan Tracking → Install</b> again.') + '</div>' : '') +
    '</div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(url ? 470 : 300), 'Loan Tracking');
}

// ============================================================ ROUTING
function doGet(e) {
  // Switch reminders on by itself once the Tasks permission has been granted in the editor
  // (tries at most every 2 minutes until it works).
  if (props_().getProperty('CAL_ON') !== '1' && props_().getProperty('SETUP_DONE') === '1' && !CacheService.getScriptCache().get('cal_auto')) {
    CacheService.getScriptCache().put('cal_auto', '1', 120);
    try { setupTasks(); }
    catch (err) { props_().setProperty('CAL_LAST_RESULT', 'setup error: ' + String(err && err.message || err).slice(0, 200)); }
  }
  // Public health check. Counts only, no customer data.
  var p = props_().getProperties();
  return json_({ ok: true, service: 'Loan Tracking API', version: 1,
    reminders: { on: p.CAL_ON === '1', kind: 'Google Tasks', tasks: Object.keys(p).filter(function (k) { return k.indexOf('task:') === 0; }).length, lastSync: p.CAL_LAST || null, lastResult: p.CAL_LAST_RESULT || null } });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents || '{}');
    var action = req.action;
    ensureSetup_();
    runMigrations_();

    if (action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
    if (action === 'login') return json_(login_(req));

    var user = verifyToken_(req.token);
    if (!user) return json_({ ok: false, error: 'AUTH', message: 'Session expired. Please log in again.' });

    switch (action) {
      case 'bootstrap':    return json_(bootstrap_(user, req.since));
      case 'saveProposal':   lock.waitLock(20000); return json_(afterWrite_(saveItem_(user, req.item), req.item && req.item.id));
      case 'deleteProposal': lock.waitLock(20000); return json_(afterWrite_(deleteItem_(user, req.id), req.id));
      case 'saveFollowup':   lock.waitLock(20000); return json_(saveFollowup_(user, req.followup));
      case 'saveSettings': lock.waitLock(20000); return json_(saveSettings_(user, req.settings));
      case 'saveUsers':    lock.waitLock(20000); return json_(saveUsers_(user, req.users, req.baseline));
      case 'changePin':    lock.waitLock(20000); return json_(changePin_(user, req.oldPin, req.newPin));
      default: return json_({ ok: false, error: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return json_({ ok: false, error: 'SERVER', message: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================ AUTH
// Stored PIN formats in the Users tab:
//   h1$<salt>$<hash>  — the person's own PIN (salted, keyed hash)
//   plain digits      — temporary PIN set by setup or an Admin; must be changed at sign-in
function hashPin_(pin, salt) {
  var secret = props_().getProperty('SECRET') || 'change-me';
  var raw = Utilities.computeHmacSha256Signature(salt + ':' + String(pin), secret);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function makePinHash_(pin) {
  var salt = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  return 'h1$' + salt + '$' + hashPin_(pin, salt);
}
function isTempPin_(stored) { return String(stored || '').indexOf('h1$') !== 0; }
function pinMatches_(stored, pin) {
  stored = String(stored == null ? '' : stored).trim();
  pin = String(pin == null ? '' : pin).trim();
  if (!stored || !pin) return false;
  if (isTempPin_(stored)) return stored === pin;
  var parts = stored.split('$');
  return parts.length === 3 && hashPin_(pin, parts[1]) === parts[2];
}
// Changes whenever the stored PIN changes, so a PIN change signs out every other phone.
function pinVersion_(stored) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(stored || ''));
  return Utilities.base64EncodeWebSafe(raw).slice(0, 10);
}

function findUser_(username) {
  username = String(username || '').trim().toLowerCase();
  var rows = readTab_(TABS.USERS, USER_COLS);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].username).trim().toLowerCase() === username) return { row: i + 2, u: rows[i] };
  }
  return null;
}
function publicUser_(u) {
  return { username: String(u.username).trim().toLowerCase(), name: String(u.name || ''), role: u.role === 'Admin' ? 'Admin' : 'Staff' };
}

function login_(req) {
  var username = String(req.username || '').trim().toLowerCase();
  var pin = String(req.pin || '').trim();
  if (!username || !pin) return { ok: false, error: 'BAD_INPUT', message: 'Enter username and PIN.' };

  var cache = CacheService.getScriptCache();
  var key = 'fails_' + username;
  var fails = Number(cache.get(key) || 0);
  if (fails >= MAX_PIN_TRIES) {
    return { ok: false, error: 'LOCKED', message: 'Too many wrong PINs. Try again in ' + LOCK_MINUTES + ' minutes.' };
  }

  var found = findUser_(username);
  if (!found) return { ok: false, error: 'BAD_LOGIN', message: 'Wrong username or PIN.' };
  var u = found.u;
  if (String(u.active).toUpperCase() === 'FALSE') return { ok: false, error: 'DISABLED', message: 'This account is disabled.' };
  if (!pinMatches_(u.pin, pin)) {
    cache.put(key, String(fails + 1), LOCK_MINUTES * 60);
    log_(username, 'login-failed', 'user', username, '');
    var left = MAX_PIN_TRIES - fails - 1;
    return { ok: false, error: 'BAD_LOGIN', message: left > 0 ? 'Wrong username or PIN. ' + left + ' tries left.' : 'Too many wrong PINs. Try again in ' + LOCK_MINUTES + ' minutes.' };
  }
  cache.remove(key);
  var safe = publicUser_(u);
  log_(safe.name, 'login', 'user', safe.username, '');
  return { ok: true, token: makeToken_(safe.username, u.pin), user: safe, mustChangePin: isTempPin_(u.pin) };
}

function makeToken_(username, storedPin) {
  var exp = Date.now() + TOKEN_TTL_DAYS * 86400000;
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({ n: username, v: pinVersion_(storedPin), e: exp }));
  return payload + '.' + sign_(payload);
}
function sign_(text) {
  var secret = props_().getProperty('SECRET') || 'change-me';
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text, secret));
}
// Checks the signature and expiry, then re-reads the Users tab so that a disabled
// login, a role change or a PIN change takes effect on the very next request.
function verifyToken_(token) {
  if (!token) return null;
  var parts = String(token).split('.');
  if (parts.length !== 2) return null;
  if (sign_(parts[0]) !== parts[1]) return null;
  var data;
  try { data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (err) { return null; }
  if (!data || !data.n || !data.e || data.e < Date.now()) return null;
  var found = findUser_(data.n);
  if (!found || String(found.u.active).toUpperCase() === 'FALSE') return null;
  if (pinVersion_(found.u.pin) !== data.v) return null;
  return publicUser_(found.u);
}

function changePin_(user, oldPin, newPin) {
  newPin = String(newPin || '').trim();
  if (!/^\d{4,6}$/.test(newPin)) return { ok: false, message: 'PIN must be 4 to 6 digits.' };
  var found = findUser_(user.username);
  if (!found) return { ok: false, message: 'User not found.' };
  if (!pinMatches_(found.u.pin, oldPin)) return { ok: false, message: 'Current PIN is incorrect.' };
  if (String(oldPin).trim() === newPin) return { ok: false, message: 'Pick a PIN different from the old one.' };
  var stored = makePinHash_(newPin);
  ss_().getSheetByName(TABS.USERS).getRange(found.row, USER_COLS.indexOf('pin') + 1).setValue(stored);
  log_(user.name, 'change-pin', 'user', user.username, '');
  // a fresh token for this phone; every other session for this login is now invalid
  return { ok: true, message: 'PIN updated.', token: makeToken_(user.username, stored) };
}

// ============================================================ READ
// since (ISO time from the previous reply's serverTime): send only items changed after it,
// plus deleted ids, so the minute-by-minute sync stays small. Without it, everything is sent.
// Hand edits in the Sheet don't touch updatedAt, so the phone does a full load on app open.
function bootstrap_(user, since) {
  var cutoff = since ? new Date(since).getTime() - 2 * 60000 : NaN;   // 2 min overlap for clock skew
  var delta = !isNaN(cutoff);
  var changed = function (v) { var t = v instanceof Date ? v.getTime() : new Date(v).getTime(); return isNaN(t) || t >= cutoff; };

  var items = [], removed = [];
  readTab_(TABS.ITEMS, ITEM_COLS).forEach(function (r) {
    if (!r.id) return;
    if (delta && !changed(r.updatedAt)) return;
    if (String(r.deleted).toUpperCase() === 'TRUE') { if (delta) removed.push(String(r.id)); return; }
    items.push(normalizeItem_(r));
  });

  var users = readTab_(TABS.USERS, USER_COLS)
    .filter(function (u) { return u.username; })
    .map(function (u) {
      var o = { username: String(u.username).trim().toLowerCase(), name: u.name, role: u.role === 'Admin' ? 'Admin' : 'Staff', mobile: String(u.mobile || ''), active: String(u.active).toUpperCase() !== 'FALSE' };
      if (user.role === 'Admin') o.mustChangePin = isTempPin_(u.pin);
      return o;
    });

  // Follow-ups are short and few, so they are always sent in full.
  var followups = readTab_(TABS.FOLLOWUPS, FU_COLS).filter(function (f) { return f.id && String(f.deleted).toUpperCase() !== 'TRUE'; })
    .map(normalizeFu_);

  return { ok: true, delta: delta, user: user, items: items, removed: removed, users: users, settings: readSettings_(),
    branches: readBranches_(), desks: readDesks_(), followups: followups,
    reminders: { on: calOn_(), name: TASK_LIST }, serverTime: new Date().toISOString() };
}

// Small tabs, sent in full on every sync so a BM typed into the Sheet shows up at once.
function readBranches_() {
  return readTab_(TABS.BRANCHES, BRANCH_COLS).filter(function (b) { return b.code && b.name; }).map(function (b) {
    return { code: Number(b.code), name: String(b.name).trim(), bmName: String(b.bmName || '').trim(), bmMobile: String(b.bmMobile || '').trim() };
  });
}
function readDesks_() {
  return readTab_(TABS.DESKS, DESK_COLS).filter(function (d) { return d.key; }).map(function (d) {
    return { key: String(d.key).trim(), title: String(d.title || '').trim(), name: String(d.name || '').trim(), mobile: String(d.mobile || '').trim() };
  });
}

function normalizeItem_(r) {
  var out = {};
  ITEM_COLS.forEach(function (c) { out[c] = r[c] == null ? '' : r[c]; });
  NUM_COLS.forEach(function (c) { out[c] = Number(r[c]) || 0; });
  DATE_COLS.forEach(function (c) { out[c] = toDateStr_(r[c]); });
  out.createdAt = toIso_(r.createdAt);
  out.updatedAt = toIso_(r.updatedAt);
  delete out.deleted;
  return out;
}

function normalizeFu_(r) {
  var out = {};
  FU_COLS.forEach(function (c) { out[c] = r[c] == null ? '' : String(r[c]); });
  FU_DATE_COLS.forEach(function (c) { out[c] = toDateStr_(r[c]); });
  out.createdAt = toIso_(r.createdAt);
  out.updatedAt = toIso_(r.updatedAt);
  delete out.deleted;
  return out;
}

function readSettings_() {
  var rows = readTab_(TABS.SETTINGS, SETTING_COLS);
  var out = {};
  rows.forEach(function (r) {
    if (!r.key) return;
    try { out[r.key] = JSON.parse(r.value); } catch (e) { out[r.key] = r.value; }
  });
  var d = defaultSettings_();
  Object.keys(d).forEach(function (k) { if (out[k] == null) out[k] = d[k]; });
  return out;
}

function readTab_(name, cols) {
  var sh = ss_().getSheetByName(name);
  if (!sh) { setup(); sh = ss_().getSheetByName(name); }
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, cols.length).getValues();
  return values.map(function (row) {
    var o = {};
    cols.forEach(function (c, i) { o[c] = row[i]; });
    return o;
  });
}

function toDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}
function toIso_(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

// ============================================================ WRITE
// Upsert by id. The phone creates the id, so a save retried after a dropped
// connection updates the same row instead of adding a duplicate.
function saveItem_(user, item) {
  if (!item || !item.id) return { ok: false, message: 'Missing item.' };
  var sh = ss_().getSheetByName(TABS.ITEMS);
  var ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
  var row = -1;
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(item.id)) { row = i + 2; break; }

  var now = new Date().toISOString();
  var rec = {};
  ITEM_COLS.forEach(function (c) { rec[c] = item[c] == null ? '' : item[c]; });
  NUM_COLS.forEach(function (c) { rec[c] = Number(item[c]) || 0; });
  rec.updatedAt = now;
  rec.deleted = '';
  if (row < 0) { rec.createdAt = item.createdAt || now; rec.createdBy = user.name; }
  else {
    var prev = sh.getRange(row, 1, 1, ITEM_COLS.length).getValues()[0];
    rec.createdAt = prev[ITEM_COLS.indexOf('createdAt')] || now;
    rec.createdBy = prev[ITEM_COLS.indexOf('createdBy')] || user.name;
  }
  var values = [ITEM_COLS.map(function (c) { return rec[c]; })];
  if (row < 0) sh.appendRow(values[0]); else sh.getRange(row, 1, 1, ITEM_COLS.length).setValues(values);
  log_(user.name, row < 0 ? 'create' : 'update', 'proposal', rec.id, rec.borrower + ' · ' + rec.stage);
  return { ok: true, item: normalizeItem_(rec) };
}

// Soft delete: the row stays in the Sheet with deleted=TRUE, so nothing is lost by a mis-tap.
function deleteItem_(user, id) {
  var sh = ss_().getSheetByName(TABS.ITEMS);
  var last = sh.getLastRow();
  if (last < 2) return { ok: true };
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sh.getRange(i + 2, ITEM_COLS.indexOf('deleted') + 1).setValue('TRUE');
      sh.getRange(i + 2, ITEM_COLS.indexOf('updatedAt') + 1).setValue(new Date().toISOString());
      log_(user.name, 'delete', 'proposal', id, '');
      return { ok: true };
    }
  }
  return { ok: true };
}

// Upsert by id, like saveItem_. The phone sends the follow-up first and the updated proposal after it.
function saveFollowup_(user, fu) {
  if (!fu || !fu.id || !fu.proposalId) return { ok: false, message: 'Missing follow-up.' };
  var sh = ss_().getSheetByName(TABS.FOLLOWUPS);
  var ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
  var row = -1;
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(fu.id)) { row = i + 2; break; }
  var now = new Date().toISOString();
  var rec = {};
  FU_COLS.forEach(function (c) { rec[c] = fu[c] == null ? '' : fu[c]; });
  rec.updatedAt = now; rec.deleted = '';
  rec.createdAt = fu.createdAt || now;
  rec.createdBy = user.name;
  var values = FU_COLS.map(function (c) { return rec[c]; });
  if (row < 0) sh.appendRow(values); else sh.getRange(row, 1, 1, FU_COLS.length).setValues([values]);
  log_(user.name, 'follow-up', 'proposal', rec.proposalId, String(rec.note).slice(0, 120));
  return { ok: true, followup: normalizeFu_(rec) };
}

function saveSettings_(user, settings) {
  if (user.role !== 'Admin') return { ok: false, message: 'Only an Admin can change settings.' };
  writeSettings_(settings);
  log_(user.name, 'update', 'settings', '', '');
  return { ok: true, settings: readSettings_() };
}

function writeSettings_(settings) {
  var sh = ss_().getSheetByName(TABS.SETTINGS);
  sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 2).clearContent();
  var out = Object.keys(settings).map(function (k) { return [k, JSON.stringify(settings[k])]; });
  if (out.length) sh.getRange(2, 1, out.length, 2).setValues(out);
}

// Merges the Admin's edits into the Users tab instead of overwriting it:
//  - logins in `users` are added or updated (a blank PIN keeps the current one;
//    a PIN typed here is stored as a temporary PIN that must be changed at sign-in)
//  - only logins listed in `baseline` but missing from `users` are removed, so a
//    login added from another phone in the meantime is never lost.
function saveUsers_(user, users, baseline) {
  if (user.role !== 'Admin') return { ok: false, message: 'Only an Admin can manage logins.' };
  users = (users || []).filter(function (u) { return u && u.username; });
  var sh = ss_().getSheetByName(TABS.USERS);
  var current = readTab_(TABS.USERS, USER_COLS).filter(function (u) { return u.username; });
  var byName = {};
  current.forEach(function (u) { byName[String(u.username).trim().toLowerCase()] = u; });

  var submitted = {};
  users.forEach(function (u) {
    var un = String(u.username).trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(un)) return;
    var pin = String(u.pin || '').trim();
    if (pin && !/^\d{4,6}$/.test(pin)) return;
    var prev = byName[un];
    submitted[un] = {
      username: un,
      name: String(u.name || (prev && prev.name) || un),
      pin: pin ? "'" + pin : (prev ? (isTempPin_(prev.pin) ? "'" + String(prev.pin) : String(prev.pin)) : ''),
      role: u.role === 'Admin' ? 'Admin' : 'Staff',
      mobile: "'" + String(u.mobile != null ? u.mobile : (prev && prev.mobile) || ''),
      active: u.active === false ? 'FALSE' : 'TRUE'
    };
  });

  var removed = {};
  (baseline || []).forEach(function (b) {
    var un = String(b || '').trim().toLowerCase();
    if (un && !submitted[un] && un !== user.username) removed[un] = true;
  });

  var out = [];
  current.forEach(function (u) {
    var un = String(u.username).trim().toLowerCase();
    if (removed[un]) return;
    if (submitted[un]) { out.push(submitted[un]); delete submitted[un]; return; }
    out.push({ username: un, name: u.name, pin: isTempPin_(u.pin) ? "'" + String(u.pin) : String(u.pin), role: u.role, mobile: "'" + String(u.mobile || ''), active: String(u.active).toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE' });
  });
  Object.keys(submitted).forEach(function (un) {
    if (!submitted[un].pin) return; // a new login needs a PIN
    out.push(submitted[un]);
  });

  if (!out.some(function (u) { return u.role === 'Admin' && u.active === 'TRUE'; })) {
    return { ok: false, message: 'Keep at least one active Admin.' };
  }
  var rows = out.map(function (u) { return USER_COLS.map(function (c) { return u[c]; }); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, USER_COLS.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, USER_COLS.length).setValues(rows);
  log_(user.name, 'update', 'users', '', rows.length + ' logins');
  return { ok: true };
}

function todayStr_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

// ============================================================ GOOGLE TASKS REMINDERS
// (adapted from Loan CRM) Every live proposal with a next follow-up date gets one task in the
// "Loan Pipeline" list of the Google account that owns this script, due on that date. Google
// Tasks shows it in the Tasks app and in Google Calendar and notifies on the day. Moving the date
// moves the task; disbursed / rejected ticks it off; clearing the date or deleting removes it.
// Saves update it at once; a 15-minute trigger re-checks everything (so Sheet edits are picked up).
// Needs the Google Tasks permission, granted once by running setupTasks from the editor.
var TASK_LIST = 'Loan Pipeline';
var TASK_MAX_CHANGES = 60;        // per run — Google throttles bursts of writes
var APP_URL = 'https://anmolbage.github.io/loan-tracking/';
var HOLDER_OF = { 'Lead': 'branch', 'Docs pending': 'branch', 'Received AMH': 'officer', 'Processing': 'officer',
  'Query': 'branch', 'With AMH Head': 'head', 'Sanctioned': 'branch' };
var DESK_OF_SEGMENT = { personal: 'personal', sme: 'sme', agri: 'agri' };

function setupTasks() {
  taskList_();                                      // create it now, so permission is asked here
  props_().setProperty('CAL_ON', '1');
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncTasks') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncTasks').timeBased().everyMinutes(15).create();
  var r = syncTasks();
  Logger.log('Follow-up reminders are ON. Google Tasks list "' + TASK_LIST + '": ' + r.events + ' follow-ups, ' + r.changes + ' tasks written.' +
             (r.pending ? ' ' + r.pending + ' more will be added over the next runs.' : ''));
  return r;
}

function calOn_() { return props_().getProperty('CAL_ON') === '1'; }

function taskList_() {
  var id = props_().getProperty('TASK_LIST_ID');
  if (id) { try { Tasks.Tasklists.get(id); return id; } catch (e) { /* deleted by hand: find or recreate */ } }
  var lists = (Tasks.Tasklists.list({ maxResults: 100 }).items || []).filter(function (l) { return l.title === TASK_LIST; });
  id = lists.length ? lists[0].id : Tasks.Tasklists.insert({ title: TASK_LIST }).id;
  props_().setProperty('TASK_LIST_ID', id);
  return id;
}

// After a proposal is saved or deleted, bring its task up to date. Tasks trouble never fails the save.
function afterWrite_(result, id) {
  if (!result || result.ok === false || !id || !calOn_()) return result;
  try { syncTasks_(String(id)); }
  catch (err) { log_('system', 'tasks-error', 'proposal', id, String(err && err.message || err)); }
  return result;
}

// Trigger entry point (every 15 minutes) and manual re-sync.
function syncTasks() {
  if (!calOn_()) return { changes: 0, events: 0, pending: 0 };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var r = syncTasks_(null);
    props_().setProperties({ CAL_LAST: new Date().toISOString(), CAL_LAST_RESULT: r.events + ' follow-ups, ' + r.changes + ' written, ' + r.pending + ' pending' });
    return r;
  } catch (err) {
    props_().setProperties({ CAL_LAST: new Date().toISOString(), CAL_LAST_RESULT: 'error: ' + String(err && err.message || err).slice(0, 200) });
    throw err;
  } finally { lock.releaseLock(); }
}

// Tasks that carry "Proposal ID: x" in their notes, so a task made earlier is adopted, not duplicated.
function tasksById_(listId) {
  var out = {}, token;
  do {
    var page = Tasks.Tasks.list(listId, { maxResults: 100, showCompleted: true, showHidden: true, pageToken: token });
    (page.items || []).forEach(function (t) {
      var m = /Proposal ID: (\S+)/.exec(String(t.notes || ''));
      if (m && !out[m[1]]) out[m[1]] = t.id;
    });
    token = page.nextPageToken;
  } while (token);
  return out;
}

function syncTasks_(onlyId) {
  var listId = taskList_();
  var branches = {}, desks = {};
  readBranches_().forEach(function (b) { branches[b.code] = b; });
  readDesks_().forEach(function (d) { desks[d.key] = d; });
  var store = props_(), all = store.getProperties(), today = todayStr_();
  var seen = {}, changes = 0, events = 0, pending = 0, byId = null;
  var get = function (taskId) { try { return Tasks.Tasks.get(listId, taskId); } catch (e) { return null; } };
  var remove = function (taskId) { try { Tasks.Tasks.remove(listId, taskId); } catch (e) { /* already gone */ } };

  readTab_(TABS.ITEMS, ITEM_COLS).forEach(function (l) {
    var id = String(l.id || '');
    if (!id || (onlyId && id !== onlyId)) return;
    seen[id] = true;
    var key = 'task:' + id, cur = all[key] ? JSON.parse(all[key]) : null;
    var date = toDateStr_(l.nextFollowup);
    var deleted = String(l.deleted).toUpperCase() === 'TRUE';
    var isClosed = !!CLOSED_STAGES[String(l.stage)];

    if (!date || deleted) {
      if (cur) { remove(cur.t); store.deleteProperty(key); changes++; }
      return;
    }
    if (isClosed) {
      if (cur && cur.s !== 'closed') {
        if (changes >= TASK_MAX_CHANGES) { pending++; return; }
        try { Tasks.Tasks.patch({ status: 'completed' }, listId, cur.t); } catch (e) {}
        store.setProperty(key, JSON.stringify({ t: cur.t, s: 'closed' })); changes++;
      }
      return;
    }
    events++;
    if (!cur && date < today) return;                // never create tasks for days already gone

    var b = branches[Number(l.branchCode)] || {};
    var holder = HOLDER_OF[String(l.stage)] || 'branch';
    var who = holder === 'branch' ? { name: (b.bmName || 'BM') + ', ' + (b.name || l.branchName), mobile: b.bmMobile }
      : holder === 'head' ? (desks.head || {}) : (desks[DESK_OF_SEGMENT[l.segment]] || {});
    var whoName = who.name || who.title || '';
    var mobile = String(who.mobile || '').replace(/\D/g, '');
    var title = 'Follow up: ' + l.borrower + ' (' + (b.name || l.branchName) + ') · ' + l.stage;
    var notes = [
      l.product + ' · ₹' + l.amount + ' lakh · ' + l.stage,
      'File is with: ' + whoName + (mobile ? ' · ' + mobile : ''),
      l.remarks ? 'Latest: ' + String(l.remarks).slice(0, 400) : '',
      '',
      mobile ? 'Call: tel:' + mobile : '',
      'Open Loan Tracking: ' + APP_URL,
      'Proposal ID: ' + id
    ].filter(function (x, i) { return x !== '' || i === 3; }).join('\n');
    var sig = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [date, title, notes].join('|')));
    if (cur && cur.s === sig) return;
    if (changes >= TASK_MAX_CHANGES) { pending++; return; }

    var body = { title: title, notes: notes, due: date + 'T00:00:00.000Z', status: 'needsAction' };
    var taskId = cur && cur.t;
    if (!taskId) {
      if (!byId) byId = tasksById_(listId);
      taskId = byId[id] || null;
    }
    if (taskId && get(taskId)) Tasks.Tasks.patch(body, listId, taskId);
    else taskId = Tasks.Tasks.insert(body, listId).id;
    store.setProperty(key, JSON.stringify({ t: taskId, s: sig }));
    changes++;
  });

  if (!onlyId) {                                      // rows removed from the Sheet by hand
    Object.keys(all).forEach(function (k) {
      if (k.indexOf('task:') === 0 && !seen[k.slice(5)]) {
        try { remove(JSON.parse(all[k]).t); } catch (e) {}
        store.deleteProperty(k); changes++;
      }
    });
  }
  return { changes: changes, events: events, pending: pending };
}

function log_(by, action, entity, entityId, detail) {
  try {
    ss_().getSheetByName(TABS.LOG)
      .appendRow([new Date().toISOString(), by, action, entity, entityId, String(detail || '').slice(0, 200)]);
  } catch (e) { /* logging must never break a request */ }
}
