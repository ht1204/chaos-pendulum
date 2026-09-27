"use client";

import { createGlobalStyle, css } from "styled-components";

/**
 * Global design tokens as CSS custom properties.
 * Selector strategy is a verbatim port of index.html:5–41:
 *   - :root defaults are dark
 *   - system-preference light applies only when no explicit [data-theme="dark"]
 *   - explicit [data-theme="light"] always wins
 */
const tokenVars = css`
  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a24;
    --border: #2a2a38;
    --text: #e8e8f0;
    --text-dim: #7a7a9a;
    --text-muted: #44445a;
    --accent: #5b8dee;
    --accent-glow: rgba(91, 141, 238, 0.18);
    --accent2: #c084fc;
    --good: #34d399;
    --warn: #f59e0b;
    --slider-thumb: #5b8dee;
  }

  @media (prefers-color-scheme: light) {
    :root:not([data-theme="dark"]) {
      --bg: #f0f0f8;
      --surface: #ffffff;
      --surface2: #e8e8f4;
      --border: #d0d0e0;
      --text: #1a1a2e;
      --text-dim: #5a5a7a;
      --text-muted: #aaaacc;
      --accent-glow: rgba(91, 141, 238, 0.12);
    }
  }

  :root[data-theme="light"] {
    --bg: #f0f0f8;
    --surface: #ffffff;
    --surface2: #e8e8f4;
    --border: #d0d0e0;
    --text: #1a1a2e;
    --text-dim: #5a5a7a;
    --text-muted: #aaaacc;
    --accent-glow: rgba(91, 141, 238, 0.12);
  }
`;

export const GlobalStyle = createGlobalStyle`
  ${tokenVars}

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    overflow: hidden;
  }
`;
