#!/usr/bin/env bun
/**
 * Release helper: bumps the version across all manifests, commits, tags, and
 * pushes. Pushing the `v*.*.*` tag triggers the GitHub release workflow, which
 * builds the installer + updater artifacts.
 *
 *   bun run release patch   # 0.1.0 -> 0.1.1
 *   bun run release minor   # 0.1.0 -> 0.2.0
 *   bun run release major   # 0.1.0 -> 1.0.0
 *   bun run release 1.4.2   # explicit version
 */
import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (rel: string) => join(appDir, rel);

const pkgPath = p("package.json");
const confPath = p("src-tauri/tauri.conf.json");
const cargoPath = p("src-tauri/Cargo.toml");
const lockPath = p("src-tauri/Cargo.lock");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) fail("Usage: bun run release <patch|minor|major|x.y.z>");

// Refuse to release on top of unrelated uncommitted changes.
const status = (await $`git status --porcelain`.text()).trim();
if (status) fail("Working tree is dirty — commit or stash changes first.");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const current: string = pkg.version;
const m = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!m) fail(`Can't parse current version "${current}"`);
let [major, minor, patch] = m.slice(1).map(Number);

let next: string;
if (arg === "major") next = `${major + 1}.0.0`;
else if (arg === "minor") next = `${major}.${minor + 1}.0`;
else if (arg === "patch") next = `${major}.${minor}.${patch + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(arg)) next = arg;
else fail(`Invalid bump "${arg}" — use patch|minor|major or x.y.z`);

console.log(`Bumping ${current} -> ${next}`);

// package.json
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// tauri.conf.json
const conf = JSON.parse(readFileSync(confPath, "utf8"));
conf.version = next;
writeFileSync(confPath, JSON.stringify(conf, null, 2) + "\n");

// Cargo.toml — only the [package] version (first version key under [package]).
let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(
  /(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+(")/,
  `$1${next}$2`,
);
writeFileSync(cargoPath, cargo);

// Cargo.lock — the mohn package entry.
let lock = readFileSync(lockPath, "utf8");
lock = lock.replace(
  /(name = "mohn"\r?\nversion = ")[^"]+(")/,
  `$1${next}$2`,
);
writeFileSync(lockPath, lock);

const tag = `v${next}`;
await $`git add ${pkgPath} ${confPath} ${cargoPath} ${lockPath}`;
await $`git commit -m ${`release: ${tag}`}`;
await $`git tag ${tag}`;
await $`git push`;
await $`git push origin ${tag}`;

console.log(`✓ Released ${tag} — CI will build and publish the release.`);
