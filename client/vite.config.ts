import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/src")
    },
  },

  server: {
    proxy: {
      "/game": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/player": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/scenarios": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});