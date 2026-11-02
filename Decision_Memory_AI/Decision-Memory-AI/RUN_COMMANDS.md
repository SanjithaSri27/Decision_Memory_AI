# Decision Memory AI — Run Commands & Quickstart Guide 🚀

This document lists all the main entry commands to install, run, test, and expose **Decision Memory AI**.

---

## ⚡ Quick Start (Run in 2 Separate Terminals)

### Terminal 1: Backend API (Port 8000)
```powershell
cd backend
npm install
npm start
```
> **Development mode (auto-reload on code change):**
> ```powershell
> npm run dev
> ```
> **Verify backend health:**
> Open [http://localhost:8000/health](http://localhost:8000/health) in your browser.

---

### Terminal 2: Frontend Dashboard (Port 5173)
```powershell
cd frontend
npm install
npm.cmd run dev
```
> **Open Dashboard:**
> Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💻 Run from Workspace Root (Without Changing Folders)

If you are at the project root `c:\Users\dhars\OneDrive\Desktop\Decision-Memory-AI`:

### Start Backend
```powershell
npm.cmd --prefix backend start
```

### Start Frontend
```powershell
npm.cmd --prefix frontend run dev
```

---

## 🐳 Docker Alternative (All-in-One)

To spin up backend, database, and frontend simultaneously with Docker:
```powershell
docker compose up -d --build
```

To stop containers:
```powershell
docker compose down
```

---

## 🧪 Testing & Verification Commands

Run these from the `backend/` folder or root:

| Command | Description |
| :--- | :--- |
| `npm.cmd --prefix backend test` | End-to-end HTTP integration test (Health, MRs, Decisions, Semantic Search) |
| `npm.cmd --prefix backend run test:apis` | Test live API credentials for GitLab and Cohere AI |
| `npm.cmd --prefix backend run test:local` | Test SQLite vector search & database CRUD operations |
| `npm.cmd --prefix backend run recreate-db` | Drop and cleanly recreate all database tables |
| `npm.cmd --prefix backend run mock` | Launch mock presentation API server |

---

## 🌐 Exposing GitLab Webhooks (Ngrok)

When testing GitLab webhooks from `gitlab.com`:
```powershell
ngrok http 8000
```
1. Copy the forwarding URL from Ngrok (e.g. `https://xxxx.ngrok-free.app`).
2. Add the webhook in your GitLab repository settings:
   - **URL:** `https://xxxx.ngrok-free.app/webhook/gitlab`
   - **Secret token:** Value of your `GITLAB_TOKEN`
   - **Triggers:** Merge request events, Comments

---

## ⚙️ Environment Variables Reference (`.env`)

Placed at the project root:
```ini
COHERE_API_KEY=your_cohere_api_key
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your_gitlab_personal_access_token
# Optional: defaults to local decision_memory.db SQLite file
# DATABASE_URL=postgresql://postgres:postgres@db:5432/decision_memory
```

---

## 📡 Key Local URLs & Endpoints

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Merge Requests API:** [http://localhost:8000/mrs](http://localhost:8000/mrs)
- **Decision Records API:** [http://localhost:8000/decisions](http://localhost:8000/decisions)
- **Semantic Search API:** `POST http://localhost:8000/api/search/semantic`
- **GitLab Webhook Receiver:** `POST http://localhost:8000/webhook/gitlab`
