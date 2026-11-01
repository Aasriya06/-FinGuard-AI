import React, { useState } from "react";
import { FileText, Download, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import "./Reports.css";

function Reports({ transactions = [] }) {
  const [downloadSuccess, setDownloadSuccess] = useState("");

  const suspiciousCount = transactions.filter(
    (tx) => tx.riskLevel === "High" || tx.riskLevel === "Medium" || (Number(tx.riskScore) || 0) >= 30
  ).length;

  const handleExport = (format) => {
    setSelectedFormat(format);
    const dataStr =
      format === "JSON"
        ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2))
        : "data:text/csv;charset=utf-8," +
          encodeURIComponent(
            ["Transaction ID,Sender,Receiver,Amount,Type,Risk Score,Risk Level,Status"]
              .concat(
                transactions.map(
                  (t) =>
                    `"${t.transactionId}","${t.sender}","${t.receiver}",${t.amount},"${t.transactionType}",${t.riskScore},"${t.riskLevel}","${t.status}"`
                )
              )
              .join("\n")
          );

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `finguard_report_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(`Successfully exported ${transactions.length} records as ${format}`);
    setTimeout(() => setDownloadSuccess(""), 4000);
  };

  return (
    <div className="reports-container">
      <div className="reports-header-card">
        <div>
          <h2>Audit & Compliance Reports</h2>
          <p className="reports-subtitle">
            Generate and export regulatory compliance dossiers and fraud risk evaluations.
          </p>
        </div>
        <div className="reports-actions">
          <button className="export-btn export-csv" onClick={() => handleExport("CSV")}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="export-btn export-json" onClick={() => handleExport("JSON")}>
            <Download size={15} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="export-alert-banner">
          <CheckCircle2 size={18} color="#10B981" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-card-icon icon-purple">
            <FileText size={22} color="#A855F7" />
          </div>
          <div className="report-card-content">
            <h3>Transaction Ledger Summary</h3>
            <p>Comprehensive transaction log including full counterparties and classification.</p>
            <div className="report-meta">
              <span>{transactions.length} Total Records</span>
              <span className="dot">•</span>
              <span>Updated Real-Time</span>
            </div>
            <button className="card-action-btn" onClick={() => handleExport("CSV")}>
              Download Dossier
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon icon-red">
            <AlertTriangle size={22} color="#EF4444" />
          </div>
          <div className="report-card-content">
            <h3>Suspicious Activity Report (SAR)</h3>
            <p>Export flags for transactions exceeding risk threshold (Score ≥ 30/100).</p>
            <div className="report-meta">
              <span className="highlight-red">{suspiciousCount} Flagged Incidents</span>
              <span className="dot">•</span>
              <span>High / Medium Tiers</span>
            </div>
            <button className="card-action-btn btn-red" onClick={() => handleExport("CSV")}>
              Download SAR Package
            </button>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon icon-green">
            <ShieldCheck size={22} color="#10B981" />
          </div>
          <div className="report-card-content">
            <h3>Deterministic Engine Verification</h3>
            <p>Audit trail of UTC heuristic scoring parameters, limits, and rules.</p>
            <div className="report-meta">
              <span className="highlight-green">Deterministic (Capped 100)</span>
              <span className="dot">•</span>
              <span>Rule-Based</span>
            </div>
            <button className="card-action-btn" onClick={() => handleExport("JSON")}>
              Export Engine JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
