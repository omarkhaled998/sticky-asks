import { useEffect, useState } from "react";
import { getUser } from "./api/auth";
import { getMyRequests, getSentRequests } from "./api/requests";
import { ClientPrincipal, Request } from "./types";
import { RequestList, CreateRequestForm, UserStats, SpecialPrompt } from "./components";
import "./App.css";

// Special prompt configuration
const SPECIAL_PROMPT_EMAILS = [
  "smsaahk@gmail.com",
  "omarsaad@microsoft.com",
];

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

  // Check if this user should see the special prompt
  const showSpecialPrompt = SPECIAL_PROMPT_EMAILS.some(
    email => user?.userDetails?.toLowerCase() === email.toLowerCase()
  );

  if (showSpecialPrompt && user) {
    return <SpecialPrompt userEmail={user.userDetails} />;
  }

  if (!user) {
    return (
      <div className="app">
        <div className="container login-container">
          <h1>🤝 BuddyTask</h1>
          <p className="tagline">Track tasks and requests between teams</p>
          <a href="/.auth/login/aad" className="btn btn-primary btn-large btn-login">
            <svg className="login-icon" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <span>Login with Microsoft</span>
          </a>
          <a href="/.auth/login/google?post_login_redirect_uri=/" className="btn btn-secondary btn-large btn-login" style={{ marginTop: '1rem' }}>
            <svg className="login-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Login with Google</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤝 BuddyTask</h1>
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

