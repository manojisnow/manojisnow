#!/usr/bin/env node
// Picks "today's" figlet font (cycles deterministically through a curated
// list by day-of-year) and rewrites the banner <img> in README.md between
// the FIGLET marker comments. Meant to run daily via GitHub Actions —
// see .github/workflows/rotate-figlet.yml.

const fs = require("fs");
const path = require("path");

// Curated for legibility as a name banner — the full figlet catalog has 328
// fonts, most are illegible novelty fonts or symbol sets. These 28 all
// render "manojkumar" cleanly and scale fine in GitHub's markdown (images
// auto-scale to container width, so the wider 3D fonts are still safe).
const FONTS = [
  "Standard", "Slant", "Doom", "Big", "Banner", "Banner3-D", "Bloody",
  "Chunky", "Colossal", "Electronic", "Ghost", "Graffiti", "Isometric1",
  "Larry 3D", "Ogre", "Shadow", "Small Slant", "Speed", "Star Wars",
  "Sub-Zero", "Train", "ANSI Shadow", "3D-ASCII", "Rectangles", "Roman",
  "Univers", "Fire Font-k", "Delta Corps Priest 1",
];

const API_BASE = process.env.FIGLET_API_BASE || "https://your-project.vercel.app";
const TEXT = process.env.FIGLET_TEXT || "manojkumar";
const COLOR = process.env.FIGLET_COLOR || "00ff41";
const BACKGROUND = process.env.FIGLET_BACKGROUND || "0c0c0c";
const README_PATH = process.env.README_PATH || path.join(__dirname, "..", "README.md");

const START_MARKER = "<!-- FIGLET:START -->";
const END_MARKER = "<!-- FIGLET:END -->";

function dayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function main() {
  const today = new Date();
  const index = dayOfYear(today) % FONTS.length;
  const font = FONTS[index];

  const url =
    `${API_BASE}/?text=${encodeURIComponent(TEXT)}` +
    `&font=${encodeURIComponent(font)}` +
    `&color=${COLOR}&background=${BACKGROUND}`;

  const block = `${START_MARKER}\n<img src="${url}" alt="${TEXT} — today's font: ${font}" />\n${END_MARKER}`;

  const readme = fs.readFileSync(README_PATH, "utf-8");
  const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);

  if (!pattern.test(readme)) {
    console.error(
      `Could not find ${START_MARKER} / ${END_MARKER} markers in ${README_PATH}. ` +
      `Add them once around the banner image, the script only replaces what's between them.`
    );
    process.exit(1);
  }

  const updated = readme.replace(pattern, block);

  if (updated === readme) {
    console.log(`No change — today's font (${font}) matches what's already there.`);
    return;
  }

  fs.writeFileSync(README_PATH, updated);
  console.log(`Updated README.md — today's font: ${font}`);
}

main();
