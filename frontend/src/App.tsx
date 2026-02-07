import { useEffect, useState } from "react";
import { getUser } from "./api/auth";
import { getMyRequests, getSentRequests } from "./api/requests";
import { ClientPrincipal, Request } from "./types";
import { RequestList, CreateRequestForm, UserStats } from "./components";
import "./App.css";

type TabType = "received" | "sent";

function App() {
  const [user, setUser] = useState<ClientPrincipal | null>(null);
  const [loading, setLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("received");
  const [error, setError] = useState("");

  useEffect(() => {
    getUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      loadAllRequests();
    }
  }, [user]);

  async function loadAllRequests() {
    try {
      setError("");
      const [received, sent] = await Promise.all([
        getMyRequests(),
        getSentRequests()
      ]);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    }
  }

  async function loadSentRequests() {
    try {
      const data = await getSentRequests();
      setSentRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <div className="container login-container">
          <h1>📌 Sticky Asks</h1>
          <p className="tagline">Track tasks and requests between teams</p>
          <a href="/.auth/login/aad" className="btn btn-primary btn-large">
            Login with Microsoft
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📌 Sticky Asks</h1>
        <div className="user-info">
          <span className="user-email">{user.userDetails}</span>
          <a href="/.auth/logout" className="btn btn-logout">Logout</a>
        </div>
      </header>

      <main className="container">
        <UserStats />

        <div className="create-section">
          <CreateRequestForm onRequestCreated={loadSentRequests} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="tabs">
          <button
            className={`tab ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            className={`tab ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent ({sentRequests.length})
          </button>
          <button className="btn btn-refresh" onClick={loadAllRequests}>
            ↻ Refresh
          </button>
        </div>

        {activeTab === "received" && (
          <RequestList
            requests={receivedRequests}
            userEmail={user.userDetails}
            title="Requests Assigned to You"
            emptyMessage="No requests assigned to you yet."
            onRequestClosed={loadAllRequests}
          />
        )}

        {activeTab === "sent" && (
          <RequestList
            requests={sentRequests}
            userEmail={user.userDetails}
            title="Requests You Sent"
            emptyMessage="You haven't sent any requests yet."
            onRequestClosed={loadAllRequests}
          />
        )}
      </main>
    </div>
  );
}

export default App;

