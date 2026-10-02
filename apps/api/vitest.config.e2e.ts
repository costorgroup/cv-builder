import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // The same settings as the server (.env), against the real database.
    setupFiles: ['dotenv/config'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
