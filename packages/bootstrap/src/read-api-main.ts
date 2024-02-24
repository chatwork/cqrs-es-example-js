import { createQuerySchema } from "cqrs-es-example-js-query-interface-adaptor";
import { PrismaClient } from "@prisma/client";
import { logger } from "./index";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { QueryContext } from "cqrs-es-example-js-query-interface-adaptor";

interface MyContext {
  prisma: PrismaClient;
}

async function readApiMain() {
  const apiHost =
    process.env.API_HOST !== undefined ? process.env.API_HOST : "localhost";
  const apiPort =
    process.env.API_PORT !== undefined ? parseInt(process.env.API_PORT) : 3000;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  logger.info(`API_HOST: ${apiHost}`);
  logger.info(`API_PORT: ${apiPort}`);
  logger.info(`DATABASE_URL: ${DATABASE_URL}`);

  const prisma = new PrismaClient({
    log: [{ level: "query", emit: "event" }],
  });
  prisma.$on("query", async (e) => {
    logger.info("Query: " + e.query);
    logger.info("Params: " + e.params);
    logger.info("Duration: " + e.duration + "ms");
  });

  const schema = await createQuerySchema();
  const server = new ApolloServer<QueryContext>({ schema });
  const { url } = await startStandaloneServer(server, {
    context: async (): Promise<MyContext> => ({ prisma }),
    listen: { host: apiHost, port: apiPort },
  });
  logger.info(`🚀 Server ready at ${url}`);
}

export { readApiMain };
