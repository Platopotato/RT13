# Deployment Guide for Radix Tribes Online  
_A step-by-step reference for launching the game server and client so that players anywhere in the world can connect._

---

## 1  Overview
Radix Tribes uses:
* **Node 18+** runtime  
* **Express** + **Socket.IO** backend (`server.js`)  
* **React/Vite** frontend (`npm run dev` for local)  
* A simple **JSON file database** (replaceable with Postgres if preferred)

The instructions below cover two popular Platform-as-a-Service (PaaS) options—**Railway** and **Render**—but the same concepts apply to Heroku, Fly .io, etc.

---

## 2  Pre-deployment Checklist
1. **Repository ready**  
   Ensure your repo contains the updated `server.js`, `package.json`, `.env.example` (or `.env.local`), and `data/` directory.
2. **Environment variables**  
   Copy `.env.example` ➜ `.env` locally and fill in real values (see section 4).
3. **Ports**  
   The server listens on `process.env.PORT` (defaults to `3000`). PaaS platforms automatically inject this variable; do **not** hard-code a different port.
4. **Data persistence strategy**  
   Decide if you will:
   * Use the default **file-based JSON** with a mounted volume  
   * Or migrate to a managed database (Postgres, Mongo, etc.)  

---

## 3  Deploying on Railway

### 3.1 Create a Railway Project
1. Sign in to <https://railway.app>.  
2. Click **“New Project” → “Deploy from GitHub repo”** and choose your Radix Tribes repository.

### 3.2 Configure Deployment
* **Root directory**: leave blank (repo root).  
* **Start command**: Railway reads `npm start` automatically.  
* **Install command**: defaults to `npm install`.

### 3.3 Set Environment Variables
1. In **Settings → Variables**, add the keys from section 4.  
2. For `DATA_DIR`, supply `/mnt/data` (Railway’s persistent volume path).  
3. For `ALLOWED_ORIGINS`, list your future frontend URLs, e.g.  
   ```
   https://radixtribes.vercel.app,https://my-custom-domain.com
   ```

### 3.4 Add a Persistent Volume
1. Go to **Plugins → Storage** and attach a **Volume**.  
2. Mount path: `/mnt/data` (matches `DATA_DIR`).  
3. Size: 1 GB is plenty for JSON storage.

### 3.5 Trigger the First Deploy
Railway will build the container and start the service.  
Copy the generated domain (e.g., `radix-tribes-production.up.railway.app`).

---

## 4  Deploying on Render

### 4.1 Create a Web Service
1. Log in to <https://render.com>.  
2. Click **“New → Web Service”** and pick your repo.  
3. **Environment**: `Node`.  
4. **Build Command**: `npm install` (or leave blank).  
5. **Start Command**: `npm start`.

### 4.2 Environment Variables
Navigate to **Environment → Secret Files / Variables** and add the same keys:

| Key | Suggested Value |
|-----|-----------------|
| `PORT` | (leave blank – Render sets it) |
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/var/data` |
| `DATABASE_FILE` | `/var/data/game-data.json` |
| `ALLOWED_ORIGINS` | `https://radix-tribes.onrender.com` |
| `GEMINI_API_KEY` | *(optional)* |

### 4.3 Persistent Disk
1. Enable **“Filesystem → Add Disk”** → mount path `/var/data`.  
2. Choose size (512 MB is fine).  
Render automatically backs this up between deploys.

---

## 5  Environment Variable Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Runtime port injected by PaaS | *(auto)* |
| `NODE_ENV` | `development` / `production` | `production` |
| `DATA_DIR` | Directory for game data | `/mnt/data` |
| `DATABASE_FILE` | Full path to JSON file | `/mnt/data/game-data.json` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `https://radixtribes.app,https://localhost:5173` |
| `GEMINI_API_KEY` | Key for Google Gemini calls (optional) | `ya29.XXXX` |

---

## 6  Connecting Players Worldwide

1. **Open CORS**  
   `ALLOWED_ORIGINS` must include every frontend domain (and `http://localhost:5173` for local builds).
2. **Public URL**  
   Share the PaaS URL or configure a custom domain (`CNAME` to Railway/Render).  
3. **HTTPS**  
   Both Railway and Render provide free TLS certificates automatically.
4. **Scaling considerations**  
   * Railway: enable **Autoscaling** under “Settings”.  
   * Render: upgrade to a paid plan or set **instance count ≥ 2** for redundancy.
5. **WebSocket limits**  
   Free tiers usually handle ~100 concurrent sockets. For larger events, upgrade the plan or migrate to a dedicated Socket.IO host (e.g., Upstash, Pusher).

Diagram:  
```
┌──────────┐   HTTPS/WebSocket   ┌────────────┐
│ Browser  │  ─────────────────▶ │  PaaS App  │
│ (React)  │ ◀────────────────── │ Express +  │
└──────────┘          JSON REST  │ Socket.IO  │
               (fallback polling)└────────────┘
```

---

## 7  Ensuring Data Persistence

| PaaS | Strategy |
|------|----------|
| Railway | Attach **Volume** (`/mnt/data`). |
| Render  | Enable **Persistent Disk** (`/var/data`). |
| Heroku  | Use **Heroku Postgres** or S3 (Heroku FS is ephemeral). |
| Docker/VPS | Bind-mount host folder: `-v $(pwd)/data:/app/data`. |

Backup tip: schedule `cron` job (`railway run`) to copy `game-data.json` to S3/GCS weekly.

---

## 8  Troubleshooting

| Symptom | Fix |
|---------|-----|
| **`CORS policy: No ‘Access-Control-Allow-Origin’`** | Add the frontend URL to `ALLOWED_ORIGINS`. Redeploy. |
| **Socket.IO disconnects after ~1 min** | Check that your proxy (Cloudflare, Nginx) allows WebSocket upgrades. |
| **`EACCES: permission denied, open '/mnt/data/game-data.json'`** | Volume not mounted or wrong `DATA_DIR` path. Verify disk settings. |
| **App boots locally but crashes on PaaS** | Inspect logs (Railway: “Logs”, Render: “Events”). Ensure Node version ≥ 18 in `engines`. |
| **Players can’t see each other’s moves** | Confirm backend URL in frontend (`VITE_BACKEND_URL`) and that both client & server use the same Socket.IO version. |
| **High memory usage** | Periodically archive old `history` entries or move to a real database. |

---

## 9  Next Steps

* **Monitoring** – Add Railway metrics or Render alerts for CPU/RAM.  
* **HTTPS Custom Domain** – Point a CNAME and enable automatic TLS.  
* **Database Migration** – If your community grows >1 k players, switch to Postgres and replace the JSON file with SQL tables.  

---

## 10  Appendices

### 10.1 Illustrative Screenshots  
*(place images in `docs/img` and commit)*

```
docs/
└─ img/
   ├─ railway-add-volume.png
   ├─ render-env-vars.png
   └─ lobby-screenshot.png
```

Markdown usage:
```md
![Adding a volume on Railway](./docs/img/railway-add-volume.png)
```

### 10.2 Cheat-sheet Commands
```bash
# Local development
npm install
cp .env.example .env
npm run dev     # Frontend (Vite)
npm start       # Backend

# Railway
railway up      # CLI deploy

# Render
git push render main
```

Happy launching, and see you in the Wasteland!
