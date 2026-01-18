import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  // Check login status
  useEffect(() => {
    fetch("/.auth/me", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data.clientPrincipal) {
          setUser(data.clientPrincipal.userDetails);
        }
      });
  }, []);

  // Fetch requests for logged-in user
  const loadRequests = () => {
    fetch("/api/getRequests", {
      credentials: "same-origin"
    })
      .then(res => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setRequests)
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Sticky Asks</h1>

      {!user && (
        <a href="/.auth/login/aad">Login</a>
      )}

      {user && (
        <>
          <p>Logged in as <b>{user}</b></p>
          <a href="/.auth/logout">Logout</a>
          <br /><br />
          <button onClick={loadRequests}>Load My Requests</button>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {requests.map(r => (
          <li key={r.id}>
            Request ID: {r.id}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
