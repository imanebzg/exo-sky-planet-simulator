# 🌌 EXOSky : Backend API

The backend is for a data visualisation project built during the **NASA International Space Apps Challenge Hackathon**. It exposes a clean REST API aggregating multiple NASA data sources, alongside a Python ML microservice that runs a **Random Forest classifier trained on NASA's Kepler dataset** to predict whether a transit signal is a confirmed exoplanet, a candidate, or a false positive

---

## Architecture

```

  Node.js API  (port 3001)                       Python ML Service (port 5001)
  Express · Helmet · Rate-limit      ─────▶     Flask · scikit-learn        
                                                 Random Forest (NASA KOI data)
  /api/v1/exoplanets  ──▶ NASA TAP              /predict  /model/info        
  /api/v1/nasa        ──▶ NASA APIs             /features /retrain           
  /api/v1/ml          ──▶ ML svc          

```

---

## Project Structure

```
exosky-backend/
│
├── src/                          Node.js API
│   ├── server.js                 Entry point
│   ├── app.js                    Express setup (middleware, routes, errors)
│   ├── config/
│   │   ├── env.js                Centralised environment variables
│   │   └── httpClient.js         Shared Axios factory + error normalisation
│   ├── routes/
│   │   ├── exoplanetRoutes.js    /api/v1/exoplanets/*
│   │   ├── nasaRoutes.js         /api/v1/nasa/*
│   │   └── mlRoutes.js           /api/v1/ml/*
│   ├── controllers/
│   │   ├── exoplanetController.js
│   │   ├── nasaController.js
│   │   └── mlController.js
│   ├── services/
│   │   ├── exoplanetService.js   NASA Exoplanet Archive (TAP)
│   │   ├── nasaService.js        APOD · NeoWs · Image Library
│   │   └── mlService.js          HTTP client for the Python ML service
│   ├── middleware/
│   │   ├── errorHandler.js       Global Express error handler
│   │   └── validate.js           Query parameter validation
│   └── utils/
│       └── tapQueryBuilder.js    ADQL query builder
│
└── ml-service/                   Python ML microservice
    ├── app.py                    Flask REST server
    ├── exoplanet_classifier.py   Data pipeline + Random Forest model
    └── requirements.txt
```

---

## 🤖 ML Microservice — How it works

### Dataset
The classifier trains on the **NASA Kepler Objects of Interest (KOI) Cumulative Table**, fetched live from the NASA Exoplanet Archive TAP API. This is the same dataset used by NASA's own automated vetting pipeline.

Each row in the dataset represents a *Kepler Object of Interest* — a periodic transit-like signal detected in Kepler photometry — and is labelled with one of three dispositions:

| Label | Meaning |
|---|---|
| `CONFIRMED` | Independently verified as a real planet |
| `CANDIDATE` | Passes automated vetting, awaiting follow-up |
| `FALSE POSITIVE` | Explained by an astrophysical false alarm (e.g. eclipsing binary) |

### Features (14 transit + stellar parameters)

| Feature | Description |
|---|---|
| `koi_period` | Orbital period (days) |
| `koi_time0bk` | Time of first transit |
| `koi_impact` | Impact parameter (0 = central transit) |
| `koi_duration` | Transit duration (hours) |
| `koi_depth` | Transit depth (ppm) |
| `koi_prad` | Planetary radius (Earth radii) |
| `koi_teq` | Equilibrium temperature (K) |
| `koi_insol` | Insolation flux (Earth flux) |
| `koi_model_snr` | Transit signal-to-noise ratio |
| `koi_steff` | Stellar effective temperature (K) |
| `koi_slogg` | Stellar surface gravity |
| `koi_srad` | Stellar radius (solar radii) |
| `koi_kepmag` | Kepler-band magnitude |
| `koi_score` | Robovetter disposition score (0–1) |

### Algorithm
**Random Forest** (200 trees, `class_weight='balanced'`). Missing values are median-imputed automatically, so the `/classify` endpoint works even with partial data.

Published studies using this same dataset and algorithm report **>99% accuracy** on the classification task.

