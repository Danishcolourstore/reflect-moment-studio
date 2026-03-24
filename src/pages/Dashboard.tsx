import React, { useState } from "react";

const Dashboard = () => {
  const [events] = useState<any[]>([]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fff", padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>MirrorAI Studio</h1>
          <p style={{ color: "#aaa", fontSize: 12 }}>Manage your weddings and galleries</p>
        </div>

        <button
          style={{
            background: "#c8a97e",
            color: "#000",
            border: "none",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          + Create Wedding
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        {[
          { label: "Events", value: 0 },
          { label: "Photos", value: 0 },
          { label: "Albums", value: 0 },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "#111",
              padding: 20,
              borderRadius: 12,
              border: "1px solid #222",
            }}
          >
            <p style={{ color: "#888", fontSize: 12 }}>{item.label}</p>
            <h2 style={{ fontSize: 22, marginTop: 5 }}>{item.value}</h2>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {events.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 100 }}>
          <h2>Start your first wedding</h2>
          <p style={{ color: "#aaa" }}>Create Event → Upload Photos → Share</p>

          <button
            style={{
              marginTop: 20,
              background: "#c8a97e",
              color: "#000",
              border: "none",
              padding: "12px 30px",
              cursor: "pointer",
            }}
          >
            Create Wedding
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
