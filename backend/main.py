from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).parent / "diabetes_model.pkl"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]


BANDS = {"low_below": 0.30, "high_from": 0.60}


FEATURES = [
    dict(name="Pregnancies", label="Pregnancies", unit="times", min=0, max=20, step=1, default=2,
         reference=1, typical=None, hint="Number of times pregnant."),
    dict(name="Glucose", label="Plasma glucose", unit="mg/dL", min=40, max=300, step=1, default=110,
         reference=95, typical=[70, 139], hint="2-hour reading from an oral glucose tolerance test."),
    dict(name="BloodPressure", label="Diastolic blood pressure", unit="mm Hg", min=20, max=140, step=1,
         default=72, reference=70, typical=[60, 80], hint="The lower number in a blood pressure reading."),
    dict(name="SkinThickness", label="Triceps skin fold", unit="mm", min=5, max=100, step=1, default=28,
         reference=25, typical=None, hint="Skin fold thickness measured at the back of the upper arm."),
    dict(name="Insulin", label="2-hour serum insulin", unit="µU/mL", min=10, max=900, step=1, default=100,
         reference=85, typical=[16, 166], hint="Insulin level 2 hours after a glucose load."),
    dict(name="BMI", label="Body mass index", unit="kg/m²", min=10, max=70, step=0.1, default=30,
         reference=23, typical=[18.5, 24.9], hint="Weight in kg divided by height in metres squared."),
    dict(name="DiabetesPedigreeFunction", label="Family history score", unit="score", min=0.05, max=2.5,
         step=0.001, default=0.4, reference=0.25, typical=None,
         hint="Diabetes pedigree function. Higher means more relatives with diabetes."),
    dict(name="Age", label="Age", unit="years", min=18, max=100, step=1, default=33,
         reference=30, typical=None, hint="Age in years."),
]
FEATURE_NAMES = [f["name"] for f in FEATURES]


class PatientInput(BaseModel):
    Pregnancies: int = Field(ge=0, le=20)
    Glucose: float = Field(ge=40, le=300)
    BloodPressure: float = Field(ge=20, le=140)
    SkinThickness: float = Field(ge=5, le=100)
    Insulin: float = Field(ge=10, le=900)
    BMI: float = Field(ge=10, le=70)
    DiabetesPedigreeFunction: float = Field(ge=0.05, le=2.5)
    Age: int = Field(ge=18, le=100)


class Driver(BaseModel):
    feature: str
    label: str
    value: float
    reference: float
    impact: float 


class PredictionOut(BaseModel):
    probability: float
    percent: float
    prediction: Literal[0, 1]
    risk_level: Literal["low", "moderate", "high"]
    drivers: list[Driver]


def risk_level(p: float) -> str:
    if p < BANDS["low_below"]:
        return "low"
    if p < BANDS["high_from"]:
        return "moderate"
    return "high"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
    trained_cols = list(getattr(model, "feature_names_in_", FEATURE_NAMES))
    if trained_cols != FEATURE_NAMES:
        raise RuntimeError(f"Feature mismatch. Model expects {trained_cols}, API defines {FEATURE_NAMES}")
    importances = getattr(model, "feature_importances_", None)
    if importances is not None:
        for f, imp in zip(FEATURES, importances):
            f["importance"] = round(float(imp), 4)
    app.state.model = model
    yield


app = FastAPI(title="Diabetes Risk API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model": type(app.state.model).__name__}


@app.get("/schema")
def schema():
    model = app.state.model
    return {
        "features": FEATURES,
        "bands": BANDS,
        "model": {
            "type": type(model).__name__,
            "n_estimators": getattr(model, "n_estimators", None),
        },
    }


@app.post("/predict", response_model=PredictionOut)
def predict(payload: PatientInput):
    model = app.state.model
    values = payload.model_dump()
    row = pd.DataFrame([[values[n] for n in FEATURE_NAMES]], columns=FEATURE_NAMES)

    try:
        base = float(model.predict_proba(row)[0][1])

     
        variants = []
        for f in FEATURES:
            v = row.copy()
            v.loc[0, f["name"]] = f["reference"]
            variants.append(v)
        swapped = model.predict_proba(pd.concat(variants, ignore_index=True))[:, 1]
    except Exception as exc:  # model/library mismatch etc.
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    drivers = [
        Driver(
            feature=f["name"],
            label=f["label"],
            value=values[f["name"]],
            reference=f["reference"],
            impact=round((base - float(p)) * 100, 1),
        )
        for f, p in zip(FEATURES, swapped)
    ]
    drivers.sort(key=lambda d: abs(d.impact), reverse=True)

    return PredictionOut(
        probability=round(base, 4),
        percent=round(base * 100, 1),
        prediction=1 if base >= 0.5 else 0,
        risk_level=risk_level(base),
        drivers=drivers,
    )
