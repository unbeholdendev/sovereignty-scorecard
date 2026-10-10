import type { Http } from "../scanner/scan";

export const realHttp: Http = {
  get: (url, signal) => fetch(url, { redirect: "manual", signal }),
};
