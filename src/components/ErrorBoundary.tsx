import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("Page error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: 32,
              fontStyle: "italic",
              color: "var(--text-primary)",
            }}
          >
            Something went wrong
          </p>
          <p
            style={{
              fontFamily: "Jost",
              fontSize: 14,
              color: "var(--text-muted)",
              marginTop: 8,
            }}
          >
            Please refresh and try again
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              height: 44,
              padding: "0 28px",
              background: "#C4A882",
              color: "#1C1815",
              border: "none",
              borderRadius: 8,
              fontFamily: "Jost",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
