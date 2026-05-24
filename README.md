# 🌌 EXOSky

**EXOSky** is an interactive exoplanet visualisation app built for the **NASA International Space Apps Challenge**. It lets young people explore thousands of real worlds discovered by NASA — with an interactive star map, habitable zone search, discovery timeline, and a machine learning classifier trained on NASA's Kepler dataset.

---

## Project Structure

```
exosky/
├── exosky-backend/          Node.js REST API + Python ML microservice
│   ├── src/                 Express app (routes, controllers, services)
│   ├── ml-service/          Python Random Forest classifier (Flask)
│   ├── .env.example         Environment variable template
│   └── package.json
│
└── exosky-frontend/         React app (Vite)
    ├── src/
    │   ├── components/      Reusable UI (Navbar, PlanetCard, GalaxyMinimap…)
    │   ├── pages/           HomePage, ExploreMap, HabitablePage, DiscoveriesPage
    │   ├── hooks/           Data fetching hooks
    │   └── utils/api.js     All backend API calls
    └── package.json
```

---

## Prerequisites

Make sure you have these installed before starting:

| Tool    | Version | Check              |
|---------|---------|--------------------|
| Node.js | ≥ 18    | `node -v`          |
| npm     | ≥ 9     | `npm -v`           |
| Python  | ≥ 3.10  | `python --version` |
| pip     | any     | `pip --version`    |


---

## 1 — NASA API Key (free, 2 minutes)

The backend uses NASA's public APIs. The default `DEMO_KEY` works but is rate-limited to 30 requests/hour. For normal use, get a free key:

1. Go to **https://api.nasa.gov/**
2. Fill in the short form → your key arrives instantly by email
3. Keep it handy for the `.env` step below

---

## 2 — Backend (Node.js API)

```bash
# From the project root
cd exosky-backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Open `.env` and set your NASA key:

```env
PORT=3001
NODE_ENV=development
API_VERSION=v1
ALLOWED_ORIGIN=http://localhost:3000
NASA_API_KEY=your_key_here        # replace DEMO_KEY with your key
ML_SERVICE_URL=http://localhost:5001
```

Start the backend:

```bash
npm run dev          # development — auto-restarts on file changes
# or
npm start            # production
```

The API will be running at **http://localhost:3001**

Verify it works:
```bash
curl http://localhost:3001/health
# → { "status": "ok", "version": "v1", ... }
```

---

## 3 — ML Microservice (Python — optional)

The ML service classifies transit signals as CONFIRMED / CANDIDATE / FALSE POSITIVE using a Random Forest trained on NASA's Kepler KOI dataset. It is **optional** — the main app works without it. If the ML service is offline, the `/api/v1/ml/*` endpoints return a clean 503 and everything else continues normally.

```bash
cd exosky-backend/ml-service

# Install Python dependencies
pip install -r requirements.txt

# Train the model — downloads ~9,500 KOI records from NASA and trains (~30 seconds)
# Only needs to run once. Saves model.joblib to disk.
python exoplanet_classifier.py

# Start the Flask server
python app.py
```

The ML service will be running at **http://localhost:5001**

Verify:
```bash
curl http://localhost:5001/health
# → { "status": "ok", "model_ready": true }
```

---

## 4 — Frontend (React)

Open a **new terminal**:

```bash
cd exosky-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be running at **http://localhost:3000**

Open it in your browser — it will automatically connect to the backend on port 3001.

---

## Running Everything at Once

You need **up to 3 terminals** running simultaneously:

| Terminal                  | Command                                         | Port |
|---------------------------|-------------------------------------------------|------|
| 1 — Backend API           | `cd exosky-backend && npm run dev`              | 3001 |
| 2 — ML Service (optional) | `cd exosky-backend/ml-service && python app.py` | 5001 |
| 3 — Frontend              | `cd exosky-frontend && npm run dev`             | 3000 |

Then open **http://localhost:3000** in your browser.

---

## Pages

| Page       | URL          | Description                                                   |
|------------|--------------|---------------------------------------------------------------|
| Home       | `/`          | Picture of the day, asteroids passing Earth                   |
| Explore    | `/explore`   | Interactive star map : zoom, click planets, search, filter    |
| Life Zones | `/habitable` | Earth-sized planets in habitable zone, scored by life         |
| Discoveries| `/timeline`  | Discovery timeline chart by year and detection method         |

---

## API Quick Reference

All endpoints are at `http://localhost:3001/api/v1/`

```
GET  /exoplanets?maxDist=500          All planets within 500 parsecs
GET  /exoplanets/search?q=Kepler      Search by name
GET  /exoplanets/habitable            Habitable zone candidates
GET  /exoplanets/stats                Discoveries by year and method
GET  /exoplanets/:name                Full detail for one planet

GET  /nasa/apod                       NASA Astronomy Picture of the Day
GET  /nasa/apod/random?count=5        Random APOD entries
GET  /nasa/neo                        Near-Earth Objects passing today
GET  /nasa/images?q=exoplanet         NASA image library search

GET  /ml/health                       ML service status
GET  /ml/model                        Model info and feature importances
GET  /ml/features                     List of accepted input features
POST /ml/classify                     Classify a transit signal
```

---

## Common Issues

**"Cannot connect to backend"**
Make sure `npm run dev` is running in the `exosky-backend` folder and the port 3001 is not occupied by another process.

**"API error 429 — Too Many Requests"**
You are hitting NASA's rate limit on `DEMO_KEY`. Get a free key at https://api.nasa.gov/ and set it in your `.env` file.

**ML endpoints return 503**
The Python ML service is not running. Either start it with `python app.py` in `ml-service/`, or ignore it — all other features work without it.

**`python` command not found**
Try `python3` instead. On some systems Python 3 is only available as `python3`:
```bash
python3 exoplanet_classifier.py
python3 app.py
```

**Frontend shows blank page or network errors**
Check that the backend is running on port 3001. The Vite dev server proxies `/api` requests to `localhost:3001` automatically — no manual CORS configuration needed.

**`model.joblib` not found when starting Flask**
Run the training step first:
```bash
python exoplanet_classifier.py
```
This only needs to be done once. After that, `python app.py` will load the saved model instantly.

---

## NASA APIs Used

| API                           | What it powers                                    |
|-------------------------------|---------------------------------------------------|
| Exoplanet Archive (TAP)       | Star map, habitable zone, search, discovery stats |
| Astronomy Picture of the Day  | Homepage daily image                              |
| Near Earth Object Web Service | Homepage asteroid feed                            |
| NASA Image & Video Library    | In-app space image search                         |

---

## Built With

**Frontend:** React 18 · React Router · Vite · HTML Canvas (star map)

**Backend:** Node.js · Express · Axios · Helmet · express-rate-limit · Morgan

**ML:** Python · scikit-learn · Flask · pandas · numpy · joblib

---

*Built for the NASA International Space Apps Challenge.*