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

  // Unknown /api routes are a real 404; everything else is the single-page app.
  if (existsSync(webRoot)) {
    app.register(fastifyStatic, { root: webRoot, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/") || request.method !== "GET") {
        return reply.code(404).send({ ok: false });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