---

## ⚡ Quick Start

### 1. Node.js API

```bash
npm install
cp .env.example .env   # fill in your NASA_API_KEY
npm run dev            # starts on http://localhost:3001
```

### 2. Python ML Service

```bash
cd ml-service
pip install -r requirements.txt

# Train the model (downloads ~9,500 KOI records from NASA, takes ~30s)
python exoplanet_classifier.py

# Start the Flask server
python app.py          # starts on http://localhost:5001
```

The Node.js API will degrade gracefully if the ML service is offline — all other routes continue to work and `/api/v1/ml/*` returns a clear `503`.

---

## 📡 API Reference

### Health

```
GET /health
```

---

### Exoplanets  `/api/v1/exoplanets`

| Endpoint | Description |
|---|---|
| `GET /?maxDist=100` | Exoplanets within N parsecs |
| `GET /search?q=Kepler` | Search by partial name |
| `GET /habitable` | Earth-sized planets in habitable zone |
| `GET /stats` | Discoveries grouped by year + method |
| `GET /:name` | Full detail for one planet |

---

### NASA Data  `/api/v1/nasa`

| Endpoint | Description |
|---|---|
| `GET /apod` | Astronomy Picture of the Day |
| `GET /apod?date=YYYY-MM-DD` | APOD for a specific date |
| `GET /apod/random?count=5` | Random APOD entries |
| `GET /neo` | Near-Earth Objects passing by today |
| `GET /images?q=exoplanet` | NASA Image Library search |

---

### ML  `/api/v1/ml`

| Endpoint | Description |
|---|---|
| `GET /health` | ML service status + model readiness |
| `GET /features` | List of accepted feature columns |
| `GET /model` | Algorithm info + top feature importances |
| `POST /classify` | Classify a candidate transit signal |

#### Example: classify a transit signal

```bash
curl -X POST http://localhost:3001/api/v1/ml/classify \
  -H "Content-Type: application/json" \
  -d '{
    "koi_period": 290.0,
    "koi_prad": 2.4,
    "koi_teq": 265,
    "koi_model_snr": 18.5,
    "koi_score": 0.88
  }'
```

**Response**
```json
{
  "prediction": "CONFIRMED",
  "confidence": 0.913,
  "probabilities": {
    "CANDIDATE": 0.054,
    "CONFIRMED": 0.913,
    "FALSE POSITIVE": 0.033
  },
  "feature_importances": {
    "koi_score": 0.312,
    "koi_model_snr": 0.187,
    "koi_prad": 0.143,
    ...
  }
}
```

---

## 🛠️ Stack

**Node.js API**: Express · Axios · Helmet · express-rate-limit · Morgan · dotenv

**Python ML**: scikit-learn · pandas · numpy · Flask · joblib · requests

---

## 🌍 NASA APIs Used

| API | Endpoint |
|---|---|
| Exoplanet Archive — Planetary Systems (TAP) | `exoplanetarchive.ipac.caltech.edu/TAP/sync` |
| Exoplanet Archive — KOI Cumulative Table | `exoplanetarchive.ipac.caltech.edu/TAP/sync` |
| Astronomy Picture of the Day | `api.nasa.gov/planetary/apod` |
| Near Earth Object Web Service | `api.nasa.gov/neo/rest/v1` |
| NASA Image & Video Library | `images-api.nasa.gov` |

Get your free NASA API key at [api.nasa.gov](https://api.nasa.gov/).

---

## 📋 Error Format

```json
{ "error": "Descriptive message here." }
```
--------------------------------------------
| Code  | Meaning                          |
|-------|----------------------------------|
| `400` | Bad request / invalid parameters |
| `404` | Resource not found               |
| `429` | Rate limit exceeded              |
| `500` | Internal server error            |
| `503` | ML service unavailable           |
--------------------------------------------
---

## 🏆 Context

Built for the **[NASA International Space Apps Challenge](https://www.spaceappschallenge.org/)** — a 48-hour global hackathon. The EXOSky project visualises confirmed exoplanets and makes exoplanet science accessible to young audiences.
