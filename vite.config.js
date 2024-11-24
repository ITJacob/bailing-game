import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const base = mode === "production" ? "/bailing-game/" : "/";

  return {
    base,
  };
});
