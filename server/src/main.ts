import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Close the HTTP server and release the port on SIGTERM/SIGINT instead of being
  // killed mid-flight. Required for clean restarts in watch mode, and later for
  // draining in-flight requests on deploy.
  app.enableShutdownHooks();

  const port = Number(process.env.SERVER_PORT ?? DEFAULT_PORT);

  // Bind to 0.0.0.0 rather than Fastify's default of localhost: the process runs
  // inside a container, and a localhost-bound socket is unreachable through the
  // published port.
  await app.listen({ port, host: '0.0.0.0' });
}

void bootstrap();
