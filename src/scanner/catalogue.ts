import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { root } from "../root";

const alternative = z.strictObject({
  name: z.string(),
  repo: z.url(),
  selfHostUrl: z.url(),
  managedUrl: z.url().optional(),
  articles: z.array(z.url()).default([]),
  licence: z.string().optional(),
});

export const tool = z.strictObject({
  name: z.string(),
  matches: z.array(z.string()).min(1),
  category: z.string(),
  company: z.string(),
  openSource: z.boolean(),
  alternatives: z.array(alternative).max(3),
});

export type Alternative = Omit<z.output<typeof alternative>, "licence">;
export type Repo = { licence: string; stars: number; release: string | null; archived: boolean };

const dir = join(root, "src/catalogue");

export const catalogue = readdirSync(dir).map((file) => tool.parse(Bun.YAML.parse(readFileSync(join(dir, file), "utf8"))));

export const defaults = z.record(z.string(), z.array(alternative).max(3)).parse(Bun.YAML.parse(readFileSync(join(root, "src/defaults.yaml"), "utf8")));
