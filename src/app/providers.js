'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/authContext";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
