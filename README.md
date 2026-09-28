# AI Sales Intelligence

An independent portfolio MVP: upload transactional sales data, validate and store it, inspect revenue and customer metrics, segment customers, and compare a simple repeat-purchase classifier with a majority-class baseline. This is a demo with synthetic data, not a production or clinical system.

## Stack and flow

React + Vite dashboard -> FastAPI -> SQLite transaction store -> Pandas features -> scikit-learn classifier. The API returns JSON; the browser never trains models directly.

Required CSV columns: `order_id,customer_id,order_date,amount`. Dates use `YYYY-MM-DD`; amount must be positive. Re-uploading an order ID updates that order. The sample generator creates synthetic transactions spanning several months.

## Codespaces setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python generate_sample.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open a second Codespaces terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open forwarded port 5173. The frontend uses Vite's `/api` proxy to port 8000. Open `/docs` on forwarded port 8000 for Swagger. Upload `backend/sample_sales.csv` in the dashboard. No paid API or credentials are required.

Local Windows PowerShell activation: `backend\.venv\Scripts\Activate.ps1`; if activation is blocked, run `backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` and the matching Python executable for Uvicorn.

## API

| Endpoint | Purpose |
| --- | --- |
| `POST /api/upload` | CSV validation and idempotent transaction import |
| `GET /api/summary` | Orders, customers, revenue, monthly totals |
| `GET /api/segments` | Rule-based RFM segments at latest order date |
| `GET /api/model-report` | Time-based repeat-purchase experiment and baseline |

Run `cd backend && python -m pytest -q`. To test manually: `curl -F "file=@sample_sales.csv" http://localhost:8000/api/upload`.

## Model definition and limits

At each eligible monthly cutoff, features use transactions on or before the cutoff. The label is whether the customer purchases in the following calendar month. Training examples precede the final cutoff; final-cutoff examples are held out. We compare logistic regression against a majority-class baseline and show accuracy and positive-class precision/recall. Customers with no earlier purchase history at a cutoff are not included. This small synthetic demo is for explaining an end-to-end pipeline; its scores are not evidence of real-world lift. Repeat purchase is not the same as churn, and no individual customer prediction is exposed here.

RFM segmentation uses simple documented business thresholds, not K-means. `recency` is days since last order at the latest dataset date; `frequency` is total orders; `monetary` is total spend. Segment names are heuristic and should be calibrated on real data.

## Four-day interview plan

1. Run the app, upload the sample, inspect the API JSON and SQLite rows.
2. Explain validation, idempotent import, RFM and one test; add one malformed CSV case.
3. Explain the time cutoff, baseline and why random splitting can leak future behavior.
4. Record a two-minute demo and add screenshots to this README. Practice answering what you built versus what you would add next.

## Next steps

PostgreSQL, authentication, background training, model artifacts, experiment tracking, and deployment are future work. Do not claim those are implemented. Never upload employer data or personal data to this public demo.
