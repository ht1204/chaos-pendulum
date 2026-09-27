// Runs BEFORE setup.ts (setupFiles order). jest-canvas-mock reads the Jest
// global at import time, so the stub must exist before it loads.
import { vi } from "vitest";

Object.defineProperty(globalThis, "jest", {
  value: {
    fn: (impl?: (...args: unknown[]) => unknown) =>
      impl ? vi.fn(impl) : vi.fn(),
    spyOn: vi.spyOn,
    isMockFunction: (fn: unknown) => !!fn && typeof fn === "function" && "_isMockFunction" in fn && (fn as { _isMockFunction?: boolean })._isMockFunction === true,
  },
  writable: true,
  configurable: true,
});
