/* ============================================================
   Loan Tracking — user manual (opened from More → User manual)
   Plain HTML in sections. Late limits and the follow-up gap are
   filled in from the live settings so the manual never goes stale.
   ============================================================ */
window.manualHtml = function (s) {
  s = s || {};
  const late = Object.assign({ branch: 10, officer: 5, head: 3, note: 7 }, s.lateDays || {});
  const gap = Number(s.nextDays) || 3;
  const sec = (title, body, open) => `<details class="man"${open ? ' open' : ''}><summary>${title}</summary><div class="man-b">${body}</div></details>`;

  return `
  <h3>User manual</h3>
  <p class="sub">Tap a topic to open it.</p>

  ${sec('What this app is for', `
    <p>One place to see every loan proposal of the region: <b>which stage it is at, who is holding it,
    and for how many days</b>. After each conversation with a Branch Manager, a processing officer or the
    AMH Head, you note what you heard and when to check again. The app brings the file back to you on that day.</p>
    <p>Every proposal is always with one of three: the <b>branch</b>, the <b>processing officer</b> of its
    segment (Personal, SME or Agri), or the <b>AMH Head</b>.</p>`, true)}

  ${sec('Your day in 3 steps', `
    <ol>
      <li><b>Morning:</b> open <b>Chase → Due &amp; overdue</b>. These are the files you planned to check today.</li>
      <li><b>After every call or meeting:</b> open the proposal → <b>Follow-up / move stage</b> → note what you heard → set the next date. 30 seconds.</li>
      <li><b>New proposal heard of?</b> Tap <b>+</b> and add it on the spot.</li>
    </ol>`)}

  ${sec('Add a new proposal (+)', `
    <p>Tap the round <b>+</b> button at the bottom.</p>
    <ul>
      <li><b>Branch</b>: pick from the 40 branches.</li>
      <li><b>Borrower / firm</b> and <b>Amount in ₹ lakh</b> (25 means ₹25 lakh).</li>
      <li><b>Segment</b> (Personal / SME / Agri) and <b>Product</b>. The segment decides which processing officer the file goes to.</li>
      <li><b>Stage</b> and <b>At this stage since</b>: when the file reached this stage. Use the real date, not today, if it has been waiting.</li>
      <li><b>Next follow-up</b>: set to ${gap} days ahead by default.</li>
      <li><b>Heard from</b>: BM, AMH or Meeting.</li>
    </ul>
    <p>Tap <b>Save</b>. It works without signal too: it is saved on the phone and sent when the network returns.</p>`)}

  ${sec('Log a follow-up / move the stage', `
    <p>Open a proposal → <b>Follow-up / move stage</b>.</p>
    <ul>
      <li><b>What happened?</b> One line in your words. The grey buttons fill common notes.</li>
      <li><b>Move stage to</b>: leave on <i>No change</i> if the file has not moved. Only the sensible next steps are offered.</li>
      <li><b>Date it happened</b>: today, or the day it actually happened.</li>
      <li><b>Next follow-up</b>: when to check again (Tomorrow / 3 days / 1 week / 15 days).</li>
    </ul>
    <p>Every follow-up is kept in the proposal's <b>Follow-up history</b>, so you can see what was said and when.</p>`)}

  ${sec('Stages and who holds the file', `
    <table class="man-t">
      <tr><th>#</th><th>Stage</th><th>File is with</th></tr>
      <tr><td>1</td><td>Customer met</td><td>Branch</td></tr>
      <tr><td>2</td><td>Documents pending</td><td>Branch</td></tr>
      <tr><td>3</td><td>Application generated</td><td>Branch</td></tr>
      <tr><td>4</td><td>Sent to RO / AMH</td><td>Processing officer</td></tr>
      <tr><td>5</td><td>Under processing</td><td>Processing officer</td></tr>
      <tr><td>6</td><td>Sent to AMH Head for sanction</td><td>AMH Head</td></tr>
      <tr><td>7</td><td>Disbursed</td><td>Processing officer (to dispatch the sanction note)</td></tr>
      <tr><td>8</td><td>Sanction note dispatched</td><td>Closed (last stage)</td></tr>
      <tr><td>✕</td><td>Rejected / Withdrawn</td><td>Closed</td></tr>
    </table>
    <p>A file stays open after disbursal until the sanction note is dispatched, so a note still due is followed up too.</p>
    <p>Badge colours: blue = branch, teal = processing officer, purple = AMH Head,
    amber = disbursed, note due, green = note dispatched, red = rejected.</p>`)}

  ${sec('Days and "late" files', `
    <p>The small pill on a card (for example <b>6d</b>) is the number of days the file has been with its
    <b>current holder</b>. It does not restart when the file moves from <i>Received at AMH</i> to
    <i>Under processing</i>, because it is the same officer.</p>
    <p>A file turns <b style="color:var(--danger)">red / late</b> when it has been with:</p>
    <ul>
      <li>the branch for more than <b>${late.branch} days</b></li>
      <li>a processing officer for more than <b>${late.officer} days</b></li>
      <li>the AMH Head for more than <b>${late.head} days</b></li>
      <li>disbursed with the sanction note still not dispatched for more than <b>${late.note || 7} days</b></li>
    </ul>
    <p>Amber means it is getting close. These limits can be changed in the Sheet (Settings tab, <i>lateDays</i>).</p>`)}

  ${sec('Home screen', `
    <ul>
      <li><b>In pipeline</b>: total amount and number of live proposals up to disbursal.</li>
      <li>Small boxes: <b>disbursed, note due</b> · <b>follow-ups due</b> · <b>late files</b>.</li>
      <li><b>Where the files are</b>: how many are with branches, with processing officers, with the AMH Head.</li>
      <li><b>By stage</b>: count and amount at each stage.</li>
      <li><b>Branches with proposals</b>: live files and amount per branch (late ones marked). Tap a branch for its list.</li>
      <li><b>Branches with no leads</b>: branches with nothing in the pipeline: a reason to call.</li>
      <li><b>Late files</b> and <b>Due &amp; overdue</b>: the top few, with <i>All</i> to see the rest.</li>
    </ul>
    <p><b>Every number and box can be tapped</b> to see the list of files behind it.
    Use the <b>All segments / Personal / SME / Agri</b> buttons to see one segment.</p>`)}

  ${sec('Chase screen', `
    <p>Your follow-up list. The red number on the Chase button is how many are due today.</p>
    <ul>
      <li><b>Due &amp; overdue</b>: follow-up date is today or has passed.</li>
      <li><b>Late</b>: with one person longer than the limit.</li>
      <li><b>With branches / With processing officers / With AMH Head</b>: what each side is holding.</li>
      <li><b>Calendar</b>: month view of follow-up dates. Tap a day to see its files; red numbers are overdue.</li>
      <li><b>Sanction note due</b>: disbursed, sanction note not yet dispatched.</li>
      <li><b>Next 7 days</b>: follow-ups coming up this week.</li>
      <li><b>Recent activity</b>: every follow-up you noted, newest first.</li>
    </ul>
    <p>Use the search box for a borrower, branch or product.</p>`)}

  ${sec('Call and WhatsApp the person holding the file', `
    <p>On a proposal, <b>Call</b> phones whoever has the file now: the Branch Manager while it is at the
    branch, the segment's processing officer while it is at AMH, the AMH Head when it is put up.</p>
    <p><b>Ask status</b> opens WhatsApp with a polite status enquiry already written. You can change the text before sending.</p>
    <p>Numbers come from the Sheet (Branches and Desks tabs). If a BM or officer changes, update the Sheet and the app picks it up on the next sync.</p>`)}

  ${sec('Branch view and the BM WhatsApp list', `
    <p>Tap a branch on Home (or in <i>Branches with no leads</i>). The top card shows the Branch Manager with
    <b>Call BM</b> and <b>WhatsApp list</b>: one message listing every pending file of that branch with its stage and days,
    asking for the latest status. For a branch with nothing in the pipeline the button becomes <b>Ask for leads</b>.
    <b>Copy message</b> copies the same text, to paste anywhere.</p>
    <p>The same card exists for each <b>processing officer</b> (Personal, SME, Agri) and the <b>AMH Head</b>: tap their box
    under <i>Where the files are</i> on Home to see every file they are holding, with Call, WhatsApp list and Copy message.</p>`)}

  ${sec('Why files are stuck (reason tags)', `
    <p>In <b>Follow-up</b>, tap one reason if the file is held up: Documents, CIBIL, Valuation, Legal / title,
    Customer not responding, Branch slow, Officer pending, AMH Head pending, Other. It shows on the card and on Home
    under <b>Why files are stuck</b>; tap a reason to see those files. Moving the stage clears the old reason.</p>`)}

  ${sec('No update for 7+ days', `
    <p>A red <b>No update</b> tag appears on a live file nobody has heard about for more than ${Number(s.staleDays) || 7} days,
    even if its follow-up date is later. Chase → <b>No update</b> lists them.</p>`)}

  ${sec('Reports', `
    <p>More → <b>Reports</b> (or <i>Reports</i> on Home):</p>
    <ul>
      <li><b>Processing time</b>: average days at each step (branch, processing officer, AMH Head, sanction note),
      how many files are waiting at each step now and the oldest. Pick Personal / SME / Agri to see one officer.</li>
      <li><b>Monthly summary</b>: new proposals, sent for sanction, disbursed and notes dispatched, branch-wise, for any
      month. <b>Share on WhatsApp</b> or <b>Copy text</b> for a review meeting or HO.</li>
    </ul>`)}

  ${sec('Duplicate warning', `
    <p>When adding a proposal, the app warns if a similar borrower name is already live at the same branch, and asks
    before saving it again.</p>`)}

  ${sec('Reminders', s.reminders === 'hold' ? `
    <p><b>Phone reminders are on hold for now.</b> Open <b>Chase → Due &amp; overdue</b> each morning: it lists
    every file whose follow-up date has come. The red number on the Chase button shows how many.</p>
    <p>Later, each follow-up date will also become a Google Tasks reminder on your phone.</p>` : `
    <p>Each next follow-up date becomes a task in <b>Google Tasks</b> (list "Loan Pipeline"), so the phone reminds
    on that day. Moving the date moves the task; a disbursed or rejected file ticks it off.</p>
    <p>More → <b>Follow-up reminders</b> shows whether they are on.</p>`)}

  ${sec('Edit, delete, search, export', `
    <ul>
      <li><b>Edit</b> on a proposal corrects name, amount, product or dates. To record a conversation, use Follow-up instead, so the history is kept.</li>
      <li><b>Delete</b> hides a proposal; it stays in the Sheet marked deleted, so nothing is lost by a wrong tap.</li>
      <li><b>Proposals</b> tab: every file, with a search box and a button for each stage.</li>
      <li>More → <b>Export CSV</b>: download the list for a review meeting or a report.</li>
      <li>More → <b>Products</b>: add or remove products for Personal, SME and Agri.</li>
    </ul>`)}

  ${sec('Signal, sync and PIN', `
    <ul>
      <li>No signal? Keep working. Changes are saved on the phone and sent later. The top line shows "unsynced" until then.</li>
      <li>The <b>↻</b> button on Home (or More → Sync now) fetches the latest at once.</li>
      <li>More → <b>Change my PIN</b> to set a new 4–6 digit PIN. After 5 wrong PINs the login locks for 15 minutes.</li>
      <li>Install on the phone: browser menu → <b>Add to Home screen</b>. It then opens like an app.</li>
    </ul>`)}

  ${sec('Questions and feedback', `
    <p>Something missing, wrong or confusing? Tell Anmol what you were trying to do. Small changes
    (stage names, late limits, message wording) can be made without changing your link or losing data.</p>`)}
  `;
};
