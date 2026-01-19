import { useEffect, useState } from "react";
import { getUser, ClientPrincipal } from "./api/auth";
import { getRequests, Request } from "./api/requests";

function App() {
  const [user, setUser] = useState<ClientPrincipal | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function loadRequests() {
    try {
      const data = await getRequests();
      setRequests(data);
      setError("");
    } catch {
      setError("Failed to load requests");
    }
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Sticky Asks</h2>
        <a href="/.auth/login/aad">Login</a>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user.userDetails}</h2>

      <button onClick={loadRequests}>
        My Requests
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {requests.map(r => (
          <li key={r.id}>
            <strong>{r.to_email}</strong> — {r.status}  
            <br />
            <small>{new Date(r.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>

      <br />
      <a href="/.auth/logout">Logout</a>
    </div>
  );
}

export default App;
