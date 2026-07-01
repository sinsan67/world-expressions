"use client";

export default function OfflinePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <div className="text-6xl select-none" aria-hidden>
        🌐
      </div>
      <h1
        className="font-display text-3xl"
        style={{ color: "var(--plum)" }}
      >
        You&apos;re offline
      </h1>
      <p className="text-lg max-w-sm" style={{ color: "var(--ink-soft)" }}>
        No connection right now. Come back when you&apos;re online — every
        language&apos;s madness will still be here.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-3 rounded-full font-medium text-white"
        style={{ background: "var(--plum)" }}
      >
        Try again
      </button>
    </main>
  );
}
