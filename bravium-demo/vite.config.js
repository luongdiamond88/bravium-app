import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Bravium AI",
        short_name: "Bravium",
        description: "AI Robot • Proof of Earn",
        id: "ai.bravium.app",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#000a1f",
        theme_color: "#00ffc6",
        lang: "en",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: "./",
  server: {
    host: "0.0.0.0", // Cho phép truy cập từ ngoài
    port: 5173, // Cổng mặc định
    strictPort: false, // ✅ Cho phép tự chọn port khác nếu bị trùng
    allowedHosts: [".replit.dev", ".repl.co"],
    historyApiFallback: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
