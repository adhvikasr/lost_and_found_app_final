# Campus Lost & Found (SQLite Edition)

A full-stack campus Lost & Found application with an Express backend, persistent **SQLite** database (`better-sqlite3`), and vanilla JavaScript frontend.

---

## 📁 Project Structure

```
FinalApp/
├── client/                     # Frontend client
│   ├── css/
│   │   └── styles.css          # Responsive styling (mobile-first)
│   ├── js/
│   │   └── app.js              # Client logic, health check, and item CRUD
│   └── index.html              # Main frontend entry point
├── server/                     # Backend API server
│   ├── data/                   # SQLite database storage directory
│   │   └── campus-lost-found.db# Persistent SQLite database file
│   ├── src/
│   │   ├── controllers/        # Request controllers
│   │   │   ├── health.controller.js
│   │   │   └── items.controller.js
│   │   ├── db/                 # Database configuration & queries
│   │   │   └── sqlite.js       # SQLite connection with better-sqlite3
│   │   ├── routes/             # Express API routes
│   │   │   └── api.routes.js   # Mounts /health and /items
│   │   ├── app.js              # Express app setup, CORS, static serving
│   │   └── index.js            # Server entry point & listener
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Local environment config
│   └── package.json            # Backend dependencies & scripts
├── package.json                # Root convenience scripts
└── README.md                   # Documentation & run instructions
```

---

## 💾 Database (SQLite with `better-sqlite3`)

The application automatically creates and connects to the SQLite database file at:
```
server/data/campus-lost-found.db
```
- **Engine**: `better-sqlite3`
- **Concurrency**: Write-Ahead Logging (`WAL` mode) enabled for high performance.
- **Auto-Initialization**: Creates the `items` table and indexes automatically on startup if they do not exist.
- **Safety**: Uses strictly parameterized SQL queries (`?` placeholders) to prevent SQL injection. Existing data is never deleted or truncated on restarts.

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Lost', 'Found')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
```

---

## 🚀 Run Commands

### 1. Install Dependencies
```bash
npm --prefix server install
```

### 2. Start the Backend Server
```bash
npm run dev
# or
npm start
```
The server will start at:
- **Web App (Frontend)**: [http://localhost:3001](http://localhost:3001)
- **Health Check API**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Items API**: [http://localhost:3001/api/items](http://localhost:3001/api/items)

---

## 🔍 How to Verify Persistence Across Restarts

1. **Start the server**:
   ```bash
   npm start
   ```
2. **Add a test item** via the UI or `curl`:
   ```bash
   curl -X POST http://localhost:3001/api/items \
     -H "Content-Type: application/json" \
     -d '{"name":"Green Notebook","category":"stationery","location":"Library 3rd Floor","status":"Lost"}'
   ```
3. **Stop the server** (`Ctrl+C` or kill process).
4. **Restart the server**:
   ```bash
   npm start
   ```
5. **Verify the item persists**:
   ```bash
   curl http://localhost:3001/api/items
   ```
   Or query SQLite directly:
   ```bash
   sqlite3 server/data/campus-lost-found.db "SELECT * FROM items WHERE name='Green Notebook';"
   ```
   The record will be retrieved intact from disk.

---

## ⚙️ Environment Configuration (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port for Express backend | `3001` |
| `NODE_ENV` | Environment mode (`development`/`production`) | `development` |
| `DB_PATH` | Path to persistent SQLite database file | `./data/campus-lost-found.db` |
