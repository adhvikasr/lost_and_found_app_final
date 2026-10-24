# Campus Lost & Found (Vue 3 + Vite + SQLite)

A full-stack campus Lost & Found application built with **Vue 3 Single-File Components (`.vue`)**, **Vite**, **Express**, and **SQLite (`better-sqlite3`)**.

---

## 📁 Project Structure

```
FinalApp/
├── client/                     # Vue 3 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Vue Single-File Components
│   │   │   ├── StatusSection.vue # Live frontend, server & SQLite status
│   │   │   ├── ItemForm.vue    # Report lost/found item form
│   │   │   └── ItemsTable.vue  # Live items table with search & filters
│   │   ├── App.vue             # Root Vue Component
│   │   ├── main.js             # Vue 3 application entry point
│   │   └── style.css           # Preserved responsive styling (mobile-first)
│   ├── public/                 # Static public assets
│   ├── dist/                   # Production build output (served by Express)
│   ├── index.html              # Vite HTML host container (<div id="app">)
│   ├── vite.config.js          # Vite config with API proxy to port 3001
│   └── package.json            # Frontend dependencies (Vue 3, Vite)
├── server/                     # Backend API server
│   ├── data/                   # SQLite database storage directory
│   │   └── campus-lost-found.db# Persistent SQLite database file
│   ├── src/
│   │   ├── controllers/        # Request controllers
│   │   │   ├── health.controller.js
│   │   │   └── items.controller.js
│   │   ├── db/                 # Database configuration & queries
│   │   │   └── sqlite.js       # SQLite connection with better-sqlite3
│   │   ├── routes/             # Express API routes (/health, /items)
│   │   │   └── api.routes.js
│   │   ├── app.js              # Express app (API + serves client/dist)
│   │   └── index.js            # Server entry point & listener
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Local environment config (PORT=3001)
│   └── package.json            # Backend dependencies
├── package.json                # Root convenience scripts
└── README.md                   # Documentation & run instructions
```

---

## 🚀 How to Run on macOS

### 1. Install Dependencies (First Time Setup)
From the project root directory (`FinalApp`):
```bash
npm run install:all
```
*(Or install individually: `npm --prefix server install && npm --prefix client install`)*

---

### 2. Development Mode (Recommended)

In development, the Vite dev server runs with Hot Module Replacement (HMR) and automatically proxies all `/api/*` calls to the Express backend.

#### Terminal 1 — Start the Backend Server:
```bash
npm run dev:server
```
- Backend starts at: `http://localhost:3001`
- SQLite database initializes at: `server/data/campus-lost-found.db`

#### Terminal 2 — Start the Vite Vue Frontend:
```bash
npm run dev:client
```
- Vite dev server starts at: **[http://localhost:5173](http://localhost:5173)**
- Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Production Mode (Single Server)

You can compile the Vue 3 frontend and let Express serve both the API and the static build from a single port (`3001`):

1. **Build the Vue frontend**:
   ```bash
   npm run build
   ```
2. **Start the Express server**:
   ```bash
   npm start
   ```
3. **Open the application**:
   - Web App: **[http://localhost:3001](http://localhost:3001)**
   - API Health: **[http://localhost:3001/api/health](http://localhost:3001/api/health)**
   - API Items: **[http://localhost:3001/api/items](http://localhost:3001/api/items)**

---

## 💾 Database & API Features

- **Database Engine**: Persistent SQLite (`better-sqlite3`) with WAL mode (`server/data/campus-lost-found.db`).
- **Data Safety**: Parameterized SQL queries only. Tables and indexes are auto-created without destroying existing data.
- **API Endpoints**:
  - `GET /api/health` — Returns backend health, version, SQLite connection status, and total item count.
  - `GET /api/items` — Retrieves items with optional filters:
    - `?search=<keyword>` (case-insensitive search across name, category, location)
    - `?category=<category>` (e.g. `electronics`, `accessories`, `id-cards`, `keys`, `clothing`, `stationery`, `other`)
    - `?status=Lost|Found|all`
  - `POST /api/items` — Reports a new item (`name`, `category`, `location`, `status`).
  - `GET /api/items/:id` — Retrieves an item by its ID.
