import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

export default defineConfig({
  base: "/meermaid-spa/",
  plugins: [solid()],
});
