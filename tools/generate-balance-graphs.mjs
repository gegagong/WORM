import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(toolsDirectory, "..");
const source = fs.readFileSync(path.join(rootDirectory, "game.js"), "utf8");
const outputDirectory = path.join(rootDirectory, "reports");

function requiredMatch(pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not read ${label} from game.js`);
  return match;
}

function frozenObjectBody(name) {
  return requiredMatch(
    new RegExp(`const ${name} = Object\\.freeze\\(\\{([\\s\\S]*?)\\n  \\}\\);`),
    name,
  )[1];
}

function numericProperty(body, name) {
  const match = body.match(new RegExp(`\\b${name}:\\s*([0-9.]+)`));
  if (!match) throw new Error(`Could not read ${name} property from game.js`);
  return Number(match[1]);
}

const growthRules = frozenObjectBody("GROWTH_RULES");
const combatRules = frozenObjectBody("COMBAT_RULES");
const initialGrowthCost = numericProperty(growthRules, "initialCost");
const growthCostMultiplier = numericProperty(growthRules, "costMultiplier");
const baseBiteDamage = numericProperty(combatRules, "baseBiteDamage");
const biteDamagePerLevel = numericProperty(combatRules, "biteDamagePerLevel");
const maximumLevel = Number(
  requiredMatch(
    /const DEV_WORM_LEVEL_MAX = ([0-9]+);/,
    "developer worm level maximum",
  )[1],
);
const roundPointLimit = Number(
  requiredMatch(
    /const ROUND_POINT_LIMIT = ([0-9]+);/,
    "round point limit",
  )[1],
);

const enemyDefinitionsBody = requiredMatch(
  /const ENEMY_DEFINITIONS = Object\.freeze\(\{([\s\S]*?)\n  \}\);\n  const ROUND_POINT_LIMIT/,
  "enemy definitions",
)[1];
const enemyPattern = /\[ENEMY_TYPES\.([A-Z_]+)\]: Object\.freeze\(\{\s*label: "([^"]+)",\s*score: ([0-9.]+),\s*health: ([0-9.]+)/g;
const enemies = [];
for (const match of enemyDefinitionsBody.matchAll(enemyPattern)) {
  const [, kind, label, points, health] = match;
  if (kind === "MEAT") continue;
  enemies.push({
    kind,
    label,
    points: Number(points),
    health: Number(health),
  });
}
if (enemies.length === 0) {
  throw new Error("No enemy definitions were parsed from game.js");
}

const levels = [];
let cumulativePoints = 0;
for (let level = 0; level <= maximumLevel; level += 1) {
  const nextLevelCost = Math.ceil(
    initialGrowthCost * growthCostMultiplier ** level,
  );
  levels.push({
    level,
    nextLevelCost,
    cumulativePoints,
    biteStrength: baseBiteDamage * biteDamagePerLevel ** level,
  });
  cumulativePoints += nextLevelCost;
}

const naturalMaximumLevel = levels.reduce(
  (maximum, entry) =>
    entry.cumulativePoints <= roundPointLimit ? entry.level : maximum,
  0,
);

enemies.forEach((enemy) => {
  enemy.biteMatchLevel = Math.max(
    0,
    Math.ceil(
      Math.log(enemy.health / baseBiteDamage) /
        Math.log(biteDamagePerLevel) -
        1e-12,
    ),
  );
});
enemies.sort(
  (first, second) =>
    first.biteMatchLevel - second.biteMatchLevel ||
    first.health - second.health ||
    first.label.localeCompare(second.label),
);

const width = 1600;
const height = 1200;
const wormPlot = { x: 105, y: 190, width: 1380, height: 355 };
const enemyPlot = { x: 105, y: 790, width: 1380, height: 245 };
const colors = {
  background: "#090d14",
  panel: "#111824",
  panelBorder: "#263448",
  grid: "#263448",
  text: "#eef4ff",
  muted: "#9cabc0",
  cost: "#ffb347",
  cumulative: "#ff5e68",
  bite: "#63d7ff",
  cap: "#b98cff",
  hp: "#63d7ff",
  points: "#ff9f43",
};

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function compactNumber(value) {
  const absolute = Math.abs(value);
  const units = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [threshold, suffix] of units) {
    if (absolute >= threshold) {
      const scaled = value / threshold;
      const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
      return `${scaled.toFixed(digits).replace(/\.0+$|(?<=\.[0-9])0+$/, "")}${suffix}`;
    }
  }
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.0+$|(?<=\.[0-9])0+$/, "");
}

const formatInteger = (value) => Math.round(value).toLocaleString("en-US");
const maximumGraphValue = Math.max(
  ...levels.flatMap((entry) => [
    entry.nextLevelCost,
    entry.cumulativePoints,
    entry.biteStrength,
  ]),
);
const logMinimum = 0;
const logMaximum = Math.ceil(Math.log10(maximumGraphValue));
const wormX = (level) =>
  wormPlot.x + (level / maximumLevel) * wormPlot.width;
const wormY = (value) =>
  wormPlot.y +
  wormPlot.height *
    (1 - (Math.log10(Math.max(1, value)) - logMinimum) / (logMaximum - logMinimum));
const enemyY = (value) =>
  enemyPlot.y + enemyPlot.height * (1 - value / 220);

function linePath(entries, valueSelector, skipZero = false) {
  return entries
    .filter((entry) => !skipZero || valueSelector(entry) > 0)
    .map(
      (entry, index) =>
        `${index === 0 ? "M" : "L"}${wormX(entry.level).toFixed(2)},${wormY(
          valueSelector(entry),
        ).toFixed(2)}`,
    )
    .join(" ");
}

const svg = [];
const add = (markup) => svg.push(markup);
const text = (x, y, value, className = "", extra = "") =>
  add(
    `<text x="${x}" y="${y}" class="${className}" ${extra}>${escapeXml(
      value,
    )}</text>`,
  );

add(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">`);
add(`<title id="title">WORM progression and enemy balance graphs</title>`);
add(`<desc id="description">Worm level point requirements and bite strength from level zero through one hundred, plus enemy health and point values with bite-match worm levels.</desc>`);
add(`<style>
  text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${colors.text}; }
  .title { font-size: 32px; font-weight: 800; letter-spacing: 0.4px; }
  .section { font-size: 22px; font-weight: 750; }
  .subtitle { font-size: 14px; fill: ${colors.muted}; }
  .axis { font-size: 12px; fill: ${colors.muted}; }
  .legend { font-size: 13px; font-weight: 650; }
  .value { font-size: 12px; font-weight: 750; }
  .enemy { font-size: 14px; font-weight: 750; }
  .badge { font-size: 12px; font-weight: 650; fill: ${colors.muted}; }
  .footer { font-size: 12px; fill: ${colors.muted}; }
</style>`);
add(`<rect width="${width}" height="${height}" fill="${colors.background}"/>`);
add(`<rect x="40" y="90" width="1520" height="525" rx="18" fill="${colors.panel}" stroke="${colors.panelBorder}"/>`);
add(`<rect x="40" y="650" width="1520" height="490" rx="18" fill="${colors.panel}" stroke="${colors.panelBorder}"/>`);

