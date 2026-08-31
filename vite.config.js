import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Bind to all network interfaces so other devices on the LAN can reach
  // the dev server (e.g. http://<your-machine-ip>:5173). Port is fixed
  // (not auto-bumped) so the tunnel script always targets the right port.
  // API calls are proxied to the backend so only this one port needs to be
  // exposed (LAN or via the dev:tunnel script) — no CORS or second tunnel needed.
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // The Cloudflare quick tunnel (dev:tunnel script) fronts this server with a
    // random *.trycloudflare.com host each run, which Vite's Host-header check
    // would otherwise reject as an unrecognized host.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
