import { promises as dns } from "node:dns";
import type { Dns } from "../scanner/scan";

const lookups = {
  A: (name: string) => dns.resolve4(name),
  AAAA: (name: string) => dns.resolve6(name),
  NS: (name: string) => dns.resolveNs(name),
  MX: async (name: string) => (await dns.resolveMx(name)).map((r) => `${r.priority} ${r.exchange}`),
  CNAME: (name: string) => dns.resolveCname(name),
  TXT: async (name: string) => (await dns.resolveTxt(name)).map((r) => r.join("")),
};

export const realDns: Dns = {
  resolve: (name, type) => lookups[type](name).catch(() => []),
};
