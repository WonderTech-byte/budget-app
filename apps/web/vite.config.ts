import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const apiTarget = (process.env.VITE_API_URL ?? "https://bugdet-maker-production.up.railway.app").replace(/\/$/, "")

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on(
            "proxyRes",
            (proxyRes: {
              headers: Record<string, string | string[] | undefined>
            }) => {
              proxyRes.headers["Access-Control-Allow-Credentials"] = "true"
            }
          )
        },
      },
    },
  },
})
