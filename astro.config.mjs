import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

const site = process.env.SITE ?? "https://check.unbeholden.dev";

export default defineConfig({
  site,
  output: "server",
  server: { port: 38572 },
  adapter: node({ mode: "standalone" }),
  security: { allowedDomains: [{ hostname: new URL(site).hostname }] },
  vite: { define: { "import.meta.env.ROOT": JSON.stringify(fileURLToPath(new URL(".", import.meta.url))) } },
});
