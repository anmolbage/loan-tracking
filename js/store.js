/* ============================================================
   Loan Tracking — data layer
   State, Google Sheets API calls, and the offline write queue.
   ============================================================ */

const CFG = window.APP_CONFIG;
const P = CFG.STORAGE_PREFIX || 'app';
const LS = {
  TOKEN: P + '_token',
  USER:  P + '_user',
  CACHE: P + '_cache',
  QUEUE: P + '_queue',
  THEME: P + '_theme',
  API:   P + '_api'     // the RM's own Apps Script address, set by the installer link
};

const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const Store = {
  token: null,
  user: null,
  items: [],        // loan proposals
  branches: [],     // the 40 branches with BM name and mobile (from the Sheet)
  desks: [],        // Personal / SME / Agri officer and AMH Head contacts
  followups: [],    // every conversation logged: note, stage move, next date
  reminders: null,  // { on, name } — Google Tasks status from the server
  users: [],
  settings: { products: {}, lateDays: { branch: 10, officer: 5, head: 3 }, nextDays: 3 },
  queue: [],
  syncing: false,
  lastSync: null,
  lastError: null,   // why the last sync failed, shown on Home until one succeeds
  cursor: null,      // serverTime of the last reply; the next sync asks for changes since then
  listeners: [],

  /* ---------------- persistence ---------------- */
  on(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); },

  load() {
    try { this.token = localStorage.getItem(LS.TOKEN); } catch (e) {}
    try { this.user = JSON.parse(localStorage.getItem(LS.USER) || 'null'); } catch (e) {}
    try {
      const c = JSON.parse(localStorage.getItem(LS.CACHE) || 'null');
      if (c) {
        this.items = c.items || [];
        this.branches = c.branches || [];
        this.desks = c.desks || [];
        this.followups = c.followups || [];
        this.reminders = c.reminders || null;
        this.users = c.users || [];
        this.settings = c.settings || this.settings;
        this.lastSync = c.lastSync || null;
        this.cursor = c.cursor || null;
      }
    } catch (e) {}
    try { this.queue = JSON.parse(localStorage.getItem(LS.QUEUE) || '[]'); } catch (e) { this.queue = []; }
  },

  persist() {
    try {
      localStorage.setItem(LS.CACHE, JSON.stringify({
        items: this.items, branches: this.branches, desks: this.desks, followups: this.followups, reminders: this.reminders, users: this.users, settings: this.settings, lastSync: this.lastSync, cursor: this.cursor
      }));
      localStorage.setItem(LS.QUEUE, JSON.stringify(this.queue));
    } catch (e) { console.warn('cache write failed', e); }
  },

  setSession(token, user) {
    this.token = token; this.user = user;
    try {
      localStorage.setItem(LS.TOKEN, token);
      localStorage.setItem(LS.USER, JSON.stringify(user));
    } catch (e) {}
  },

  clearSession() {
    this.token = null; this.user = null;
    this.items = []; this.branches = []; this.desks = []; this.followups = []; this.users = []; this.queue = [];
    this.cursor = null; this.lastError = null;
    try { [LS.TOKEN, LS.USER, LS.CACHE, LS.QUEUE].forEach(k => localStorage.removeItem(k)); } catch (e) {}
  },

  /* ---------------- transport ---------------- */
  // The address comes from the installer link (?api=...) and is kept on the phone, so the
  // public code never carries anyone's Sheet address. config.js is only a fallback.
  apiUrl() {
    let u = '';
    try { u = localStorage.getItem(LS.API) || ''; } catch (e) {}
    return u || CFG.API_URL;
  },
  isApiUrl(u) { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(u || '').trim()); },
  setApiUrl(u) {
    u = String(u || '').trim();
    if (!this.isApiUrl(u)) return false;
    if (this.apiUrl() !== u) this.clearSession();      // another Sheet: start clean
    try { localStorage.setItem(LS.API, u); } catch (e) { return false; }
    return true;
  },
  configured() {
    const u = this.apiUrl();
    return !!(u && u.indexOf('PASTE_YOUR') === -1);
  },

  // Every call has a time limit: on a phone a request can stall (signal drop, network
  // switch) and without a limit it would block syncing until the app is restarted.
  async api(action, payload = {}, { timeout = 60000 } = {}) {
    if (!this.configured()) throw new Error('API_URL is not set in js/config.js');

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    let res, data;
    try {
      res = await fetch(this.apiUrl(), {
        method: 'POST',
        // text/plain keeps this a "simple request" so the browser skips
        // the CORS preflight that Apps Script cannot answer.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action, token: this.token }, payload)),
        redirect: 'follow',
        cache: 'no-store',
        signal: ctl.signal
      });
      if (!res.ok) throw new Error('Server responded ' + res.status);
      const text = await res.text();
      try { data = JSON.parse(text); }
      catch (e) { throw new Error('Server sent an unexpected reply — Google may be busy, try again'); }
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('The server took too long to answer');
      throw err;
    } finally {
      clearTimeout(timer);
    }
    if (data && data.error === 'AUTH') { this.clearSession(); throw new Error('SESSION_EXPIRED'); }
    return data;
  },

  // Reads are safe to repeat, so give a flaky connection one more go.
  async apiRetry(action, payload) {
    try { return await this.api(action, payload); }
    catch (err) {
      if (String(err.message) === 'SESSION_EXPIRED') throw err;
      await new Promise(r => setTimeout(r, 1500));
      return this.api(action, payload);
    }
  },

  /* ---------------- auth ---------------- */
  async login(username, pin) {
    const r = await this.api('login', { username, pin });
    if (!r.ok) throw new Error(r.message || 'Login failed');
    this.setSession(r.token, r.user);
    return r;
  },

  /* ---------------- sync ---------------- */
  // full: reload everything (app open, sign-in, Sync now). Otherwise ask only for
  // what changed since the last reply and merge it in.
  async pull({ full = false } = {}) {
    const since = !full && this.cursor && this.items.length ? this.cursor : undefined;
    const r = await this.apiRetry('bootstrap', since ? { since } : {});
    if (!r.ok) throw new Error(r.message || 'Could not load data');
    if (r.delta) {
      const gone = new Set(r.removed || []);
      const byId = new Map(this.items.filter(x => !gone.has(x.id)).map(x => [x.id, x]));
      (r.items || []).forEach(x => byId.set(x.id, x));
      this.items = Array.from(byId.values());
    } else {
      this.items = r.items || [];
    }
    this.users = r.users || [];
    if (r.branches) this.branches = r.branches;
    if (r.desks) this.desks = r.desks;
    if (r.reminders) this.reminders = r.reminders;
    if (r.followups) {
      // keep follow-ups saved on this phone that the server has not stored yet
      const queued = new Set(this.queue.filter(j => j.action === 'saveFollowup').map(j => j.payload.followup.id));
      const local = this.followups.filter(f => queued.has(f.id) && !r.followups.some(x => x.id === f.id));
      this.followups = r.followups.concat(local);
    }
    this.settings = r.settings || this.settings;
    if (r.user) this.setSession(this.token, r.user);
    this.cursor = r.serverTime || null;
    this.lastSync = new Date().toISOString();
    this.lastError = null;
    this.persist();
    this.emit();
    return r;
  },

  enqueue(action, payload) {
    this.queue.push({ id: 'q' + Date.now() + Math.random().toString(36).slice(2, 6), action, payload, at: Date.now() });
    this.persist();
    this.emit();
  },

  async sync({ silent = false, full = false } = {}) {
    if (this.syncing || !this.token) return { ok: false, skipped: true };
    if (!navigator.onLine) return { ok: false, offline: true };
    this.syncing = true; this.emit();
    let pushed = 0, failed = [];
    try {
      while (this.queue.length) {
        const job = this.queue[0];
        // offline / transient errors throw out of the loop: the job stays queued and the
        // pull is skipped too, or the reply would hide this phone's unsent change
        const r = await this.api(job.action, job.payload);
        if (r && r.ok === false && r.error !== 'AUTH') failed.push(r.message || 'Rejected');
        this.queue.shift(); pushed++;
        this.persist();
      }
      await this.pull({ full });
      return { ok: true, pushed, failed };
    } catch (err) {
      const msg = err.message === 'Failed to fetch' || err.message === 'Load failed' ? 'No connection to the server' : err.message;
      if (msg !== 'SESSION_EXPIRED') this.lastError = msg;
      return { ok: false, error: msg };
    } finally {
      this.syncing = false; this.emit();
    }
  },

  branch(code) { return this.branches.find(b => Number(b.code) === Number(code)) || null; },
  desk(key) { return this.desks.find(d => d.key === key) || null; },

  followupsFor(id) {
    return this.followups.filter(f => f.proposalId === id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  },

  /* ---------------- mutations (optimistic) ---------------- */
  // Saved on the phone at once, sent to the Sheet in the background (or when back online).
  saveItem(item) {
    const now = new Date().toISOString();
    const prev = this.items.find(x => x.id === item.id) || null;
    if (!prev) {
      item.id = item.id || ('P' + Date.now() + Math.floor(Math.random() * 1000));
      item.createdAt = now;
      item.createdBy = this.user.name;
    }
    item.updatedAt = now;
    item.amount = Number(item.amount) || 0;   // ₹ lakh

    const i = this.items.findIndex(x => x.id === item.id);
    if (i >= 0) this.items[i] = Object.assign({}, this.items[i], item);
    else this.items.unshift(item);

    this.enqueue('saveProposal', { item });
    this.persist();
    this.trySync();
    return item;
  },

  // A follow-up and the proposal it changes are queued together (follow-up first).
  saveFollowup(fu, item) {
    const now = new Date().toISOString();
    fu.id = fu.id || ('F' + Date.now() + Math.floor(Math.random() * 1000));
    fu.createdAt = fu.createdAt || now; fu.updatedAt = now; fu.createdBy = this.user.name;
    this.followups.push(fu);
    this.enqueue('saveFollowup', { followup: fu });
    if (item) this.saveItem(item); else { this.persist(); this.trySync(); }
    return fu;
  },

  deleteItem(id) {
    this.items = this.items.filter(x => x.id !== id);
    this.enqueue('deleteProposal', { id });
    this.persist(); this.trySync();
  },

  saveSettings(settings) {
    this.settings = settings;
    this.enqueue('saveSettings', { settings });
    this.persist(); this.trySync();
  },

  // baseline = usernames this phone knew about, so the server only removes
  // logins the Admin actually deleted here, never ones added elsewhere meanwhile.
  saveUsers(users, baseline) {
    this.users = users.map(u => Object.assign({}, u, { pin: undefined }));
    this.enqueue('saveUsers', { users, baseline });
    this.persist(); this.trySync();
  },

  trySync() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.sync({ silent: true }).then(() => this.emit()), 600);
  }
};

window.Store = Store;
window.LS = LS;
