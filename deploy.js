#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readdirSync, readFileSync as readFile, statSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { Client } from "ssh2";

// === CONFIGURATION ===
const SERVER = "root@joe-bor.me";
const REMOTE_PATH = "/var/www/familyhub";
const URL = "https://familyhub.joe-bor.me";

// Load config from package.json
const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const VERSION = pkg.version;
const RELEASE_TAG = `family-hub-v${VERSION}`;

// === UTILITIES ===

const run = (cmd, options = {}) => {
  console.log(`$ ${cmd}`);
  return execSync(cmd, {
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });
};

const sh = (cmd) => run(cmd, { shell: true });

const info = (msg) => console.log(`ℹ ${msg}`);
const ok = (msg) => console.log(`✓ ${msg}`);
const err = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

// HTTP health check (works on Windows without curl)
const checkStatus = (url) =>
  new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      resolve(res.statusCode);
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });

// Recursively upload a local directory to a remote path via SFTP
const uploadRecursive = (sftp, localDir, remoteDir) => {
  const entries = readdirSync(localDir);
  const jobs = [];

  for (const entry of entries) {
    const localPath = `${localDir}/${entry}`;
    const remotePath = `${remoteDir}/${entry}`;
    const stat = statSync(localPath);

    if (stat.isDirectory()) {
      jobs.push(
        new Promise((res) => {
          sftp.mkdir(remotePath, (e) => {
            if (e && e.code !== 2)
              console.warn(`mkdir ${remotePath}: ${e.message}`);
            res();
          });
        }).then(() => uploadRecursive(sftp, localPath, remotePath)),
      );
    } else {
      jobs.push(
        new Promise((res, rej) => {
          sftp.fastPut(localPath, remotePath, (e) => (e ? rej(e) : res()));
        }),
      );
    }
  }

  return Promise.all(jobs);
};

// Recursively delete a remote directory and its contents via SFTP
const deleteRecursive = (sftp, remoteDir) =>
  new Promise((resolve) => {
    sftp.readdir(remoteDir, (err, list) => {
      if (err) return resolve(); // dir doesn't exist or empty

      const jobs = list.map((item) => {
        const fullPath = `${remoteDir}/${item.filename}`;
        if (item.attrs.isDirectory()) {
          return deleteRecursive(sftp, fullPath).then(
            () =>
              new Promise((res) =>
                sftp.rmdir(fullPath, (e) => (e ? res() : res())),
              ),
          );
        } else {
          return new Promise((res) =>
            sftp.unlink(fullPath, (e) => (e ? res() : res())),
          );
        }
      });

      Promise.all(jobs).then(resolve);
    });
  });

// === PRE-DEPLOY CHECKS ===

// 1. Clean working tree?
info("Checking working tree...");
const gitStatus = sh("git status --porcelain");
if (gitStatus.trim()) {
  err(`Working tree is dirty. Commit or stash changes first.\n${gitStatus}`);
}

// 2. On main branch?
info("Checking branch...");
const branch = sh("git branch --show-current").trim();
if (branch !== "main") {
  err(`Must deploy from main branch (currently on '${branch}').`);
}

// 3. Synced with remote?
info("Checking sync with origin/main...");
sh("git fetch origin main --quiet");
sh("git fetch origin --tags --quiet");
const localCommit = sh("git rev-parse HEAD").trim();
const remoteCommit = sh("git rev-parse origin/main").trim();
if (localCommit !== remoteCommit) {
  err(
    `Local main is not in sync with origin/main. Pull or push first.\nLocal: ${localCommit}\nRemote: ${remoteCommit}`,
  );
}

// 4. Released FE commit?
info(`Checking release tag ${RELEASE_TAG}...`);
const tagExists = sh(
  `git rev-parse -q --verify "refs/tags/${RELEASE_TAG}" 2>/dev/null`,
).trim();
if (!tagExists) {
  err(
    `Required release tag '${RELEASE_TAG}' does not exist.\n  Merge the FE release PR before deploying.`,
  );
}

const tagCommit = sh(`git rev-list -n 1 "${RELEASE_TAG}"`).trim();
if (localCommit !== tagCommit) {
  err(
    `Current commit is not the released FE commit for ${RELEASE_TAG}.\n  Current HEAD: ${localCommit}\n  Release tag:  ${tagCommit}\n  Deploy only from the released FE commit on main.`,
  );
}

// 5. Lint
info("Running lint...");
run("npm run lint");

// 6. Tests
info("Running tests...");
run("npm test -- --run");

// === BUILD & DEPLOY ===
ok(`Building ${RELEASE_TAG}...`);
run("npm run build");

ok(`Deploying to ${SERVER}...`);

// Connect via SSH using ssh2 (cross-platform, no scp/rsync needed)
// Works with SSH agent on all platforms, or fallback to ~/.ssh/id_rsa
const homedir = process.env.HOME || process.env.USERPROFILE;
const connectOpts = {
  host: SERVER.split("@")[1],
  port: 22,
  username: SERVER.split("@")[0],
};

if (process.env.SSH_AUTH_SOCK) {
  connectOpts.agent = process.env.SSH_AUTH_SOCK;
} else if (homedir) {
  const keyPath = `${homedir}/.ssh/id_rsa`;
  try {
    connectOpts.privateKey = readFile(keyPath);
  } catch (e) {
    err(`Failed to read SSH key at ${keyPath}: ${e.message}`);
  }
}

await new Promise((resolve, reject) => {
  const conn = new Client();

  conn.on("ready", () => {
    ok("Connected via SSH");

    conn.sftp((err, sftp) => {
      if (err) return reject(err);

      // Clear old dist contents (simulates rsync --delete)
      deleteRecursive(sftp, REMOTE_PATH)
        .then(() => {
          info("Uploading dist/...");
          return uploadRecursive(sftp, "./dist", REMOTE_PATH);
        })
        .then(() => {
          ok("Files uploaded");
          conn.end();
          resolve();
        })
        .catch(reject);
    });
  });

  conn.on("error", (e) => {
    console.error(`SSH error: ${e.message}`);
    reject(e);
  });

  conn.connect(connectOpts);
});

ok("Verifying deployment...");
await new Promise((r) => setTimeout(r, 2000));

const status = await checkStatus(URL);
if (status === 200) {
  ok(`Deploy successful! ${RELEASE_TAG} is live at ${URL}`);
} else {
  err(`Warning: Site returned HTTP ${status}`);
}
