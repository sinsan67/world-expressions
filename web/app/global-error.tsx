"use client"; // Error boundaries must be Client Components

// Only triggers if the root layout itself crashes — globals.css/fonts from
// layout.tsx aren't guaranteed to be loaded here, so this stays dependency-free.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          gap: 16,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 56 }} aria-hidden>🙈</div>
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: 16, color: "#666", maxWidth: 340, margin: 0 }}>
          A wire got crossed on our end. Try again, or head back home.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={() => retry()}
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              border: "none",
              background: "#6b3fa0",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              border: "1.5px solid #ddd",
              color: "#555",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Back home
          </a>
        </div>
      </body>
    </html>
  );
}
