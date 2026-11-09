import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" + HashRouter means the build works at any GitHub Pages path
// (https://you.github.io/<any-repo-name>/) without extra config.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
