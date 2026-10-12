const base = "https://raw.githubusercontent.com/enthec/webappanalyzer/main/src";
const json = async (path: string) => {
  const res = await fetch(`${base}/${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
};
const files = ["_", ..."abcdefghijklmnopqrstuvwxyz"].map((c) => json(`technologies/${c}.json`));
const technologies = Object.assign({}, ...(await Promise.all(files)));
await Bun.write("src/wappalyzer/technologies.json", JSON.stringify(technologies, null, 2) + "\n");
await Bun.write("src/wappalyzer/categories.json", JSON.stringify(await json("categories.json"), null, 2) + "\n");
