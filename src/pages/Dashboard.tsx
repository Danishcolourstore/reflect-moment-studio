limport { useState } from "react";

const Dashboard = () => {
  const [events] = useState([]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>MirrorAI Studio</h1>
          <p style={{ color: "#aaa", fontSize: 12 }}>
            Manage your weddings and galleries
          </p>
        </div>

        <button style={{
          background: "#c8a97e",
          color: "#000",
          border: "none",
          padding: "10px 20px",
          cursor: "pointer"
        }}>
          + Create Wedding
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div>Events: 0</div>
        <div>Photos: 0</div>
        <div>Albums: 0</div>
      </div>

      {/* EMPTY STATE */}
      {events.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 100 }}>
          <h2>Start your first wedding</h2>
          <p style={{ color: "#aaa" }}>
            Create Event → Upload Photos → Share
          </p>

          <button style={{
            marginTop: 20,
            background: "#c8a97e",
            color: "#000",
            border: "none",
            padding: "12px 30px",
            cursor: "pointer"
          }}>
            Create Wedding
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;