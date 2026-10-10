import { fileURLToPath } from "node:url";

export const root = import.meta.env.ROOT ?? fileURLToPath(new URL("..", import.meta.url));
