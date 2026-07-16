"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <div className="text-6xl select-none" aria-hidden>
        🙈
      </div>
      <h1 className="font-display text-3xl" style={{ color: "var(--plum)" }}>
        Something went wrong
      </h1>
      <p className="text-lg max-w-sm" style={{ color: "var(--ink-soft)" }}>
        A wire got crossed on our end. Try again, or head back home.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => retry()}
          className="px-6 py-3 rounded-full font-medium text-white"
          style={{ background: "var(--plum)" }}
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-3 rounded-full font-medium"
          style={{ color: "var(--ink-soft)", border: "1.5px solid var(--paper-edge)" }}
        >
          Back home
        </a>
      </div>
    </main>
  );
}
