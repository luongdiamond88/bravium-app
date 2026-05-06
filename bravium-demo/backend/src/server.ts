import { buildApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = await buildApp();

  try {
    console.log("BACKEND PORT =", env.PORT);
    await app.listen({
      port: 8080,
      host: env.HOST,
    });

    app.log.info(`Bravium backend listening on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
