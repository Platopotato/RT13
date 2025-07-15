# Radix Tribes – Post-Apocalyptic Strategy for the Web

Radix Tribes is a turn-based, hex-map strategy game where players lead survivor
factions in a devastated wasteland.  Build garrisons, research forgotten
technologies, trade (or wage war) with rival tribes, and survive long enough to
dominate the new world.

This repository contains **both** the React/Vite front-end and the Express /
Socket.IO back-end.  It can run entirely on your laptop for testing, or be
deployed to any cloud platform so players across the globe can play together.

---

## 📜 Gameplay at a Glance
* **Hex-based world** – procedural map with terrain, POIs and random events.  
* **Simultaneous turns** – players plan actions, the server resolves them at
  the end of each turn.  
* **Diplomacy system** – propose alliances, sue for peace, declare war.  
* **Tech tree & assets** – unlock advantages with research or rare artefacts.  
* **AI Tribes** – optional NPC factions fill out the map and keep pressure on
  human players.  

See in-game **Help → Codex** for the full ruleset.

---

## ⚙️ Technologies
* **Front-end:** React 18 + TypeScript + Tailwind + Vite  
* **Back-end:** Node 18, Express 4, Socket.IO 4  
* **Storage:** JSON file on disk by default (easily swapped for Postgres)  
* **AI:** Optional Google Gemini calls (set `GEMINI_API_KEY`)  

---

## 🖥️ Local Development
### Prerequisites
* Node 18 or higher  
* (Optional) Google Gemini API key for AI features  

### Steps
```bash
git clone https://github.com/your-org/radix-tribes.git
cd radix-tribes
npm install
cp .env.local .env           # then edit values if desired
npm run dev                  # runs front-end (5173) + back-end (3000)
```
Visit <http://localhost:5173> in your browser.

---

## 🐳 Running with Docker (Full-Stack)

The repository ships with a **multi-stage Dockerfile** and a
`docker-compose.yml` that now:

1. Installs server + client dependencies  
2. Runs a **Vite production build** (`vite build`) during image creation  
3. Copies the compiled `dist/` output into `/app/public`  
4. Starts `server.js`, which serves **both** the API **and** the static
   front-end from the same container

### Quick start
```bash
# Build and launch
docker compose up --build          # foreground
# or
docker compose up -d               # detached

# Stop / clean up
docker compose down
```

### What happens under the hood
* **Builder stage** – installs deps and runs `vite build --outDir public`  
* **Runtime stage** – uses Node 18-alpine (≈70 MB)  
* Compiled front-end assets live in `/app/public`; Express serves them at `/`  
* Volume `radix-data` is mounted to `/data` so `game-data.json` survives restarts  
* Container listens on **3000** internally.  
  `docker-compose.yml` publishes it to host port **3001** by default
  (`"3001:3000"`)

### Accessing the game
1. Wait for the build logs to say `Server listening on port 3000`
2. Open **http://localhost:3001** – the React app should load
3. Socket.IO automatically connects to `ws://localhost:3001`

### Environment variables (edit in `docker-compose.yml` or `.env`)
| Variable | Purpose | Default in compose |
|----------|---------|--------------------|
| `PORT` | Internal server port | 3000 |
| `DATA_DIR` | Where save file lives inside container | /data |
| `DATABASE_FILE` | Path to save file | /data/game-data.json |
| `ALLOWED_ORIGINS` | CORS whitelist (comma-separated) | http://localhost:3000 |
| `VITE_API_URL` | Injected into built front-end for API calls | http://localhost:3001 |
| `VITE_SOCKET_URL` | Injected into built front-end for WebSocket | http://localhost:3001 |
| `GEMINI_API_KEY` | Enables AI content | *unset* |

👉  If you change host port mapping (e.g. `8080:3000`) you **must** also change
`VITE_API_URL` and `VITE_SOCKET_URL` accordingly **before** running
`docker compose up --build`.

### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `bind: address already in use 0.0.0.0:3000` during `docker compose up` | Another process or container using port 3000 on host | Change host port (`<HOST>:3000`) in `docker-compose.yml` |
| Browser shows blank page or 404 after `docker compose up` | Front-end build failed or not copied | Run `docker compose logs radix-tribes` – look for Vite build errors |
| CORS errors in browser console | Front-end origin not whitelisted | Update `ALLOWED_ORIGINS` env var |
| `EACCES: permission denied` when writing `game-data.json` | Volume permissions | Run `docker compose down -v` then `docker compose up`, or chmod the host volume |
| Changes to front-end code not visible | Container uses cached build | Re-build: `docker compose up --build` |
| Socket.IO fails to connect | Wrong `VITE_SOCKET_URL` | Ensure it matches host mapping (e.g. `http://localhost:3001`) |

Once the image works locally you can deploy the same container to
Railway/Render/K8s/Dokku/etc. – just be sure to mount a persistent volume and
set the env vars above.

---

## 🚀 Online Deployment (Quick-Start)
Ready for production?  See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step
guides to Railway, Render or any Docker-capable VPS.

---

## 🌍 Playing with Friends Worldwide
1. Share your deployed front-end link – e.g. `https://play.radixtribes.com`  
2. Each player registers and creates a tribe  
3. When all tribes submit their plans, an admin clicks **Process Turn** (or
   schedule it via cron)  

---

## 🤝 Contributing
We love community contributions!  Fork → code → PR.  See CONTRIBUTING.md.

---

## 🄯 License
Radix Tribes is released under the MIT License — see `LICENSE` for details.
