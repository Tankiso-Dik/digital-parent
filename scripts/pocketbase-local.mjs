import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import extract from "extract-zip";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match || match[1].startsWith("#")) continue;

    const [, key, rawValue = ""] = match;
    if (process.env[key] !== undefined) continue;

    const value = rawValue
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2")
      .replace(/\\n/g, "\n");
    process.env[key] = value;
  }
}

loadEnvFile(resolve(rootDir, ".env"));
loadEnvFile(resolve(rootDir, ".env.local"));

const localDir = resolve(
  rootDir,
  process.env.PB_LOCAL_DIR || ".local-pocketbase",
);
const dataDir = resolve(process.env.PB_DATA_DIR || join(localDir, "pb_data"));
const pocketbaseVersion = process.env.POCKETBASE_VERSION || "0.32.0";
const pocketbaseUrl =
  process.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";
const adminEmail =
  process.env.PB_ADMIN_EMAIL || "admin@digital-parent.local";
const adminPassword =
  process.env.PB_ADMIN_PASSWORD || "digital-parent-admin-123";
const command = process.argv[2] || "setup";

function binaryPath() {
  if (process.env.PB_BIN) return resolve(process.env.PB_BIN);
  return join(
    localDir,
    process.platform === "win32" ? "pocketbase.exe" : "pocketbase",
  );
}

function releaseTarget() {
  const os = {
    darwin: "darwin",
    linux: "linux",
    win32: "windows",
  }[process.platform];
  const arch = {
    arm64: "arm64",
    x64: "amd64",
  }[process.arch];

  if (!os || !arch) {
    throw new Error(
      `Unsupported PocketBase platform: ${process.platform}/${process.arch}`,
    );
  }

  return `${os}_${arch}`;
}

function downloadUrl() {
  const target = releaseTarget();
  return [
    "https://github.com/pocketbase/pocketbase/releases/download",
    `v${pocketbaseVersion}`,
    `pocketbase_${pocketbaseVersion}_${target}.zip`,
  ].join("/");
}

function serverAddress() {
  const url = new URL(pocketbaseUrl);
  const host =
    url.hostname === "localhost" || url.hostname === "127.0.0.1"
      ? "127.0.0.1"
      : url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");

  return `${host}:${port}`;
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

async function downloadFile(url, destination) {
  console.log(`Downloading PocketBase ${pocketbaseVersion}...`);
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download ${url}: HTTP ${response.status}`);
  }

  try {
    await pipeline(response.body, createWriteStream(destination));
  } catch (error) {
    rmSync(destination, { force: true });
    throw error;
  }
}

async function extractZip(zipPath) {
  await extract(zipPath, { dir: localDir });
}

async function ensureBinary() {
  const pbBin = binaryPath();
  if (existsSync(pbBin)) return pbBin;

  mkdirSync(localDir, { recursive: true });
  const zipPath = join(localDir, `pocketbase-${pocketbaseVersion}.zip`);

  await downloadFile(downloadUrl(), zipPath);
  await extractZip(zipPath);
  rmSync(zipPath, { force: true });

  if (process.platform !== "win32") {
    chmodSync(pbBin, 0o755);
  }

  return pbBin;
}

function upsertSuperuser(pbBin) {
  mkdirSync(dataDir, { recursive: true });
  run(pbBin, [
    "superuser",
    "upsert",
    adminEmail,
    adminPassword,
    `--dir=${dataDir}`,
  ]);
}

async function isServerReady() {
  try {
    const response = await fetch(`${pocketbaseUrl}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(server) {
  let output = "";
  server.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });

  const started = Date.now();
  while (Date.now() - started < 15_000) {
    if (server.exitCode !== null) {
      throw new Error(
        ["PocketBase exited before it was ready.", output.trim()]
          .filter(Boolean)
          .join("\n"),
      );
    }
    if (await isServerReady()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for PocketBase at ${pocketbaseUrl}`);
}

function startPocketBase(pbBin, stdio = "inherit") {
  mkdirSync(dataDir, { recursive: true });
  return spawn(
    pbBin,
    [
      "serve",
      `--http=${serverAddress()}`,
      `--dir=${dataDir}`,
      `--migrationsDir=${join(dataDir, "pb_migrations")}`,
      "--automigrate=false",
    ],
    {
      cwd: rootDir,
      stdio,
    },
  );
}

async function stopPocketBase(server) {
  if (!server || server.exitCode !== null) return;
  const stopped = new Promise((resolveStop) => {
    server.once("exit", resolveStop);
  });
  server.kill("SIGTERM");
  await stopped;
}

async function runSchemaSetup(env = {}) {
  run(process.execPath, ["scripts/setup-pocketbase-dev.mjs"], {
    env: {
      ...process.env,
      VITE_POCKETBASE_URL: pocketbaseUrl,
      PB_ADMIN_EMAIL: adminEmail,
      PB_ADMIN_PASSWORD: adminPassword,
      ...env,
    },
  });
}

async function setup() {
  const pbBin = await ensureBinary();
  let server = null;
  const serverAlreadyRunning = await isServerReady();

  if (serverAlreadyRunning) {
    console.log(`Using running PocketBase at ${pocketbaseUrl}`);
  } else {
    upsertSuperuser(pbBin);
    server = startPocketBase(pbBin, "pipe");
    await waitForServer(server);
  }

  try {
    await runSchemaSetup();
  } finally {
    await stopPocketBase(server);
  }

  return serverAlreadyRunning;
}

async function serve() {
  const pbBin = await ensureBinary();
  upsertSuperuser(pbBin);
  const server = startPocketBase(pbBin);

  server.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function dev() {
  const serverAlreadyRunning = await setup();
  const pbBin = await ensureBinary();
  const pbServer = serverAlreadyRunning ? null : startPocketBase(pbBin);
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const viteServer = spawn(npmCmd, ["run", "dev"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  let stopping = false;
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    pbServer?.kill("SIGTERM");
    viteServer.kill("SIGTERM");
    process.exit(code);
  };

  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));
  pbServer?.on("exit", (code) => stop(code ?? 0));
  viteServer.on("exit", (code) => stop(code ?? 0));
}

if (command === "install") {
  await ensureBinary();
} else if (command === "setup") {
  await setup();
} else if (command === "serve") {
  await serve();
} else if (command === "dev") {
  await dev();
} else {
  console.error(`Unknown PocketBase command: ${command}`);
  process.exit(1);
}
