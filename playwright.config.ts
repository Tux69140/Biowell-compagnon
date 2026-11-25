import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const browserCacheDir =
  process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(process.env.HOME ?? "", ".cache", "ms-playwright");

const resolveBrowserExecutable = (
  dirPrefix: string,
  candidates: string[][]
): string | undefined => {
  if (!browserCacheDir) return undefined;
  if (!existsSync(browserCacheDir)) return undefined;
  const entries = readdirSync(browserCacheDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(dirPrefix))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  for (const entry of entries) {
    for (const candidate of candidates) {
      const executable = join(browserCacheDir, entry, ...candidate);
      if (existsSync(executable)) return executable;
    }
  }
  return undefined;
};

const chromiumExecutable = resolveBrowserExecutable("chromium", [
  ["chrome-linux64", "chrome"],
  ["chrome-linux", "chrome"],
  ["chrome-linux", "headless_shell"],
]);
const firefoxExecutable = resolveBrowserExecutable("firefox", [["firefox", "firefox"]]);

const fileModeLaunchArgs = ["--allow-file-access-from-files"];

const withExecutable = (executablePath?: string) =>
  executablePath ? { launchOptions: { executablePath, args: fileModeLaunchArgs } } : {};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...withExecutable(chromiumExecutable) },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        ...withExecutable(firefoxExecutable),
      },
    },
  ],
});
