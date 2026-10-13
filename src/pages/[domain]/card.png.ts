import { Resvg } from "@resvg/resvg-js";
import type { APIRoute } from "astro";
import satori from "satori";
import { cardContent } from "../../card";
import bold from "../../fonts/Inter-Bold.ttf?inline";
import regular from "../../fonts/Inter-Regular.ttf?inline";
import { getCard, getResult, saveCard } from "../../store";

const font = (dataUrl: string) => Buffer.from(dataUrl.split(",")[1], "base64");
const fonts = [
  { name: "Inter", data: font(regular), weight: 400 as const },
  { name: "Inter", data: font(bold), weight: 700 as const },
];

const el = (type: string, style: object, ...children: unknown[]) => ({ type, props: { style, children } });
const tag = (type: string, props: object) => ({ type, props });
const rent = "#c2307f";
const open = "#0a85a8";
const muted = "#5d5e63";

const glyph = (broken: boolean) =>
  tag("svg", { width: 135, height: 30, viewBox: "0 0 90 20", style: { marginRight: 28 }, children: [
    tag("circle", { cx: 5, cy: 10, r: 3.2, fill: rent }),
    tag("path", { d: "M8 10H36M36 4v12M50 4v12", stroke: rent, strokeWidth: 2, strokeLinecap: "round" }),
    broken
      ? tag("path", { d: "M54 10H80", stroke: open, strokeWidth: 2, strokeLinecap: "round" })
      : tag("path", { d: "M54 10H80", stroke: "#b9b9bd", strokeWidth: 1.6, strokeDasharray: "2 4", strokeLinecap: "round" }),
    broken && tag("circle", { cx: 84.5, cy: 10, r: 3.6, fill: "none", stroke: open, strokeWidth: 1.6 }),
  ] });

async function render(card: ReturnType<typeof cardContent>) {
  const svg = await satori(
    el("div", { width: 1200, height: 630, boxSizing: "border-box", display: "flex", flexDirection: "column", padding: "56px 72px", background: "#fafaf8", color: "#17181b", fontFamily: "Inter", fontSize: 30 },
      el("div", { fontSize: 40, fontWeight: 700 }, card.domain),
      card.score === null
        ? el("div", { fontSize: 88, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 16 }, "Not enough data")
        : el("div", { display: "flex", alignItems: "baseline", gap: 20 },
            el("div", { fontSize: 140, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1 }, String(card.score)),
            el("div", { fontSize: 40, color: muted }, "/ 100 owned"),
          ),
      card.score !== null && el("div", { display: "flex", gap: 9, marginBottom: 20 },
        ...(card.rented ? ["Rented from", el("span", { color: rent, fontWeight: 700 }, String(card.rented)), card.rented === 1 ? "company" : "companies"] : [card.line]),
      ),
      ...card.top.map((t) => el("div", { display: "flex", alignItems: "center", height: 64, borderTop: "1px solid rgba(23,24,27,0.1)" },
        el("span", { width: 380, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, t.name),
        glyph(!!t.alternative),
        t.alternative ? el("span", { color: "#077590", fontWeight: 700 }, t.alternative) : el("span", { color: muted, fontSize: 24 }, "No open source option listed yet"),
      )),
      el("div", { marginTop: "auto", fontSize: 22, color: muted }, "Unbeholden Check"),
    ) as never,
    { width: 1200, height: 630, fonts },
  );
  return new Resvg(svg).render().asPng();
}

export const GET: APIRoute = async ({ params }) => {
  const result = getResult(params.domain!);
  if (!result) return new Response("Not found", { status: 404 });
  let png = getCard(result);
  if (!png) saveCard(result, (png = await render(cardContent(result))));
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
};
