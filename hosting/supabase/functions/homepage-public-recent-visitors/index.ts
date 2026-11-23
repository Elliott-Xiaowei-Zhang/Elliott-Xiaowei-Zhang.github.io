const homepage = "https://elliott-xiaowei-zhang.github.io";
const hourMs = 60 * 60 * 1000;
const limit = 12;

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  if (origin === homepage || /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin ?? "")) {
    headers.set("Access-Control-Allow-Origin", origin!);
  }
  if (request.method !== "GET") {
    headers.set("Allow", "GET");
    return new Response(null, { status: 405, headers });
  }
  if (origin && !headers.has("Access-Control-Allow-Origin")) {
    return Response.json({ error: "Origin not allowed" }, { status: 403, headers });
  }

  try {
    const project = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!project || !key) throw new Error("Missing database binding");
    const query = new URL("/rest/v1/homepage_visitors", project);
    query.searchParams.set("select", "country,first_seen");
    query.searchParams.set("order", "first_seen.desc,country");
    query.searchParams.set("limit", "200");
    const response = await fetch(query, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Recent visitor activity could not be read");

    const records = await response.json() as { country: string; first_seen: string }[];
    const visits = [];
    const seen = new Set();
    for (const { country, first_seen } of records) {
      const time = Date.parse(first_seen);
      if (!/^[A-Z]{2}$/.test(country) || !Number.isFinite(time)) continue;
      const hour = new Date(Math.floor(time / hourMs) * hourMs).toISOString().replace(".000Z", "Z");
      const group = `${country}:${hour}`;
      if (seen.has(group)) continue;
      seen.add(group);
      visits.push({ country, hour });
      if (visits.length === limit) break;
    }
    headers.set("Cache-Control", "public, max-age=60");
    return Response.json({ visits }, { headers });
  } catch {
    return Response.json({ error: "Recent visits are temporarily unavailable" }, { status: 503, headers });
  }
});