text(55, 55, "WORM · CURRENT BALANCE CURVES", "title");
text(70, 130, "Worm progression · levels 0–100", "section");
text(
  70,
  158,
  `Next-level cost = ceil(${initialGrowthCost} × ${growthCostMultiplier}^level) · Bite = ${baseBiteDamage} × ${biteDamagePerLevel}^level · logarithmic value axis`,
  "subtitle",
);

for (let power = logMinimum; power <= logMaximum; power += 1) {
  const value = 10 ** power;
  const y = wormY(value);
  add(`<line x1="${wormPlot.x}" y1="${y}" x2="${wormPlot.x + wormPlot.width}" y2="${y}" stroke="${colors.grid}" stroke-width="1"/>`);
  text(wormPlot.x - 14, y + 4, compactNumber(value), "axis", 'text-anchor="end"');
}
for (let level = 0; level <= maximumLevel; level += 10) {
  const x = wormX(level);
  add(`<line x1="${x}" y1="${wormPlot.y}" x2="${x}" y2="${wormPlot.y + wormPlot.height}" stroke="${colors.grid}" stroke-width="1" opacity="0.55"/>`);
  text(x, wormPlot.y + wormPlot.height + 25, level, "axis", 'text-anchor="middle"');
}
text(wormPlot.x + wormPlot.width / 2, 593, "Worm level", "axis", 'text-anchor="middle"');

const capX = wormX(naturalMaximumLevel);
add(`<line x1="${capX}" y1="${wormPlot.y}" x2="${capX}" y2="${wormPlot.y + wormPlot.height}" stroke="${colors.cap}" stroke-width="2" stroke-dasharray="8 7"/>`);
add(`<rect x="${capX - 97}" y="${wormPlot.y + 10}" width="194" height="42" rx="8" fill="#1e1730" stroke="${colors.cap}"/>`);
text(capX, wormPlot.y + 28, `${compactNumber(roundPointLimit)} round ceiling`, "value", 'text-anchor="middle"');
text(capX, wormPlot.y + 44, `natural maximum: level ${naturalMaximumLevel}`, "axis", 'text-anchor="middle"');

const series = [
  {
    label: "Points to next level",
    color: colors.cost,
    selector: (entry) => entry.nextLevelCost,
    skipZero: false,
  },
  {
    label: "Cumulative points to reach level",
    color: colors.cumulative,
    selector: (entry) => entry.cumulativePoints,
    skipZero: true,
  },
  {
    label: "Bite strength",
    color: colors.bite,
    selector: (entry) => entry.biteStrength,
    skipZero: false,
  },
];

