import { detectHomepage } from "./homepage";

declare const self: Worker;

self.onmessage = async ({ data: { id, page } }) => {
  try {
    postMessage({ id, detections: await detectHomepage(page) });
  } catch (e) {
    postMessage({ id, error: String(e) });
  }
};
