import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const repositoryBase = owner && repository && repository.toLowerCase() !== `${owner.toLowerCase()}.github.io`
  ? `/${repository}/`
  : "/";
const configuredBase = process.env.PAGES_BASE_PATH ?? repositoryBase;
const base = configuredBase.replace(/^\/+|\/+$/g, "");

export default defineConfig({
  root: fileURLToPath(new URL("./github-pages", import.meta.url)),
  base: base ? `/${base}/` : "/",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  resolve: { alias: { "@": projectRoot } },
  define: { "import.meta.env.VITE_PAGES_STATIC_PASSWORDS": "true" },
  css: { postcss: projectRoot },
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
