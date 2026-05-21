import Link from "next/link";

export const metadata = {
  title: "Instagram — World Expressions",
};

export default function InstagramPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: "1.5rem", opacity: 0.7 }}
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="#7c3aed" stroke="none" />
      </svg>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#1f2937",
          marginBottom: "0.75rem",
        }}
      >
        Notre compte Instagram arrive bientôt
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "#6b7280",
          maxWidth: 380,
          lineHeight: 1.7,
          marginBottom: "2rem",
        }}
      >
        Des expressions du monde entier, des curiosités linguistiques et des
        moments de culture partagée — tout ça en images.
      </p>

      <a
        href="mailto:worldsexpressions@proton.me"
        style={{
          fontSize: "0.875rem",
          color: "#7c3aed",
          textDecoration: "none",
          borderBottom: "1px solid #c4b5fd",
          paddingBottom: "2px",
          marginBottom: "2rem",
        }}
      >
        worldsexpressions@proton.me
      </a>

      <Link
        href="/"
        style={{
          fontSize: "0.875rem",
          color: "#9ca3af",
          textDecoration: "none",
        }}
      >
        ← Retour à World Expressions
      </Link>
    </div>
  );
}
