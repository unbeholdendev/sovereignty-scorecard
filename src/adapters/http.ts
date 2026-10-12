import { isIPv6 } from "node:net";
import type { Http } from "../scanner/scan";

// Connecting to the address the scanner checked, not a fresh lookup, stops DNS rebinding to a private address.
export const realHttp: Http = {
  get: async (url, ip, signal) => {
    if (!ip) throw new Error(`No address for ${url}`);
    const { host, hostname } = new URL(url);
    const pinned = new URL(url);
    pinned.hostname = isIPv6(ip) ? `[${ip}]` : ip;
    return fetch(pinned, { redirect: "manual", signal, headers: { host }, tls: { serverName: hostname } });
  },
};
