# FinGuard AI - Production Deployment Guide

FinGuard AI is a full-stack financial monitoring and fraud detection platform built with React + Vite (Frontend) and Node.js + Express (Backend) backed by MongoDB Atlas.

---

## Architecture Overview

* **Frontend:** React 19 + Vite SPA (Client-side rendered)
* **Backend:** Node.js Express REST API
* **Database:** MongoDB Atlas (Replica Set / M0 Shared Tier)
* **API Endpoints:**
  * Health check: `GET /api/health`
  * Transactions: `GET, POST, PUT, DELETE /api/transactions`
  * Investigations: `GET, POST, PUT /api/investigations`

---

## 1. Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express HTTP server | `5001` (assigned by cloud host) |
| `MONGO_URI` | Full MongoDB connection string | `mongodb+srv://<username>:<password>@<cluster-host>/test?retryWrites=true&w=majority` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS | `https://finguard-ai.vercel.app` |

### Frontend (`/frontend/.env` or Platform Settings)
| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of deployed backend | `https://finguard-backend.onrender.com` |

---

## 2. Deploying the Backend (e.g. Render / Railway)

### On Render (Web Service):
1. Create a **New Web Service** connected to your Git repository.
2. Configure settings:
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/api/health`
3. Add Environment Variables:
   * `MONGO_URI`: `your_mongodb_atlas_connection_string`
   * `CLIENT_URL`: `https://your-frontend-domain.vercel.app`
4. Deploy Service.

---

## 3. Deploying the Frontend (e.g. Vercel / Netlify)

### On Vercel:
1. Import your Git repository.
2. Set **Root Directory** to `frontend`.
3. Build Settings:
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Add Environment Variable:
   * `VITE_API_URL`: URL of your deployed backend (e.g., `https://finguard-backend.onrender.com`).
5. Deploy.

---

## 4. Local Development

### Starting Backend:
```bash
cd backend
npm install
npm run dev # or npm start
```
Backend runs on `http://localhost:5001`.

### Starting Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
