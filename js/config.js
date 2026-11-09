/* ============================================================
   Loan Tracking — configuration
   ------------------------------------------------------------
   After you deploy the Apps Script web app, paste its /exec URL
   into API_URL below. That is the ONLY thing you must change.
   ============================================================ */

window.APP_CONFIG = {

  // Default server = the demo Sheet in the support account, so the plain address
  // https://anmolbage.github.io/loan-tracking/ works on any phone. Every request still
  // needs a username + PIN. An installer link (?api=...) overrides this on that phone.
  API_URL: 'https://script.google.com/macros/s/AKfycbxGUZolAka01Tc45VCb6SqXiaQVXcrQ7UzNKe75A1zzo7DLzy97ASDiOFXX194-7fFF/exec',

  APP_NAME: 'Loan Tracking',
  VERSION: '0.7.0',          // bump together with CACHE in sw.js on every release

  // Short prefix for this app's browser storage, so two apps on the same
  // GitHub Pages domain never read each other's login or cache.
  STORAGE_PREFIX: 'loan-tracking',

  OFFICE_NAME: 'RO Hazaribag',
  BANK_NAME: 'Jharkhand Rajya Gramin Bank',

  // Google Sheet used as the database (for the "Open Sheet" link in More)
  SHEET_URL: '',

  SEGMENTS: { personal: 'Personal', sme: 'SME', agri: 'Agri' },

  // The pipeline. `id` is what is written in the Sheet's stage column; `name` is shown.
  // `holder` says who has the file at that stage — the Late flag and the desks depend on it,
  // so the order and holders are fixed here, not in Settings.
  STAGES: [
    { id: 'Lead',          name: 'Lead at branch',            holder: 'branch'  },
    { id: 'Docs pending',  name: 'Documents pending',         holder: 'branch'  },
    { id: 'Received AMH',  name: 'Received at AMH',           holder: 'officer' },
    { id: 'Processing',    name: 'Under processing',          holder: 'officer' },
    { id: 'Query',         name: 'Query with branch',         holder: 'branch'  },
    { id: 'With AMH Head', name: 'With AMH Head',             holder: 'head'    },
    { id: 'Sanctioned',    name: 'Sanctioned, not disbursed', holder: 'branch'  },
    { id: 'Disbursed',     name: 'Disbursed',                 holder: 'closed'  },
    { id: 'Rejected',      name: 'Rejected / Withdrawn',      holder: 'closed'  }
  ],
  // Stages a new proposal can start at
  START_STAGES: ['Lead', 'Docs pending', 'Received AMH', 'Processing'],
  HEARD_FROM: ['BM', 'AMH', 'Meeting']
};
