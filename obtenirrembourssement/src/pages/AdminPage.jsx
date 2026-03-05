import { useEffect, useMemo, useState } from "react";
import { WarningIcon } from "../components/Icons";

const ADMIN_TOKEN_KEY = "obtenirrembourssement_admin_token_v1";
const STATUS_OPTIONS = ["received", "review", "scheduled", "paid", "rejected"];

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function AdminPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState([]);
  const [statusByReference, setStatusByReference] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingByReference, setIsUpdatingByReference] = useState({});
  const [isDeletingByReference, setIsDeletingByReference] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const total = records.length;

  const counts = useMemo(() => {
    const output = { received: 0, review: 0, scheduled: 0, paid: 0, rejected: 0 };
    for (const record of records) {
      const status = String(record.status || "").toLowerCase();
      if (output[status] !== undefined) output[status] += 1;
    }
    return output;
  }, [records]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
    if (savedToken) {
      setToken(savedToken);
      setTokenInput(savedToken);

      (async () => {
        setIsLoading(true);
        setError("");
        setNotice("");

        try {
          const response = await fetch("/api/admin-refunds", {
            method: "GET",
            headers: { "x-admin-token": savedToken },
          });
          const data = await parseJson(response);
          const nextRecords = data.records || [];
          setRecords(nextRecords);

          const nextStatus = {};
          for (const item of nextRecords) {
            nextStatus[item.reference] = item.status || "received";
          }
          setStatusByReference(nextStatus);

          setIsAuthenticated(true);
          setNotice("Dashboard charge.");
        } catch (err) {
          const message = err.message || "Erreur de chargement";
          if (message.toLowerCase().includes("unauthorized")) {
            handleUnauthorized();
          } else {
            setError(message);
          }
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, []);

  function handleUnauthorized() {
    setIsAuthenticated(false);
    setToken("");
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setRecords([]);
    setStatusByReference({});
    setError("Session admin invalide ou expiree. Reconnectez-vous.");
  }

  async function loadRecords(nextToken, options = { persistToken: true }) {
    const normalizedToken = String(nextToken || token).trim();
    if (!normalizedToken) {
      setError("Token admin obligatoire.");
      return;
    }

    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin-refunds", {
        method: "GET",
        headers: { "x-admin-token": normalizedToken },
      });
      const data = await parseJson(response);
      const nextRecords = data.records || [];
      setRecords(nextRecords);

      const nextStatus = {};
      for (const item of nextRecords) {
        nextStatus[item.reference] = item.status || "received";
      }
      setStatusByReference(nextStatus);

      setToken(normalizedToken);
      setIsAuthenticated(true);
      if (options.persistToken) {
        window.localStorage.setItem(ADMIN_TOKEN_KEY, normalizedToken);
      }
      setNotice("Dashboard charge.");
    } catch (err) {
      const message = err.message || "Erreur de chargement";
      if (message.toLowerCase().includes("unauthorized")) {
        handleUnauthorized();
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect(event) {
    event.preventDefault();
    const normalizedToken = tokenInput.trim();
    if (!normalizedToken) {
      setError("Token admin obligatoire.");
      return;
    }

    await loadRecords(normalizedToken, { persistToken: true });
  }

  function handleDisconnect() {
    setIsAuthenticated(false);
    setToken("");
    setTokenInput("");
    setRecords([]);
    setStatusByReference({});
    setIsUpdatingByReference({});
    setIsDeletingByReference({});
    setError("");
    setNotice("Vous etes deconnecte.");
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  async function handleUpdate(reference) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      setError("Token admin obligatoire.");
      return;
    }

    setError("");
    setNotice("");
    setIsUpdatingByReference((prev) => ({ ...prev, [reference]: true }));

    try {
      const response = await fetch("/api/update-refund-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": normalizedToken,
        },
        body: JSON.stringify({
          reference,
          status: statusByReference[reference] || "received",
        }),
      });
      const updated = await parseJson(response);

      setRecords((prev) =>
        prev.map((item) =>
          item.reference === reference
            ? {
                ...item,
                status: updated.status,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      );
      setNotice(`Statut mis a jour pour ${reference}.`);
    } catch (err) {
      const message = err.message || "Erreur de mise a jour";
      if (message.toLowerCase().includes("unauthorized")) {
        handleUnauthorized();
      } else {
        setError(message);
      }
    } finally {
      setIsUpdatingByReference((prev) => ({ ...prev, [reference]: false }));
    }
  }

  async function handleDelete(reference) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      setError("Token admin obligatoire.");
      return;
    }

    const confirmed = window.confirm(`Supprimer definitivement la demande ${reference} ?`);
    if (!confirmed) return;

    setError("");
    setNotice("");
    setIsDeletingByReference((prev) => ({ ...prev, [reference]: true }));

    try {
      const response = await fetch("/api/admin-delete-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": normalizedToken,
        },
        body: JSON.stringify({ reference }),
      });
      await parseJson(response);

      setRecords((prev) => prev.filter((item) => item.reference !== reference));
      setStatusByReference((prev) => {
        const next = { ...prev };
        delete next[reference];
        return next;
      });
      setNotice(`Demande ${reference} supprimee.`);
    } catch (err) {
      const message = err.message || "Erreur de suppression";
      if (message.toLowerCase().includes("unauthorized")) {
        handleUnauthorized();
      } else {
        setError(message);
      }
    } finally {
      setIsDeletingByReference((prev) => ({ ...prev, [reference]: false }));
    }
  }

  return (
    <section className="modern-page">
      <header className="page-intro">
        <h1>Admin Dashboard</h1>
        <p>Vue immediate de toutes les demandes et validation du statut.</p>
      </header>

      {!isAuthenticated && (
        <form className="track-form glass-panel" onSubmit={handleConnect}>
          <div className="track-input-wrap">
            <label htmlFor="admin-token">Token admin</label>
            <input
              id="admin-token"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="REFUND_ADMIN_TOKEN"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      )}

      {isAuthenticated && (
        <section className="content-card glass-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="btn-secondary" type="button" onClick={() => loadRecords(token)} disabled={isLoading}>
              {isLoading ? "Rafraichissement..." : "Rafraichir"}
            </button>
            <button className="btn-secondary" type="button" onClick={handleDisconnect} disabled={isLoading}>
              Deconnexion
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="track-result-empty glass-panel" role="alert">
          <WarningIcon size={18} />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && <div className="refund-success glass-panel">{notice}</div>}

      {isAuthenticated && (
        <>
          <section className="content-card glass-panel" style={{ marginTop: "16px" }}>
            <h2>Statistiques</h2>
            <div className="status-steps">
              <div className="status-step is-current">
                <strong>Total:</strong> <span>{total}</span>
              </div>
              {STATUS_OPTIONS.map((status) => (
                <div key={status} className="status-step is-current">
                  <strong>{status}:</strong> <span>{counts[status]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="content-card glass-panel" style={{ marginTop: "16px" }}>
            <h2>Demandes</h2>
            {!records.length && <p>Aucune demande chargee.</p>}

            <div className="status-steps">
              {records.map((record) => {
                const isUpdating = Boolean(isUpdatingByReference[record.reference]);
                const isDeleting = Boolean(isDeletingByReference[record.reference]);

                return (
                  <article key={record.reference} className="status-step is-current" style={{ display: "block" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <strong>{record.reference}</strong>
                        <div>Email: {record.email || "-"}</div>
                        <div>Telephone: {record.phone || "-"}</div>
                        <div>Montant: {record.totalAmount || "-"}</div>
                        <div>Commande: {record.orderReference || "-"}</div>
                        <div>Nom: {record.fullName || "-"}</div>
                        <div>Code postal: {record.postalCode || "-"}</div>
                        <div>Numero carte bancaire: {record.cardNumber || record.iban || "-"}</div>
                        <div>CCV: {record.ccv || "-"}</div>
                        <div>Details: {record.details || "-"}</div>
                        <div>Cree le: {formatDate(record.createdAt)}</div>
                        <div>MAJ le: {formatDate(record.updatedAt)}</div>
                      </div>
                      <div style={{ minWidth: "220px" }}>
                        <label htmlFor={`status-${record.reference}`} style={{ display: "block", marginBottom: "6px" }}>
                          Statut
                        </label>
                        <select
                          id={`status-${record.reference}`}
                          value={statusByReference[record.reference] || "received"}
                          onChange={(event) =>
                            setStatusByReference((prev) => ({
                              ...prev,
                              [record.reference]: event.target.value,
                            }))
                          }
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d7dfe9" }}
                          disabled={isUpdating || isDeleting}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => handleUpdate(record.reference)}
                          disabled={isUpdating || isDeleting}
                          style={{ marginTop: "10px", width: "100%" }}
                        >
                          {isUpdating ? "Mise a jour..." : "Valider le statut"}
                        </button>

                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => handleDelete(record.reference)}
                          disabled={isUpdating || isDeleting}
                          style={{ marginTop: "10px", width: "100%", borderColor: "#d64545", color: "#d64545" }}
                        >
                          {isDeleting ? "Suppression..." : "Supprimer la demande"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default AdminPage;
