"""
exoplanet_classifier.py
────────────────────────────────────────────────────────────────────────────────
Random Forest classifier trained on the NASA Kepler Objects of Interest (KOI)
Cumulative Table fetched live from the NASA Exoplanet Archive TAP API.

Dataset: https://exoplanetarchive.ipac.caltech.edu  (table: cumulative)
Target : koi_disposition → CONFIRMED | CANDIDATE | FALSE POSITIVE

The model learns from 14 photometric + stellar features that are routinely
measured during transit observations, so it can score *any* candidate signal
given the same parameters — useful for the EXOSky frontend.
"""

import logging
import requests
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from sklearn.impute import SimpleImputer
import joblib
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Feature columns chosen from the KOI table ────────────────────────────────
# no post-hoc labels required so they ar valid prediction features.
FEATURE_COLS = [
    "koi_period",        # Orbital period (days)
    "koi_time0bk",       # Time of first transit (BJD)
    "koi_impact",        # Transit impact parameter
    "koi_duration",      # Transit duration (hours)
    "koi_depth",         # Transit depth (ppm)
    "koi_prad",          # Planetary radius (Earth radii)
    "koi_teq",           # Equilibrium temperature (K)
    "koi_insol",         # Insolation flux (Earth flux)
    "koi_model_snr",     # Transit signal-to-noise ratio
    "koi_steff",         # Stellar effective temperature (K)
    "koi_slogg",         # Stellar surface gravity (log g)
    "koi_srad",          # Stellar radius (solar radii)
    "koi_kepmag",        # Kepler-band magnitude
    "koi_score",         # Disposition score (0–1) assigned by Robovetter
]

TARGET_COL = "koi_disposition"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
LABEL_PATH = os.path.join(os.path.dirname(__file__), "label_encoder.joblib")

KOI_TAP_URL = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
    "?query=select+kepoi_name,koi_disposition,"
    + ",".join(FEATURE_COLS)
    + "+from+cumulative+where+koi_disposition+IS+NOT+NULL"
    "&format=json"
)


# ── Data fetching ─────────────────────────────────────────────────────────────

def fetch_koi_data() -> pd.DataFrame:
    """Download the full KOI cumulative table from NASA TAP and return a DataFrame."""
    log.info("Fetching KOI cumulative table from NASA Exoplanet Archive …")
    response = requests.get(KOI_TAP_URL, timeout=60)
    response.raise_for_status()
    records = response.json()
    df = pd.DataFrame(records)
    log.info(f"  → {len(df):,} KOI records fetched.")
    return df


# ── Preprocessing ─────────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame):
    """
    Clean the raw KOI DataFrame:
      1. Keep only the target + feature columns.
      2. Drop rows where the target is missing.
      3. Median-impute missing feature values.
      4. Encode the target label.
    Returns (X, y, label_encoder, imputer).
    """
    df = df[[TARGET_COL] + FEATURE_COLS].copy()
    df = df.dropna(subset=[TARGET_COL])

    X_raw = df[FEATURE_COLS].values
    y_raw = df[TARGET_COL].values

    # Impute missing feature values with column medians
    imputer = SimpleImputer(strategy="median")
    X = imputer.fit_transform(X_raw)

    # Encode string labels → integers
    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    log.info(f"  Classes: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    log.info(f"  Class distribution: { {c: int((y == i).sum()) for i, c in enumerate(le.classes_)} }")
    return X, y, le, imputer


# ── Training ──────────────────────────────────────────────────────────────────

def train(X, y, le):
    """
    Train a Random Forest classifier and report performance.
    Uses class_weight='balanced' to handle the natural imbalance between
    CONFIRMED (few) and FALSE POSITIVE (many) samples.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    log.info("\n" + classification_report(y_test, y_pred, target_names=le.classes_))

    return clf


# ── Public API ────────────────────────────────────────────────────────────────

def build_and_save_model():
    """Full pipeline: fetch → preprocess → train → persist to disk."""
    df = fetch_koi_data()
    X, y, le, imputer = preprocess(df)
    clf = train(X, y, le)
    joblib.dump((clf, imputer), MODEL_PATH)
    joblib.dump(le, LABEL_PATH)
    log.info(f"Model saved → {MODEL_PATH}")
    return clf, le, imputer


def load_model():
    """Load a previously saved model from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Model not found. Run `python exoplanet_classifier.py` first to train."
        )
    clf, imputer = joblib.load(MODEL_PATH)
    le = joblib.load(LABEL_PATH)
    return clf, le, imputer


def predict(features: dict, clf, le, imputer) -> dict:
    """
    Predict the disposition of a single KOI candidate.

    Parameters
    ----------
    features : dict  — keys must match FEATURE_COLS (missing values are fine)
    clf, le, imputer — loaded model objects

    Returns
    -------
    dict with keys: prediction, confidence, probabilities
    """
    row = [features.get(col, np.nan) for col in FEATURE_COLS]
    X = imputer.transform([row])
    probs = clf.predict_proba(X)[0]
    idx = int(np.argmax(probs))
    return {
        "prediction": le.inverse_transform([idx])[0],
        "confidence": round(float(probs[idx]), 4),
        "probabilities": {
            cls: round(float(p), 4)
            for cls, p in zip(le.classes_, probs)
        },
        "feature_importances": {
            col: round(float(imp), 4)
            for col, imp in zip(FEATURE_COLS, clf.feature_importances_)
        },
    }


# ── CLI entry-point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("Training exoplanet classifier from NASA KOI data …")
    build_and_save_model()
    log.info("Done. Run `python app.py` to start the API server.")
