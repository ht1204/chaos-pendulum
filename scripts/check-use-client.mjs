#!/usr/bin/env node
/**
 * AGENTS.v2.md — architecture decision guard:
 * every module under src/ that imports styled-components must be a client
 * component ("use client" directive in its first line). Resolved v1 finding #3.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    const content = readFileSync(full, "utf8");
    if (/from ["']styled-components["']|require\(["']styled-components["']\)/.test(content)) {
      const head = content.slice(0, 200);
      if (!head.startsWith('"use client"') && !head.startsWith("'use client'")) {
        failures.push(full);
      }
    }
  }
}

walk(SRC);

if (failures.length > 0) {
  console.error("[check-use-client] Missing \"use client\" in styled-components files:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("[check-use-client] OK");
