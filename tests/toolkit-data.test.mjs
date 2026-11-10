import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { SCENES, TOOLS, TOOL_COUNT } from "../src/data/toolkit.js";

const logoPath = (name) => new URL(`../public/images/toolkit/${name}.svg`, import.meta.url);

test("toolkit lists 22 tools, each in exactly one scene group", () => {
  assert.equal(TOOL_COUNT, 22);
  const placed = SCENES.flatMap((s) => s.groups.flatMap((g) => g.tools));
  assert.equal(placed.length, 22);
  assert.deepEqual([...new Set(placed)].sort(), Object.keys(TOOLS).sort());
});

test("every tool has a local logo file", () => {
  for (const [id, tool] of Object.entries(TOOLS)) {
    assert.ok(tool.logo, `${id} has no logo`);
    assert.ok(existsSync(logoPath(tool.logo)), `${id} → ${tool.logo}.svg`);
  }
});

test("scene ids are unique", () => {
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
});

test("logos are vector SVGs: no embedded rasters, no remote references", () => {
  for (const { logo } of Object.values(TOOLS)) {
    const svg = readFileSync(logoPath(logo), "utf8");
    assert.match(svg, /<svg[\s>]/, `${logo}.svg is not an SVG`);
    assert.doesNotMatch(svg, /<image[\s>]|data:image\/(png|jpe?g|gif|webp)/i, `${logo}.svg embeds a raster`);
    assert.doesNotMatch(svg, /(?:href|src)=["']https?:/i, `${logo}.svg loads a remote file`);
  }
});
