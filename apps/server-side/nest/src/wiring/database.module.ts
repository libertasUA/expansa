import { Module } from '@nestjs/common';

import { createDatabase, type Database } from '@expansa/platform';

export const DATABASE = Symbol('Database');

/**
 * The one place a connection string turns into a database handle.
 *
 * `useFactory` rather than `useClass`: the platform has no `@nestjs` dependency
 * and must not acquire one, so it hands Nest a finished value — ADR 0005.
 */
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => {
        const url = process.env.DATABASE_URL;
        if (url === undefined || url === '') {
          throw new Error('DATABASE_URL is not set');
        }
        return createDatabase(url).db;
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
