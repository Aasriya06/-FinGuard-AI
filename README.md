# FinGuard AI

**FinGuard AI** is an enterprise-grade financial transaction fraud detection, risk analytics, and case investigation management platform built with the MERN stack (MongoDB Atlas, Express.js, React 19, Node.js).

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          React 19 + Vite (SPA)         │
                      │  - Dashboard & Risk Visualization      │
                      │  - Transaction CRUD & Filter Engine    │
                      │  - Heuristic Trigger Inspection        │
                      │  - Case Investigation Audit Workflow   │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / REST API
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Node.js Express API           │
                      │  - Strict CORS Allowlist Enforcement   │
                      │  - Model Validation & Error Sanitizer  │
                      │  - Deterministic Fraud Engine (UTC)    │
                      │  - Safe Migration & Backup Controls    │
                      └──────────────────┬─────────────────────┘
                                         │ Mongoose 9 (TLS)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │             MongoDB Atlas              │
                      │  - Collections: transactions,          │
                      │    investigations                      │
                      └────────────────────────────────────────┘
```

---

## Core Features Across 5 Dedicated Modules

1. **Operations Dashboard (`Dashboard`)**:
   - Real-time aggregation of transaction count, total monetary volume, average risk scores, and alert tallies.
   - Live visual Risk Tier Distribution bar (Low, Medium, High).
   - High-priority active Fraud Alerts panel with direct investigation linkage.
   - Recent transaction audit feed and backend connectivity monitor.

2. **Transaction Management (`Transactions`)**:
   - Full CRUD operations: Create, view list, inspect full details, edit attributes, and delete with cascade safety.
   - Comprehensive multi-attribute filtering (by Risk Level, Payment Type, and Settlement Status).
   - Instant in-memory search across Transaction IDs, sender names, and recipient names.
   - Currency formatting in Indian Rupee (₹) and colored risk badges.

3. **Fraud Detection Engine (`Fraud Detection`)**:
   - Real-time heuristic scoring based on strict transaction parameters.
   - Clear architectural distinction between **Potentially Suspicious** (algorithmic risk score ≥ 30) and **Confirmed Fraud** (`isFraudulent: true`).
   - Detailed Heuristic Factor Inspector detailing why points were added.
   - Queue filtering across Suspicious, High Risk, Medium Risk, Confirmed Fraud, and All records.

4. **Risk Analytics (`Risk Analytics`)**:
   - Interactive Recharts data visualizations:
     - Donut / Pie distribution of risk tiers.
     - Payment method volume breakdown (UPI, Bank Transfer, Card, Wallet).
     - Multi-axis comparison of transaction amounts vs. computed risk scores.
   - High-risk ratio calculations and volume metrics.

5. **Case Investigations (`Investigations`)**:
   - Full investigative audit lifecycle: Open, In Progress, Resolved.
   - Priority classification: Low, Medium, High.
   - Case notes documentation and findings logger.
   - Graceful resilience against missing or deleted transaction references.

---

## Fraud Scoring Heuristics & Rules

FinGuard AI evaluates risk scores on a deterministic scale from **0 to 100 points**:

| Heuristic Trigger | Condition | Score Increment | Reason Generated |
| :--- | :--- | :---: | :--- |
| **Rule 1: High Amount** | Amount > ₹50,000 | **+30 pts** | `"High transaction amount"` |
| **Rule 2: Very High Amount** | Amount > ₹100,000 | **+20 pts** | `"Very high transaction amount"` |
| **Rule 3: Unusual Hours** | Timestamp between 00:00 and 05:00 UTC | **+15 pts** | `"Transaction during unusual hours"` |

*Note: Amount > ₹100,000 triggers both Rule 1 and Rule 2, totaling +50 points.*

### Risk Classifications
- **Low Risk:** 0 to 29 points (Green)
- **Medium Risk:** 30 to 59 points (Amber / Orange)
- **High Risk:** 60 to 100 points (Red)

### Suspicious Transactions Definition
Across all modules and reports, **Suspicious Transactions** are formally defined as transactions classified as **Medium Risk (30–59) + High Risk (60–100)**, corresponding to any transaction with a **Risk Score ≥ 30**.

---

## Local Development & Setup

### Prerequisites
- Node.js (v18.x or higher; tested on v24)
- npm (v9.x or higher)
- MongoDB Atlas cluster or local MongoDB instance

### 1. Environment Variables Configuration

Create a `.env` file in `/backend/.env`:
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/test?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173,https://finguard-ai-orpin.vercel.app
RISK_PREVIEW_TOKEN=your_secure_preview_token_here
```

Create a `.env` file in `/frontend/.env` (optional for local dev, defaults to `http://localhost:5001`):
```env
VITE_API_URL=http://localhost:5001
```

### 2. Starting the Backend
```bash
cd backend
npm install
npm run dev    # Starts with nodemon, or 'npm start'
```
Backend runs on `http://localhost:5001`.
Health check: `http://localhost:5001/api/health`

### 3. Starting the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## Automated Testing & Validation

FinGuard AI utilizes Node's native test runner (`node:test` and `node:assert/strict`) for backend verification and Vite + Oxlint for frontend verification:

```bash
# Run backend automated test suite (29 tests)
cd backend
npm test

# Run frontend linting
cd frontend
npm run lint

# Run frontend production build validation
cd frontend
npm run build
```

---

## Production Deployment Overview

- **Frontend:** Deployed on **Vercel** (`https://finguard-ai-orpin.vercel.app`)
- **Backend:** Deployed on **Render** (`https://finguard-ai-backend-bw7f.onrender.com`)
- **Database:** **MongoDB Atlas** (Cluster: `FinGuardCluster`, DB: `test`)
- **Security:**
  - CORS strictly configured to reject unauthorized third-party origins.
  - Administrative endpoints require timing-safe header authorization (`X-Risk-Preview-Token`).
  - Production error handler sanitizes internal database and stack trace details.
