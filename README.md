# Campus Lost & Found

A full-stack application for managing and recovering lost and found items on campus, built with HTML5, CSS3, Vanilla JavaScript, Node.js, Express, and Supabase.

---

## 📁 Project Structure

```
FinalApp/
├── client/                     # Frontend client
│   ├── css/
│   │   └── styles.css          # Responsive styling (mobile-first)
│   ├── js/
│   │   └── app.js              # Client logic and backend health check
│   └── index.html              # Main frontend entry point
├── server/                     # Backend API server
│   ├── data/                   # Data storage directory
│   ├── src/
│   │   ├── controllers/        # Request controllers
│   │   │   └── health.controller.js
│   │   ├── db/                 # Database configuration
│   │   │   └── supabase.js
│   │   ├── routes/             # Express API routes
│   │   │   └── api.routes.js
│   │   ├── app.js              # Express app setup & middleware
│   │   └── index.js            # Server entry point & listener
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Local environment config
│   └── package.json            # Backend dependencies & scripts
├── package.json                # Root convenience scripts
└── README.md                   # Documentation & run instructions
```

---

## 🚀 Run Commands

### 1. Install Dependencies
Run the following from the project root:
```bash
npm --prefix server install
```

### 2. Start the Backend Server (and serve Frontend)
From the project root:
```bash
npm run dev
# or
npm start
```
The server will start at:
- **Web App (Frontend)**: [http://localhost:3001](http://localhost:3001)
- **Health Check API**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 3. Open the Frontend Directly
You can also open the client directly in the browser:
```bash
open client/index.html
# or from root:
npm run open:client
```
When opened directly (`file:///`), the client script will connect to the backend at `http://localhost:3001/api/health`.

---

## 🔍 Verification

1. **Backend Health Check**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "app": "Campus Lost and Found",
     "version": "1.0.0",
     "environment": "development",
     "timestamp": "2026-10-24T...",
     "services": {
       "server": "running",
       "database": "not_configured"
     }
   }
   ```

2. **Frontend UI**:
   Navigate to [http://localhost:3001](http://localhost:3001). The status grid will show green indicators for the frontend client and backend API.

---

## ⚙️ Environment Variables (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port for Express backend | `3001` |
| `NODE_ENV` | Environment mode (`development`/`production`) | `development` |
| `SUPABASE_URL` | Supabase Project URL | Optional |
| `SUPABASE_KEY` | Supabase anon public API key | Optional |
