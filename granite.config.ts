import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "clueroom-toss-miniapp",
  brand: {
    displayName: "ClueRoom",
    primaryColor: "#38BDF8",
    icon: "/app_icon.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
