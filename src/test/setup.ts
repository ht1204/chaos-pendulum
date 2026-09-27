import "@testing-library/jest-dom/vitest";
import "jest-canvas-mock";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Without globals: true, RTL cannot auto-detect the runner — clean up manually.
afterEach(cleanup);
