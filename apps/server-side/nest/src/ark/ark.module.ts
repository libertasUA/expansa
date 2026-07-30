import { Module } from '@nestjs/common';

import type { Clock } from '@expansa/kernel';
import type { Database } from '@expansa/platform';

import { CLOCK, ClockModule } from '../wiring/clock.module';
import { DATABASE, DatabaseModule } from '../wiring/database.module';
import { QuantityModule } from '../wiring/quantity.module';
import { ARK_REPOSITORY } from './ark';
import { OrderSynthesisUseCase } from './order-synthesis.use-case';
import { PostgresArkRepository } from './postgres-ark.repository';
import { ViewArkUseCase } from './view-ark.use-case';

@Module({
  imports: [ClockModule, DatabaseModule, QuantityModule],
  providers: [
    {
      provide: ARK_REPOSITORY,
      inject: [DATABASE, CLOCK],
      // `useFactory` rather than `useClass`: the repository is a plain class and
      // is constructed here, so exercising it needs `new` and not a test module.
      useFactory: (db: Database, clock: Clock) => new PostgresArkRepository(db, clock),
    },
    ViewArkUseCase,
    OrderSynthesisUseCase,
  ],
  exports: [ViewArkUseCase, OrderSynthesisUseCase],
})
export class ArkModule {}
