import { createApp } from "./app";
import { logger } from "./shared/logger";

const start = async () => {
  const { app, config } = await createApp();

  app.listen(config.port, () => {
    logger.info("Health Partner backend listening.", { port: config.port, nodeEnv: config.nodeEnv });
  });
};

start().catch((error) => {
  logger.error("Failed to start backend.", { error });
  process.exit(1);
});
