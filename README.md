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
* Node 18 or higher (install from <https://nodejs.org>).  
* (Optional) A Google Gemini API key if you want AI chiefs / narrative events.  

### Steps
1. **Clone** the repo  
   ```bash
   git clone https://github.com/your-org/radix-tribes.git
   cd radix-tribes
   ```
2. **Install** dependencies  
   ```bash
   npm install
   ```
3. **Environment variables**  
   Copy the example file and edit values as needed:  
   ```bash
   cp .env.local .env
   # then open .env and set GEMINI_API_KEY=your_key_here  (optional)
   ```
4. **Run** both server and client (same command – Vite proxy handles API)  
   ```bash
   npm run dev
   ```  
   Visit <http://localhost:5173> in your browser.  

By default the back-end listens on port **3000** and the front-end on **5173**.
Socket.IO keeps them in sync automatically.

---

## 🚀 Online Deployment (Quick-Start)

Ready to host a global game?  Follow the **[DEPLOYMENT.md](DEPLOYMENT.md)**
guide, which covers Railway, Render and generic Docker-compose setups.

In short:

1. Push this repo to GitHub.  
2. Create a new service on your PaaS (Railway / Render).  
3. Add the environment variables shown in `.env.example`.  
4. Mount a persistent volume (or configure Postgres) so `game-data.json`
   survives restarts.  
5. Point your domain at the generated URL, add it to `ALLOWED_ORIGINS`, and
   redeploy.  

Players can now join from anywhere in the world by visiting the public
front-end URL.

---

## 🌍 Playing with Friends Worldwide

* Share your deployed front-end link – e.g. `https://play.radixtribes.com`.  
* Each player registers an account and creates a tribe.  
* When all human (and AI) tribes have submitted their plans, an admin presses
  **Process Turn** in the Admin Panel (or schedule it via CRON for
  fully-automated rounds).  
* Watch the wasteland evolve turn by turn!  

---

## 🤝 Contributing

We love community contributions!  To submit a change:

1. **Fork** the repo & create a feature branch (`git checkout -b feature/foo`).  
2. **Code** your fix or feature using the existing coding style.  
3. **Run lint & tests** (coming soon).  
4. **Open a Pull Request** describing the change and referencing an issue if
   applicable.  

Please read `CONTRIBUTING.md` (soon to be added) for the full guidelines and
code-of-conduct.

---

## 🄯 License

Radix Tribes is released under the MIT License — see `LICENSE` for details.