series.forEach((item) => {
  add(`<path d="${linePath(levels, item.selector, item.skipZero)}" fill="none" stroke="${item.color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`);
  levels
    .filter((entry) => entry.level % 10 === 0 && (!item.skipZero || item.selector(entry) > 0))
    .forEach((entry) => {
      add(`<circle cx="${wormX(entry.level)}" cy="${wormY(item.selector(entry))}" r="3.5" fill="${colors.panel}" stroke="${item.color}" stroke-width="2"/>`);
    });
});

let legendX = 770;
series.forEach((item) => {
  add(`<line x1="${legendX}" y1="125" x2="${legendX + 25}" y2="125" stroke="${item.color}" stroke-width="4" stroke-linecap="round"/>`);
  text(legendX + 34, 130, item.label, "legend");
  legendX += item.label.length * 8 + 82;
});
const finalLevel = levels[levels.length - 1];
text(
  1475,
  wormY(finalLevel.cumulativePoints) - 8,
  `L${maximumLevel}: ${compactNumber(finalLevel.cumulativePoints)} cumulative`,
  "value",
  `text-anchor="end" fill="${colors.cumulative}"`,
);
text(
  1475,
  wormY(finalLevel.nextLevelCost) + 18,
  `L${maximumLevel}: ${compactNumber(finalLevel.nextLevelCost)} next-level cost`,
  "value",
  `text-anchor="end" fill="${colors.cost}"`,
);
text(
  1475,
  wormY(finalLevel.biteStrength) - 8,
  `L${maximumLevel}: ${compactNumber(finalLevel.biteStrength)} bite`,
  "value",
  `text-anchor="end" fill="${colors.bite}"`,
);

text(70, 695, "Enemy HP and point value", "section");
text(
  70,
  723,
  "The game has no enemy-level stat. “Bite-match L#” is the first worm level whose bite strength is at least that enemy’s HP.",
  "subtitle",
);

for (let value = 0; value <= 200; value += 50) {
  const y = enemyY(value);
  add(`<line x1="${enemyPlot.x}" y1="${y}" x2="${enemyPlot.x + enemyPlot.width}" y2="${y}" stroke="${colors.grid}" stroke-width="1"/>`);
  text(enemyPlot.x - 14, y + 4, value, "axis", 'text-anchor="end"');
}

const groupWidth = enemyPlot.width / enemies.length;
const barWidth = 58;
enemies.forEach((enemy, index) => {
  const centerX = enemyPlot.x + groupWidth * (index + 0.5);
  const hpX = centerX - barWidth - 5;
  const pointX = centerX + 5;
  const hpY = enemyY(enemy.health);
  const pointY = enemyY(enemy.points);
  add(`<rect x="${hpX}" y="${hpY}" width="${barWidth}" height="${enemyPlot.y + enemyPlot.height - hpY}" rx="5" fill="${colors.hp}"/>`);
  add(`<rect x="${pointX}" y="${pointY}" width="${barWidth}" height="${enemyPlot.y + enemyPlot.height - pointY}" rx="5" fill="${colors.points}"/>`);
  text(hpX + barWidth / 2, hpY - 9, formatInteger(enemy.health), "value", `text-anchor="middle" fill="${colors.hp}"`);
  text(pointX + barWidth / 2, pointY - 9, formatInteger(enemy.points), "value", `text-anchor="middle" fill="${colors.points}"`);
  text(centerX, enemyPlot.y + enemyPlot.height + 28, enemy.label, "enemy", 'text-anchor="middle"');
  text(centerX, enemyPlot.y + enemyPlot.height + 49, `Bite-match L${enemy.biteMatchLevel}`, "badge", 'text-anchor="middle"');
});

add(`<rect x="112" y="1099" width="13" height="13" rx="3" fill="${colors.hp}"/>`);
text(133, 1110, "HP", "legend");
add(`<rect x="184" y="1099" width="13" height="13" rx="3" fill="${colors.points}"/>`);
text(205, 1110, "Point value", "legend");
text(
  1540,
  1176,
  `Generated from game.js · ${levels.length} worm levels · ${enemies.length} enemy types · values current at generation time`,
  "footer",
  'text-anchor="end"',
);
add("</svg>");

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, "balance-graphs.svg"),
  `${svg.join("\n")}\n`,
);
fs.writeFileSync(
  path.join(outputDirectory, "worm-progression.csv"),
  [
    "worm_level,points_to_next_level,cumulative_points_to_reach_level,bite_strength",
    ...levels.map((entry) =>
      [
        entry.level,
        entry.nextLevelCost,
        entry.cumulativePoints,
        entry.biteStrength,
      ].join(","),
    ),
  ].join("\n") + "\n",
);
fs.writeFileSync(
  path.join(outputDirectory, "enemy-balance.csv"),
  [
    "enemy,hp,point_value,bite_match_worm_level",
    ...enemies.map((enemy) =>
      [enemy.label, enemy.health, enemy.points, enemy.biteMatchLevel].join(","),
    ),
  ].join("\n") + "\n",
);

console.log(
  `Generated reports/balance-graphs.svg and CSV data from levels 0–${maximumLevel}.`,
);
