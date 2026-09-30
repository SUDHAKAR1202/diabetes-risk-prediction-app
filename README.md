<img width="1920" height="1080" alt="Screenshot 2026-09-30 062104" src="https://github.com/user-attachments/assets/9f714938-2280-4fc2-ae9c-5d33f9121d82" /># Diabetes risk dashboard

- `backend/`  FastAPI service that loads `diabetes_model.pkl` (scikit-learn RandomForest, 8 features)
- `frontend/` React (Vite) dashboard that builds its form from the API's `/schema`

- <img width="1920" height="1080" alt="Screenshot 2026-09-30 062104" src="https://github.com/user-attachments/assets/d3ecd4ca-e60a-4f66-98f0-4c50abbfdf0d" />

<img width="1920" height="1080" alt="Screenshot 2026-09-30 062114" src="https://github.com/user-attachments/assets/d951af65-1c70-4994-9b91-f1da16e40966" />

<img width="1920" height="1080" alt="Screenshot 2026-09-30 062133" src="https://github.com/user-attachments/assets/1e03ffd8-42ad-4197-b4eb-2c1366616e2d" />

<img width="1920" height="1080" alt="Screenshot 2026-09-30 062147" src="https://github.com/user-attachments/assets/0066656e-6927-4cb9-8eb7-8836473a64b9" />

- Added the toggle button to switch between dark and light mode.
  
- <img width="1920" height="1080" alt="Screenshot 2026-09-30 062226" src="https://github.com/user-attachments/assets/a2361cd1-40de-48f6-a75c-d4ea4c45f19d" />

- Python FastAPI endpoints in Swagger.

- Kaggle dataset used : https://www.kaggle.com/datasets/jamaltariqcheema/pima-indians-diabetes-dataset

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
