"""
app.py  —  EXOSky ML Microservice
────────────────────────────────────────────────────────────────────────────────
Lightweight Flask server that exposes the trained Random Forest classifier
via a REST API. Called internally by the Node.js backend.

Routes
------
GET  /health              → liveness check + model status
POST /predict             → classify a single KOI candidate
GET  /features            → return the list of feature columns + descriptions
GET  /model/info          → model metadata (accuracy, class distribution, etc.)
POST /retrain             → re-fetch NASA data and retrain (admin use)
"""

import os
import logging
import threading
import numpy as np
from flask import Flask, request, jsonify
from exoplanet_classifier import (
    FEATURE_COLS,
    MODEL_PATH,
    build_and_save_model,
    load_model,
    predict,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)

_model_state = {"clf": None, "le": None, "imputer": None, "ready": False, "error": None}

FEATURE_DESCRIPTIONS = {
    "koi_period":    "Orbital period in days",
    "koi_time0bk":   "Time of first transit (BJD - 2454833)",
    "koi_impact":    "Transit impact parameter (0 = central transit)",
    "koi_duration":  "Transit duration in hours",
    "koi_depth":     "Transit depth in parts per million (ppm)",
    "koi_prad":      "Planetary radius in Earth radii",
    "koi_teq":       "Equilibrium temperature in Kelvin",
    "koi_insol":     "Insolation flux relative to Earth",
    "koi_model_snr": "Transit signal-to-noise ratio",
    "koi_steff":     "Stellar effective temperature in Kelvin",
    "koi_slogg":     "Stellar surface gravity (log g, cgs)",
    "koi_srad":      "Stellar radius in solar radii",
    "koi_kepmag":    "Kepler-band apparent magnitude",
    "koi_score":     "Robovetter disposition score (0 = false positive, 1 = planet)",
}


def _load():
    """Attempt to load a pre-trained model; train from scratch if not found."""
    try:
        if not os.path.exists(MODEL_PATH):
            log.info("No saved model found — training from NASA data …")
            clf, le, imputer = build_and_save_model()
        else:
            log.info("Loading saved model from disk …")
            clf, le, imputer = load_model()
        _model_state.update(clf=clf, le=le, imputer=imputer, ready=True, error=None)
        log.info("Model ready.")
    except Exception as e:
        _model_state["error"] = str(e)
        log.error(f"Model failed to load: {e}")


threading.Thread(target=_load, daemon=True).start()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_model():
    if not _model_state["ready"]:
        err = _model_state.get("error") or "Model is still loading, please retry in a moment."
        return jsonify({"error": err}), 503
    return None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({
        "status": "ok" if _model_state["ready"] else "loading",
        "model_ready": _model_state["ready"],
        "model_error": _model_state.get("error"),
    })


@app.get("/features")
def features():
    return jsonify({
        "features": [
            {"name": col, "description": FEATURE_DESCRIPTIONS.get(col, "")}
            for col in FEATURE_COLS
        ]
    })


@app.get("/model/info")
def model_info():
    guard = _require_model()
    if guard:
        return guard

    le = _model_state["le"]
    clf = _model_state["clf"]

    importances = sorted(
        zip(FEATURE_COLS, clf.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )

    return jsonify({
        "algorithm": "Random Forest (scikit-learn)",
        "dataset": "NASA Kepler KOI Cumulative Table",
        "dataset_url": "https://exoplanetarchive.ipac.caltech.edu",
        "n_estimators": clf.n_estimators,
        "classes": list(le.classes_),
        "n_features": len(FEATURE_COLS),
        "top_features": [
            {"feature": f, "importance": round(float(imp), 4)}
            for f, imp in importances[:5]
        ],
    })


@app.post("/predict")
def predict_route():
    """
    Classify a KOI candidate.

    Body (JSON): any subset of the 14 feature columns.
    Missing values are median-imputed automatically.

    Example:
      {
        "koi_period": 11.2,
        "koi_prad": 1.07,
        "koi_teq": 250,
        "koi_model_snr": 45.3,
        "koi_score": 0.9
      }
    """
    guard = _require_model()
    if guard:
        return guard

    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    # Validate that at least one known feature is present
    known_keys = set(body.keys()) & set(FEATURE_COLS)
    if not known_keys:
        return jsonify({
            "error": "No recognised feature columns in request body.",
            "expected_features": FEATURE_COLS,
        }), 400

    try:
        result = predict(body, _model_state["clf"], _model_state["le"], _model_state["imputer"])
        return jsonify(result)
    except Exception as e:
        log.exception("Prediction error")
        return jsonify({"error": str(e)}), 500


@app.post("/retrain")
def retrain():
    """Re-fetch NASA data and retrain the model. Runs in the background."""
    if not _model_state["ready"] and not _model_state.get("error"):
        return jsonify({"message": "Model is already training."}), 409

    def _retrain():
        _model_state["ready"] = False
        try:
            clf, le, imputer = build_and_save_model()
            _model_state.update(clf=clf, le=le, imputer=imputer, ready=True, error=None)
            log.info("Retrain complete.")
        except Exception as e:
            _model_state["error"] = str(e)
            log.error(f"Retrain failed: {e}")

    threading.Thread(target=_retrain, daemon=True).start()
    return jsonify({"message": "Retraining started in the background. Poll /health to check status."})



if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    log.info(f"EXOSky ML service starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
