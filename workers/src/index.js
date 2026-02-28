export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true }, 200);
    }

    if (request.method === "GET" && url.pathname === "/directory") {
      const key = "va/directory/index.json";
      const obj = await env.R2_VIRTUAL_LAUNCH.get(key);
      if (!obj) return json({ directory: [] }, 200);

      return new Response(await obj.text(), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }

    return json({ error: "Not found" }, 404);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
