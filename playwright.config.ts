import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against both built targets, served with `vite preview`. Build first: `make build`.
const target = (name: 'single' | 'web', port: number) => ({
  server: {
    command: `npx vite preview --mode ${name} --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
  project: { name, use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${port}` } },
});
const single = target('single', 4173);
const web = target('web', 4174);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure', viewport: { width: 1280, height: 1000 } },
  webServer: [single.server, web.server],
  projects: [single.project, web.project],
});
