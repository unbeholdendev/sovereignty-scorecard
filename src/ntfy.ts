const url = process.env.NTFY_URL;
const topic = process.env.NTFY_TOPIC;
const token = process.env.NTFY_TOKEN;

// ntfy takes an access token as Bearer and a username and password as Basic; a bare value is a token.
const credential = token && (/^(Basic|Bearer) /i.test(token) ? token : `Bearer ${token}`);

// JSON rather than headers, because a header cannot carry text outside Latin-1.
export async function push(body: { title: string; message: string; tags: string[] }) {
  if (!url || !topic) return false;
  try {
    const sent = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(credential ? { authorization: credential } : {}) },
      body: JSON.stringify({ topic, ...body }),
      signal: AbortSignal.timeout(3000),
    });
    return sent.ok;
  } catch {
    return false;
  }
}
