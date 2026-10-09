import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const destination = fileURLToPath(new URL("../public/data/passwords.json", import.meta.url));
const temporary = `${destination}.${process.pid}.tmp`;
const server = await createServer({
  root: projectRoot,
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: "error",
});

try {
  // Vite resolves the existing TypeScript modules and their extensionless imports.
  // This keeps the public-source fetch and normalization rules shared with Sites.
  const { fetchKkrbPasswords, fetchDeltaPasswords } = await server.ssrLoadModule("/lib/password-sources.ts");
  const { mergeSources } = await server.ssrLoadModule("/lib/password-model.ts");
  const now = new Date();
  const sources = await Promise.all([fetchKkrbPasswords(now), fetchDeltaPasswords(now)]);
  const snapshot = mergeSources(sources, new Date());
  const usable = snapshot.sources.some(source => source.status === "ready" && source.entries.some(entry => entry.code));
  if (!usable) throw new Error("两个密码来源均未取得可用记录；保留已有文件并停止本次发布。");

  await mkdir(fileURLToPath(new URL("../public/data/", import.meta.url)), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  for (const source of snapshot.sources) {
    const count = source.entries.filter(entry => entry.code).length;
    console.log(`${source.name}: ${source.status}; ${count} 条密码${source.error ? `; ${source.error}` : ""}`);
  }
  console.log(`静态密码汇总已生成：${snapshot.fetchedAt}`);
} finally {
  await unlink(temporary).catch(error => {
    if (error.code !== "ENOENT") throw error;
  });
  await server.close();
}
