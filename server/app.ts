import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";

export interface AppOptions {
  /** Directory holding the built web app (vite build output). */
  webRoot?: string;
  /** Reported by /api/health so a deploy can be matched to a commit. */
  version?: string;
}

const DEFAULT_WEB_ROOT = fileURLToPath(new URL("../dist", import.meta.url));

export function buildApp({
  webRoot = DEFAULT_WEB_ROOT,
  version = "dev",
}: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: process.env.NODE_ENV === "production" });

  app.get("/api/health", async () => ({ ok: true, version }));

  // App screens (/settings, /sessions/…) get the single-page app. Unknown
  // /api routes and missing files (/assets/old-hash.js after a deploy) get a
  // real 404: answering a script with HTML would break the page, and the
  // service worker could cache that HTML as the script.
  if (existsSync(webRoot)) {
    app.register(fastifyStatic, { root: webRoot, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      const path = request.url.split("?")[0] ?? "";
      const isFile = /\.[a-z0-9]+$/i.test(path);
      if (path.startsWith("/api/") || request.method !== "GET" || isFile) {
        return reply.code(404).send({ ok: false });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
