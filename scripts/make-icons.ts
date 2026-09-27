// Renders the app icons from the design system's Logo mark (bundle.js), so the
// icon is the mark exactly. Re-run after a design-system bump:
//   npx tsx scripts/make-icons.ts
// Output is committed under public/icons/.
import { writeFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import type * as DaybookComponents from "../design/components/index";
import { colour, resolveVars } from "./design-tokens";

// bundle.js is a browser script that reads window.React and sets window.Daybook.
const host = globalThis as unknown as {
  window: { React: typeof React; Daybook?: typeof DaybookComponents };
};
host.window = { React };
const bundle = "../design/components/bundle.js";
await import(bundle);
const { Logo } = host.window.Daybook!;

const markup = renderToStaticMarkup(React.createElement(Logo, { variant: "mark", size: 48 }));
const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(markup)?.[1];
if (!inner) throw new Error("Logo mark did not render an <svg>");
const mark = resolveVars(inner);

/** Mark (drawn on a 48-unit grid) centred on a paper square, filling `scale` of it. */
function iconSvg(scale: number): string {
  const size = 48 / scale;
  const offset = (size - 48) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-offset} ${-offset} ${size} ${size}">
<rect x="${-offset}" y="${-offset}" width="${size}" height="${size}" fill="${colour("paper")}"/>
${mark}
</svg>`;
}

function png(svg: string, px: number, file: string) {
  const out = new Resvg(svg, { fitTo: { mode: "width", value: px } }).render().asPng();
  writeFileSync(new URL(`../public/icons/${file}`, import.meta.url), out);
}

// Full icons: the mark fills 80%. Maskable: 60%, inside Android's 80% safe circle.
png(iconSvg(0.8), 192, "icon-192.png");
png(iconSvg(0.8), 512, "icon-512.png");
png(iconSvg(0.6), 512, "icon-maskable-512.png");
png(iconSvg(0.8), 180, "apple-touch-icon.png");
writeFileSync(
  new URL("../public/icons/favicon.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${mark}</svg>\n`,
);
console.log("Icons written to public/icons/");
