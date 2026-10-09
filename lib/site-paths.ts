/// <reference types="vite/client" />
// Vite supplies "/" for Sites and the repository prefix for GitHub Pages.
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const sitePath = (path: string) => path.startsWith("/") ? base + path : path;
export const passwordUrl = import.meta.env.VITE_PAGES_STATIC_PASSWORDS
  ? sitePath("/data/passwords.json")
  : sitePath("/api/passwords");
