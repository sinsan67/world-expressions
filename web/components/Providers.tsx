"use client";

import { SessionProvider } from "next-auth/react";
import { UILangProvider } from "@/lib/UILangContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UILangProvider>{children}</UILangProvider>
    </SessionProvider>
  );
}
