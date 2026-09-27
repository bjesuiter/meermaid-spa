import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

const commitHash = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" }).trim();

export default defineConfig({
  base: "/meermaid-spa/",
  define: {
    __GIT_COMMIT__: JSON.stringify(commitHash),
  },
  plugins: [solid()],
});
