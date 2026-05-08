import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    file: "src/file.ts",
    folder: "src/folder.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
});
