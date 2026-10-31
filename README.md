# FinGuard AI

**FinGuard AI** is a real-time financial monitoring, fraud detection, and risk analytics application built with the MERN stack.

## Key Features

* **Real-Time Financial Dashboard:** High-level metrics for transaction volume, average risk scores, and alerts.
* **Transaction Management:** Full CRUD operations on financial transactions with automated risk scoring.
* **AI Fraud Detection:** Real-time heuristic and algorithmic risk classification (Low, Medium, High).
* **Risk Analytics:** Visual risk breakdown by transaction type and status with interactive Recharts visualizations.
* **Case Investigations:** Workflow management for suspicious and flagged transactions.

## Tech Stack

* **Frontend:** React 19, Vite, Recharts, Lucide Icons, Axios
* **Backend:** Node.js, Express 5, Mongoose 9, CORS, Dotenv
* **Database:** MongoDB Atlas

## Project Structure

```
FinGuard-AI/
├── backend/
│   ├── models/            # Mongoose Transaction & Investigation schemas
│   ├── routes/            # Express route handlers
│   ├── services/          # Fraud detection algorithm
│   ├── .env.example       # Backend environment template
│   ├── package.json       # Node package manifest
│   └── server.js          # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # Transactions, FraudDetection, RiskAnalytics, Investigations
│   │   ├── config/        # Centralized API configuration
│   │   ├── App.jsx        # Dashboard layout & routing
│   │   └── main.jsx       # React DOM root
│   ├── .env.example       # Frontend environment template
│   ├── package.json       # Frontend package manifest
│   └── vite.config.js     # Vite configuration
└── DEPLOYMENT.md          # Production deployment guide
```

## Getting Started

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment and local development setup instructions.
