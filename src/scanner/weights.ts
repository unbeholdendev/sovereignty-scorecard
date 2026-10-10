import type { Detection } from "./scan";

const weights: Record<string, number> = { mail: 3, dns: 3, hosting: 3, cdn: 2, auth: 2, payments: 2, forms: 2, crm: 2 };

export const weightOf = (category: string) => weights[category] ?? 1;

export const detection = (d: Omit<Detection, "weight" | "alternatives">): Detection =>
  ({ ...d, weight: d.kind === "unscored" ? 0 : weightOf(d.category), alternatives: [] });
