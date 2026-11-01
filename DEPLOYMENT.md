# FinGuard AI - Production Deployment & Migration Guide

FinGuard AI is a full-stack financial monitoring, fraud detection, and case investigation platform built with React 19 + Vite (Frontend) and Node.js + Express (Backend) backed by MongoDB Atlas.

---

## Architecture Overview

* **Frontend:** React 19 + Vite SPA (Client-side rendered) deployed on **Vercel**
* **Backend:** Node.js Express REST API deployed on **Render** (Free Tier)
* **Database:** MongoDB Atlas (Replica Set / M0 Shared Tier: `FinGuardCluster`, database: `test`)
* **Core API Endpoints:**
  * Health check: `GET /api/health`
  * Transactions: `GET, POST, PUT, DELETE /api/transactions`
  * Investigations: `GET, POST, PUT /api/investigations`
  * Admin Risk Preview (Protected): `GET /api/admin/risk-preview`
  * Admin Backup Collection (Protected): `POST /api/admin/backup`
  * Admin Recalculate Risk (Protected, Dry-run / Confirmed): `POST /api/admin/recalculate-risk`

---

## 1. Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express HTTP server | `5001` (assigned by cloud host) |
| `MONGO_URI` | Full MongoDB connection string | `mongodb+srv://<username>:<password>@<cluster-host>/test?retryWrites=true&w=majority` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS (comma-separated) | `https://finguard-ai-orpin.vercel.app,https://finguard-ai.vercel.app` |
| `RISK_PREVIEW_TOKEN` | Secret authorization token for admin migration/preview endpoints | High-entropy random hex or UUID |

### Frontend (`/frontend/.env` or Platform Settings)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of deployed backend | `https://finguard-ai-backend-bw7f.onrender.com` |

---

## 2. Security & CORS Configuration

The backend enforces a strict origin allowlist. Requests from origins outside this allowlist are denied with a `403 Forbidden` response.

Allowed origins:
* `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4173`
* `http://127.0.0.1:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:4173`
* `https://finguard-ai-orpin.vercel.app`, `https://finguard-ai.vercel.app`
* Any custom origins defined in `process.env.CLIENT_URL`
* Non-browser requests (e.g., server health checks, curl) without an `Origin` header

---

## 3. Database Backup & Safe Migration Procedure

### Pre-Migration Database Backup
Before applying changes to existing production records:
1. An exact JSON snapshot is created and preserved in `backend/production-backup-20261101.json` (git-ignored for security).
2. A separate backup collection within MongoDB Atlas (`transactions_backup_<timestamp>`) can be generated via the protected endpoint:
   ```bash
   curl -X POST https://finguard-ai-backend-bw7f.onrender.com/api/admin/backup \
     -H "X-Risk-Preview-Token: <RISK_PREVIEW_TOKEN>"
   ```
3. Verify that all 6 records and their attributes (`_id`, `transactionId`, `amount`, `status`, `createdAt`, `isFraudulent`) are completely preserved.

### Dry-Run Verification
Preview the recalculations without writing to the database:
```bash
curl -X POST "https://finguard-ai-backend-bw7f.onrender.com/api/admin/recalculate-risk" \
  -H "X-Risk-Preview-Token: <RISK_PREVIEW_TOKEN>"
```

### Applying Migration (Requires Explicit Confirmation)
Only after explicit user approval, targeted updates to `riskScore`, `riskLevel`, and `reasons` can be applied:
```bash
curl -X POST "https://finguard-ai-backend-bw7f.onrender.com/api/admin/recalculate-risk?confirm=true" \
  -H "X-Risk-Preview-Token: <RISK_PREVIEW_TOKEN>"
```
*Note: This operation modifies ONLY `riskScore`, `riskLevel`, and `reasons`. Transaction IDs, amounts, dates, counterparties, statuses, fraud flags, and investigation records remain completely untouched.*

---

## 4. Local Development

### Starting Backend:
```bash
cd backend
npm install
npm test      # Verify all 29 automated tests pass
npm run dev   # Runs on http://localhost:5001
```

### Starting Frontend:
```bash
cd frontend
npm install
npm run lint  # Verify code quality
npm run build # Verify production bundle creation
npm run dev   # Runs on http://localhost:5173
```
