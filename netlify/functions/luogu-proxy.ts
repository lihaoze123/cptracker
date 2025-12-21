import type { Handler } from "@netlify/functions";

const ALLOWED_PREFIXES = [
  "/api/user/search",
  "/user/",
  "/record/list",
];

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX = 20;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isAllowedPath(path: string) {
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  const clientKey = getClientKey(event);
  if (isRateLimited(clientKey)) {
    return {
      statusCode: 429,
      headers: corsHeaders(),
      body: "Too Many Requests: 请稍后再试",
    };
  }

  const cleanedPath = event.path
    .replace(/^\/\.netlify\/functions\/luogu-proxy/, "")
    .replace(/^\/api\/luogu/, "");

  if (!cleanedPath) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: "Missing upstream path",
    };
  }

  if (!isAllowedPath(cleanedPath)) {
    return {
      statusCode: 403,
      headers: corsHeaders(),
      body: "Path not allowed",
    };
  }

  const targetUrl = `https://www.luogu.com.cn${cleanedPath}${event.rawQuery ? `?${event.rawQuery}` : ""}`;

  const incomingCookie =
    event.headers["x-luogu-cookie"] ??
    event.headers["cookie"] ??
    event.headers["Cookie"] ??
    "";

  if (!incomingCookie.trim()) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: "Missing Luogu cookie",
    };
  }

  const upstreamResponse = await fetchWithRedirect(targetUrl, 0, incomingCookie);
  const body = await upstreamResponse.text();

  return {
    statusCode: upstreamResponse.status,
    headers: {
      ...corsHeaders(),
      "content-type": upstreamResponse.headers.get("content-type") ?? "application/json",
    },
    body,
  };
};

async function fetchWithRedirect(url: string, depth = 0, cookie = ""): Promise<Response> {
  if (depth > 10) {
    return new Response("Too many redirects", { status: 310 });
  }

  const headers: Record<string, string> = {
    "user-agent": "Mozilla/5.0",
    "x-luogu-type": "content-only",
    "x-lentille-request": "content-only",
    referer: "https://www.luogu.com.cn/",
  };

  if (cookie) {
    headers.cookie = cookie;
  }

  const res = await fetch(url, {
    headers,
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie");
  const nextCookie = mergeCookies(cookie, setCookie);

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (location) {
      const nextUrl = location.startsWith("http") ? location : new URL(location, url).toString();
      return fetchWithRedirect(nextUrl, depth + 1, nextCookie);
    }
  }

  return res;
}

function mergeCookies(existing: string, incoming: string | null): string {
  const jar = new Map<string, string>();

  const add = (cookieStr: string) => {
    const pair = cookieStr.split(";")[0]?.trim();
    if (!pair) return;
    const [name, ...rest] = pair.split("=");
    if (!name) return;
    jar.set(name.trim(), rest.join("=").trim());
  };

  existing
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(add);

  incoming
    ?.split(/,(?=[^;]+=[^;]+)/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(add);

  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  };
}

function getClientKey(event: Parameters<Handler>[0]): string {
  const forwarded = event.headers["x-forwarded-for"] || event.headers["X-Forwarded-For"];
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return event.headers["client-ip"] || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return entry.count > RATE_LIMIT_MAX;
}
