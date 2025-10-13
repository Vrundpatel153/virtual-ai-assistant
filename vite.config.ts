import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig, type PluginOption } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react()];
  if (mode === "development") {
    try {
      const mod = await import("lovable-tagger");
      if (mod && typeof mod.componentTagger === "function") {
        plugins.push(mod.componentTagger());
      }
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
