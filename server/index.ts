import { buildApp } from "./app.js";

// Render sets PORT and RENDER_GIT_COMMIT.
const port = Number(process.env.PORT ?? 3000);
const version = process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev";

const app = buildApp({ version });

app.listen({ port, host: "0.0.0.0" }).catch((err: unknown) => {
  app.log.error(err);
  process.exit(1);
});
