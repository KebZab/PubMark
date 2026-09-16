type Next = (error?: unknown) => Promise<void>;
type Handler = (req: any, res: EdgeResponse, next: Next) => unknown;

class EdgeResponse {
  statusCode = 200;
  headers = new Headers();
  body: BodyInit | null = null;
  ended = false;

  status(code: number) { this.statusCode = code; return this; }
  set(name: string, value: string) { this.headers.set(name, value); return this; }
  type(value: string) {
    this.headers.set("content-type", value.includes("/") ? value : `${value}; charset=utf-8`);
    return this;
  }
  json(value: unknown) {
    this.headers.set("content-type", "application/json; charset=utf-8");
    this.body = JSON.stringify(value);
    this.ended = true;
    return this;
  }
  send(value: unknown) {
    this.body = typeof value === "string" ? value : JSON.stringify(value);
    this.ended = true;
    return this;
  }
  end() { this.ended = true; return this; }
  cookie(name: string, value: string, options: Record<string, unknown> = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/"];
    if (options.httpOnly) parts.push("HttpOnly");
    if (options.secure) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.maxAge) parts.push(`Max-Age=${Math.floor(Number(options.maxAge) / 1000)}`);
    this.headers.append("set-cookie", parts.join("; "));
    return this;
  }
  clearCookie(name: string, options: Record<string, unknown> = {}) {
    return this.cookie(name, "", { ...options, maxAge: 0 });
  }
  toResponse(corsHeaders: HeadersInit = {}) {
    const headers = new Headers(this.headers);
    for (const [key, value] of new Headers(corsHeaders)) headers.set(key, value);
    return new Response(this.statusCode === 204 || this.statusCode === 304 ? null : this.body, {
      status: this.statusCode,
      headers,
    });
  }
}

function routePattern(path: string) {
  const keys: string[] = [];
  const escaped = path.split("/").map((part) => {
    if (part.startsWith(":")) { keys.push(part.slice(1)); return "([^/]+)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { keys, regex: new RegExp(`^${escaped}/?$`) };
}

export function cors(options: any = {}) {
  return { __edgeCors: true, options };
}

export default function express() {
  const routes: Array<any> = [];
  const middleware: Handler[] = [];
  const errorMiddleware: Handler[] = [];
  let corsOptions: any = null;

  const app: any = {
    use(handler: any) {
      if (handler?.__edgeCors) corsOptions = handler.options;
      else if (typeof handler === "function" && handler.length === 4) errorMiddleware.push(handler);
      else if (typeof handler === "function") middleware.push(handler);
      return app;
    },
    async fetch(request: Request) {
      const url = new URL(request.url);
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
      const query = Object.fromEntries(url.searchParams.entries());
      const functionPath = url.pathname.replace(/^\/functions\/v1\/api/, "") || "/";
      const path = functionPath === "/api" || functionPath.startsWith("/api/")
        ? functionPath
        : `/api${functionPath}`;
      const route = routes.find((item) => item.method === request.method && item.regex.test(path));
      const response = new EdgeResponse();
      const corsHeaders: Record<string, string> = {};
      const origin = request.headers.get("origin");

      if (origin && corsOptions?.origin) {
        await new Promise<void>((resolve) => corsOptions.origin(origin, (error: unknown, allowed: boolean) => {
          if (!error && allowed) {
            corsHeaders["access-control-allow-origin"] = origin;
            corsHeaders["access-control-allow-credentials"] = "true";
            corsHeaders.vary = "Origin";
          }
          resolve();
        }));
      }
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: {
          ...corsHeaders,
          "access-control-allow-headers": "authorization, apikey, content-type, if-none-match",
          "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
        }});
      }
      if (!route) return Response.json({ message: "Not found." }, { status: 404, headers: corsHeaders });

      const match = path.match(route.regex)!;
      const params = Object.fromEntries(route.keys.map((key: string, index: number) => [key, decodeURIComponent(match[index + 1])]));
      let body: any = {};
      if (!["GET", "HEAD"].includes(request.method)) {
        const text = await request.text();
        if (text.length > 10 * 1024 * 1024) return Response.json({ message: "Request body is too large." }, { status: 413, headers: corsHeaders });
        if (text) {
          try { body = JSON.parse(text); }
          catch { return Response.json({ message: "Request body must be valid JSON." }, { status: 400, headers: corsHeaders }); }
        }
      }
      const req = { method: request.method, url: request.url, path, headers, query, params, body };
      const handlers = [...middleware, ...route.handlers];

      const runError = async (error: unknown) => {
        for (const handler of errorMiddleware) {
          let continued = false;
          await handler(error, req, response, async () => { continued = true; });
          if (response.ended || !continued) return;
        }
        console.error(error);
        if (!response.ended) response.status(500).json({ message: "Unexpected server error." });
      };
      const dispatch = async (index: number): Promise<void> => {
        if (response.ended || index >= handlers.length) return;
        let nextPromise: Promise<void> | null = null;
        const next: Next = (error) => {
          nextPromise = error ? runError(error) : dispatch(index + 1);
          return nextPromise;
        };
        try { await handlers[index](req, response, next); }
        catch (error) { await runError(error); }
        if (nextPromise) await nextPromise;
      };
      await dispatch(0);
      if (!response.ended) response.status(204).end();
      return response.toResponse(corsHeaders);
    },
  };
  for (const method of ["get", "post", "patch", "put", "delete"]) {
    app[method] = (path: string, ...handlers: Handler[]) => {
      routes.push({ method: method.toUpperCase(), path, handlers, ...routePattern(path) });
      return app;
    };
  }
  return app;
}

express.json = () => (_req: any, _res: EdgeResponse, next: Next) => next();
