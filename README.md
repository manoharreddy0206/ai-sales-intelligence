# AI Sales Intelligence

A full-stack portfolio prototype for validating sales transactions, exploring customer behavior, and evaluating a repeat-purchase model. The included data is synthetic. This project demonstrates an engineering workflow; it is not a production prediction service.

## What it does

- Upload a CSV containing `order_id`, `customer_id`, `order_date`, and `amount`.
- Validate the complete file before saving any rows.
- Store transactions in SQLite. Re-uploading an existing order ID updates that order instead of double counting it.
- Display revenue by month, order and customer totals, and customer segments in a React dashboard.
- Evaluate a repeat-purchase classifier against a majority-class baseline using a time-based holdout.

## Architecture

```text
CSV upload
   ↓
FastAPI validation and import
   ↓
SQLite orders
   ├── Summary API → React revenue dashboard
   ├── RFM rules → React customer segments
   └── Monthly features → scikit-learn evaluation → React model report
```

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite | Upload and display results |
| API | FastAPI | Validate requests and return JSON |
| Storage | SQLite | Store orders by unique order ID |
| Analysis | Pandas | Prepare historical customer features |
| ML | scikit-learn | Compare logistic regression with a baseline |
| Verification | Pytest | Check invalid uploads and repeat uploads |

## Run in GitHub Codespaces

Use **Python 3.12** for the backend. From the repository root:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If Ubuntu says `ensurepip` is unavailable while creating the environment, install its Python 3.12 venv package and repeat the environment creation:

```bash
sudo apt-get update
sudo apt-get install -y python3.12-venv
```

Open a second terminal and run:

```bash
cd /workspaces/ai-sales-intelligence/frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open forwarded port **5173** for the dashboard and port **8000** with `/docs` for the API documentation. Upload `backend/sample_sales.csv` in the dashboard. If the browser file picker cannot access Codespaces files, download the sample CSV from the VS Code Explorer first, then select the downloaded copy.

## Sample result

The included synthetic CSV contains **269 orders from 60 customers**. After uploading it, the dashboard shows **54,233.70 in total transaction amount**, monthly revenue, customer segments, and a model evaluation. The amount has no assigned currency in this demo.

## CSV format

```csv
order_id,customer_id,order_date,amount
ORD-0001,C001,2025-01-10,125.50
ORD-0002,C002,2025-01-11,80.00
```

Dates must use `YYYY-MM-DD`, and amounts must be positive. The API rejects an invalid file with a message identifying the CSV line. The maximum upload size is 2 MB.

## API

| Method | Endpoint | Result |
| --- | --- | --- |
| POST | `/api/upload` | Validate and import a CSV |
| GET | `/api/summary` | Revenue, orders, customers, monthly totals |
| GET | `/api/segments` | Customer RFM values and segment counts |
| GET | `/api/model-report` | Baseline and classifier evaluation |

The API documentation is available at `http://localhost:8000/docs` when running locally, or through the forwarded port in Codespaces.

## Segmentation and model evaluation

**Segmentation:** Recency is the number of days since a customer's last order, frequency is their order count, and monetary value is total spend. Customers whose last order was more than 60 days ago are marked **At risk**. Recently active customers with at least four orders are **Loyal**; the remaining customers are **Active**. These are transparent business rules, not a trained clustering model.

**Prediction experiment:** At each monthly cutoff, features use only orders recorded by that date. The label records whether the customer purchases in the following month. Earlier cutoffs provide training examples, and the final eligible cutoff is held out for evaluation. Logistic regression is compared with a majority-class baseline using accuracy, precision, and recall.

The model report measures performance only on synthetic demo data. It does not establish real-world predictive value. “Purchase next month” is also distinct from a formal churn definition.

## Verification

From `backend`, run:

```bash
python -m pytest -q
```

The test checks that uploading the same order twice does not double count it and that a file containing an invalid row is rejected without importing its valid rows.

## Current scope

This is an independent portfolio prototype. SQLite, synthetic data, rule-based segmentation, and an on-request evaluation endpoint keep the example easy to run. Authentication, PostgreSQL, background jobs, saved model versions, drift monitoring, and cloud deployment would be separate production work.