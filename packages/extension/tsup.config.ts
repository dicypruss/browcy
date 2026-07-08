import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    background: "src/background.ts",
    content: "src/content.ts",
    popup: "src/popup.ts"
  },
  format: ["iife"],
  outExtension() {
    return {
      js: `.js`,
    }
  },
  dts: false,
  sourcemap: false,
  clean: true,
  noExternal: [/(.*)/], // bundle all dependencies
});
