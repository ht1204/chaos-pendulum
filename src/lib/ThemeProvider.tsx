"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { darkTokens, lightTokens, type ThemeMode, type ThemeTokens } from "./theme";

/**
 * Phase 2 — theme switching mechanism (absent in v1 plan).
 * - No explicit choice → follow prefers-color-scheme (like the original).
 * - Explicit choice → [data-theme] on <html> + localStorage persistence.
 * - An inline script in the root layout applies the stored theme before
 *   hydration to avoid a flash.
 */
type Explicit = ThemeMode | null;

interface ThemeContextValue {
  /** Resolved mode: explicit choice, else system preference. */
  mode: ThemeMode;
  explicit: Explicit;
  setMode: (mode: ThemeMode) => void;
  useSystem: () => void;
  toggle: () => void;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "cp-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [explicit, setExplicit] = useState<Explicit>(null);
  const [system, setSystem] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setExplicit(stored);
    } catch {
      /* storage unavailable (private mode) — fall back to system */
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystem(mq.matches ? "light" : "dark");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const mode: ThemeMode = explicit ?? system;

  useEffect(() => {
    const root = document.documentElement;
    if (explicit) root.dataset.theme = explicit;
    else delete root.dataset.theme;
    try {
      if (explicit) window.localStorage.setItem(STORAGE_KEY, explicit);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [explicit]);

  const tokens = mode === "dark" ? darkTokens : lightTokens;

  const toggle = useCallback(() => {
    setExplicit(mode === "dark" ? "light" : "dark");
  }, [mode]);

  const useSystem = useCallback(() => setExplicit(null), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, explicit, setMode: setExplicit, useSystem, toggle, tokens }),
    [mode, explicit, useSystem, toggle, tokens]
  );

  const styledTheme = useMemo(
    () => ({
      ...tokens,
      mode,
      fontSans: "'Inter', system-ui, sans-serif",
      fontMono: "'JetBrains Mono', ui-monospace, monospace",
    }),
    [tokens, mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={styledTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
