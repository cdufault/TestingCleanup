import { resolve } from "node:path";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import * as packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      insertTypesEntry: true,
      include: ["src/component/"],
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve("src", "component/index.ts"),
      name: "ReactWidgetLib",
      formats: ["es"],
      fileName: () => `react-widget-lib.js`,
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        /^@arcgis.*/,
        "/node_modules/",
        "moment-timezone",
      ],
    },
  },
});
