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

async function render(card: ReturnType<typeof cardContent>) {
  const svg = await satori(
    el("div", { width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: "#0f172a", color: "#f8fafc", fontFamily: "Inter" },
      el("div", { fontSize: 44 }, card.domain),
      el("div", { display: "flex", alignItems: "baseline", gap: 24 },
        el("div", { fontSize: 160, fontWeight: 700 }, card.score),
        el("div", { fontSize: 36, color: "#94a3b8" }, "ownership score"),
      ),
      el("div", { fontSize: 36, marginBottom: 24 }, card.line),
      ...card.top.map((t) => el("div", { fontSize: 32, color: "#cbd5e1", marginTop: 8 }, t)),
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
