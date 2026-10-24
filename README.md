# Campus Findr • University Lost & Found App

A modern, responsive full-stack campus Lost & Found application built with **Vue 3 Single-File Components (`.vue`)**, **Vite**, **Express**, and **SQLite (`better-sqlite3`)**, matching the official Campus Findr Stitch design system.

---

## 🛠️ Stack & Architecture

- **Frontend**: Vue 3 (Composition API `<script setup>`), Vite 8, Tailwind CSS, Google Material Symbols Outlined, Inter & Plus Jakarta Sans typography.
- **Backend**: Node.js, Express (RESTful API), CORS, parameterized SQL queries.
- **Database**: SQLite (`better-sqlite3`), WAL journal mode, automatic migration & indexing (`server/data/campus-find.db`).
- **Responsive Design**: Built-in responsive behavior from mobile (360–390px) to tablet (768px) and desktop (1280px+). Minimum 44px touch targets.

---

## 📁 Project Structure

```
FinalApp/
├── client/                                # Vue 3 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginView.vue              # Stitch Collegiate Authentication single-file component
│   │   │   ├── common/                    # Shared Foundation Components
│   │   │   │   ├── AppHeader.vue          # Fixed navigation header with student profile, sign out & mobile drawer
│   │   │   │   ├── AppFooter.vue          # Guidelines, support links & system status
│   │   │   │   ├── BaseButton.vue         # Accessible button with variants & 44px touch targets
│   │   │   │   ├── BaseBadge.vue          # Status pills (Found, Lost, Claimed)
│   │   │   │   ├── BaseModal.vue          # Accessible backdrop modal with ESC key dismiss
│   │   │   │   └── ToastNotification.vue  # Floating notification toasts
│   │   │   ├── home/                      # Home Page Workspace Components
│   │   │   │   ├── HeroWorkspace.vue      # Dual action launchpads ("I Lost Something" / "I Found an Item")
│   │   │   │   ├── SearchFilterBar.vue    # Keyboard search (⌘K / /), feed tabs & quick facet dropdowns
│   │   │   │   ├── ItemCard.vue           # High-density item card with media, ownership badge & action triggers
│   │   │   │   └── ItemGrid.vue           # 1-col mobile, 2-col tablet, 3-col desktop responsive card grid
│   │   │   └── modals/                    # Interactive Workflow Modals
│   │   │       ├── ReportItemModal.vue    # File Lost alert or Log Found item with creator association
│   │   │       ├── ClaimModal.vue         # Claim Belonging with pre-populated Student ID verification
│   │   │       ├── ReviewClaimsModal.vue  # Owner claim review, approval, and rejection workflow
│   │   │       ├── SpottedModal.vue       # Handoff notice for spotted items
│   │   │       ├── KeywordAlertModal.vue  # Campus keyword automated email matching
│   │   │       └── InfoModal.vue          # Campus FAQs, Ownership Rules & Honor Code
│   │   ├── App.vue                        # Root application orchestrator
│   │   ├── main.js                        # Vue 3 entry point mounting on #app
│   │   └── style.css                      # Design tokens, variables & responsive rules
│   ├── dist/                              # Production build output
│   ├── index.html                         # HTML template host container (<div id="app">)
│   ├── vite.config.js                     # Vite proxying /api to port 3001
│   └── package.json
├── server/                                # Node.js + Express Backend
│   ├── data/
│   │   └── campus-find.db                 # SQLite database file
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── health.controller.js       # Health endpoint handler
│   │   │   └── items.controller.js        # Items CRUD & claim handlers
│   │   ├── db/
│   │   │   └── sqlite.js                  # better-sqlite3 connection, migration & seed
│   │   ├── routes/
│   │   │   └── api.routes.js              # REST endpoints (/health, /stats, /items)
│   │   ├── app.js                         # Express server (serves API & client/dist)
│   │   └── index.js                       # Server entry point on port 3001
│   ├── .env.example
│   └── package.json
├── package.json                           # Root convenience scripts
└── README.md
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Start Backend Server
```bash
npm start
```
The server will start on **`http://localhost:3001`**, serving both the REST API and the production Vue frontend.

### 4. Development Mode (with Hot-Module Reloading)
In two separate terminals:
```bash
# Terminal 1: Backend server
npm run dev:server

# Terminal 2: Vite Vue frontend with HMR
npm run dev:client
```
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:3001`

---

## 📡 API Endpoints

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & SQLite database connectivity |
| `GET` | `/api/stats` | Aggregated counts for total, found, lost, and claimed items |

### Authentication (Demo Accounts)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Sign in with demo credentials (`username`, `password`) |
| `GET` | `/api/auth/me` | Fetch currently authenticated student session |
| `POST` | `/api/auth/logout` | End session and clear session cookie |

### Items & Ownership
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/items` | Query items with `search`, `category`, `status`, `location` |
| `GET` | `/api/items/:id` | Retrieve single item by ID |
| `POST` | `/api/items` | Create lost or found item record (associated with authenticated student) |
| `POST` | `/api/items/:id/claim` | Submit claim verification with Student ID & ownership proof (creates Pending claim) |

### Owner Claim Review Workflow
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/items/:id/claims` | View all claims for a listing (restricted to listing owner) |
| `POST` | `/api/claims/:id/approve` | Approve claim atomically; moves item to Reunited Archive |
| `POST` | `/api/claims/:id/reject` | Reject claim; item remains in active Found listings |
| `GET` | `/api/claims/my` | View all claims submitted by current student |

---

## 👥 Demo Authentication Accounts

The application includes five preset demonstration accounts:

| Username | Password | Student ID | Full Name |
|---|---|---|---|
| `student1` | `demo123` | `STU001` | Student One |
| `student2` | `demo123` | `STU002` | Student Two |
| `student3` | `demo123` | `STU003` | Student Three |
| `student4` | `demo123` | `STU004` | Student Four |
| `student5` | `demo123` | `STU005` | Student Five |

> **Security Notice**: These are demonstration accounts designed for evaluation and local testing only. Passwords are validated server-side, sessions are managed via HTTP cookies, and demo credentials are never exposed in frontend code.

---

## 🧪 Automated Testing

Run the full end-to-end authentication and claim workflow test suite:
```bash
npm test
```
All 42 assertions test session management, account switching, self-claim prevention, owner-only authorization, atomic claim approvals, and SQLite database persistence.

---

## 📱 Responsive Support

- **Mobile (360px – 390px)**:
  - Header compacts cleanly with touch hamburger menu for navigation.
  - Dual action cards stack into 1 column with full-width action buttons.
  - Filter tabs support smooth swipe scrolling (`overflow-x-auto no-scrollbar`).
  - Item cards display 1 column with min 44px interactive tap targets.
  - Modals adapt to screen height with touch-friendly form fields and action rows.
- **Tablet (768px)**:
  - 2-column card grid, inline quick filters, university badge visible.
- **Desktop (1024px – 1440px+)**:
  - Full 3-column card grid, keyboard shortcuts (`⌘K` / `/` focus), live status pills.
