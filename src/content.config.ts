import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { tool } from "./scanner/catalogue";

export const collections = {
  catalogue: defineCollection({ loader: glob({ pattern: "*.yaml", base: "./src/catalogue" }), schema: tool }),
};
