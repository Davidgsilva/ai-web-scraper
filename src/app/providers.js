'use client';

import { SessionProvider } from "next-auth/react";
import SessionPersistence from "@/components/SessionPersistence";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window regains focus
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionPersistence />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
