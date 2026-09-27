
export type ThemeMode = "dark" | "light";

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  accentGlow: string;
  accent2: string;
  good: string;
  warn: string;
  sliderThumb: string;
}

export const darkTokens: ThemeTokens = {
  bg: "#0a0a0f",
  surface: "#111118",
  surface2: "#1a1a24",
  border: "#2a2a38",
  text: "#e8e8f0",
  textDim: "#7a7a9a",
  textMuted: "#44445a",
  accent: "#5b8dee",
  accentGlow: "rgba(91, 141, 238, 0.18)",
  accent2: "#c084fc",
  good: "#34d399",
  warn: "#f59e0b",
  sliderThumb: "#5b8dee",
};

export const lightTokens: ThemeTokens = {
  bg: "#f0f0f8",
  surface: "#ffffff",
  surface2: "#e8e8f4",
  border: "#d0d0e0",
  text: "#1a1a2e",
  textDim: "#5a5a7a",
  textMuted: "#aaaacc",
  accent: "#5b8dee",
  accentGlow: "rgba(91, 141, 238, 0.12)",
  accent2: "#c084fc",
  good: "#34d399",
  warn: "#f59e0b",
  sliderThumb: "#5b8dee",
};

/** The 7 preset trail colors from index.html:458–464. */
export const TRAIL_COLORS = [
  "#5b8dee",
  "#c084fc",
  "#34d399",
  "#f97316",
  "#f43f5e",
  "#fbbf24",
  "#ffffff",
] as const;

export type TrailColor = (typeof TRAIL_COLORS)[number];
