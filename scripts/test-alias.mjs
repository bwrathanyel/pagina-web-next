// Resuelve el alias "@/" y los imports sin extensión para correr los tests con node --test.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const root = pathToFileURL(process.cwd() + "/").href;
register("data:text/javascript," + encodeURIComponent(`
const ROOT = ${JSON.stringify(root)};
export async function resolve(s, c, n) {
  const base = s.startsWith("@/") ? new URL(s.slice(2), ROOT).href : (s.startsWith(".") && c.parentURL ? new URL(s, c.parentURL).href : null);
  if (base && !/\.(ts|tsx|js|mjs|json)$/.test(base)) for (const e of [".ts", ".tsx", "/index.ts"]) { try { return await n(base + e, c); } catch {} }
  return n(base ?? s, c);
}`));
