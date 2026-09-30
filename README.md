# Diabetes risk dashboard

- `backend/`  FastAPI service that loads `diabetes_model.pkl` (scikit-learn RandomForest, 8 features)
- `frontend/` React (Vite) dashboard that builds its form from the API's `/schema`

## Run the backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Interactive API docs: http://localhost:8000/docs

## Run the dashboard
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. If the API runs elsewhere, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Endpoints
| Method | Path       | Purpose |
|--------|------------|---------|
| GET    | `/health`  | Liveness check |
| GET    | `/schema`  | Feature metadata (ranges, units, defaults, importances) and risk bands |
| POST   | `/predict` | Body: the 8 features. Returns probability, risk level and per-input drivers |

## Things to check
- **scikit-learn version**: the model was saved with 1.6.1, so `requirements.txt` pins it.
- **Risk bands** (`BANDS` in `main.py`): low below 30%, high from 60%. Change them to suit your use.
- **Input ranges**: zeros are rejected for Insulin, SkinThickness, Glucose, BloodPressure and BMI, because
  the model appears to have been trained on data where those zeros were already imputed.
- **Deploying**: set `CORS_ORIGINS` (comma-separated) to your dashboard's URL.
