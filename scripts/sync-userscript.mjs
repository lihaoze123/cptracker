import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const extensionDistDir = path.join(rootDir, "extension", "dist");
const publicDir = path.join(rootDir, "public");
const publicScriptPath = path.join(publicDir, "cptracker-import.user.js");

async function main() {
  const files = await readdir(extensionDistDir);
  const userscriptFiles = files.filter((file) => file.endsWith(".user.js"));

  if (userscriptFiles.length === 0) {
    throw new Error(`No userscript build output found in ${extensionDistDir}`);
  }

  if (userscriptFiles.length > 1) {
    throw new Error(
      `Expected exactly one userscript build output in ${extensionDistDir}, found: ${userscriptFiles.join(", ")}`
    );
  }

  await mkdir(publicDir, { recursive: true });
  await copyFile(path.join(extensionDistDir, userscriptFiles[0]), publicScriptPath);
}

await main();
