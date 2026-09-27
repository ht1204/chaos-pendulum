"use client";

import React from "react";
import styled, { css } from "styled-components";

/**
 * Phase 3 — Button. Style port of .btn / .btn.primary (index.html:154–178)
 * with an added :focus-visible ring (WCAG 2.4.7).
 */
const StyledButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 8px 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface2);
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  &:hover {
    background: var(--border);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  & svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  ${(props) =>
    props.$primary &&
    css`
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;

      &:hover {
        background: var(--accent);
        opacity: 0.85;
      }
    `}
`;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean;
}

export function Button({ primary, type = "button", ...rest }: ButtonProps) {
  return <StyledButton $primary={primary} type={type} {...rest} />;
}
