import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicitly define environment variables for build
  define: {
    // This ensures VITE_API_BASE_URL is available at build time
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL
    ),
  },
});
