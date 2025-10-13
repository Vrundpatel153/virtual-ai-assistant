import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];
  if (mode === "development") {
    try {
      const mod = await import("lovable-tagger");
      if (mod?.componentTagger) plugins.push(mod.componentTagger());
    } catch (e) {
      // optional dev plugin not installed; ignore
    }
  }

  return {
    plugins,
    base: "./",
    server: {
      host: "::",
      port: 8080,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      postcss: {
        plugins: [tailwind()],
      },
    },
  };
});
