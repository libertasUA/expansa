import { Module } from '@nestjs/common';

import { ClockModule } from '../wiring/clock.module';
import { QuantityModule } from '../wiring/quantity.module';
import { ARK_REPOSITORY } from './ark';
import { InMemoryArkRepository } from './in-memory-ark.repository';
import { OrderSynthesisUseCase } from './order-synthesis.use-case';
import { ViewArkUseCase } from './view-ark.use-case';

@Module({
  imports: [ClockModule, QuantityModule],
  providers: [
    { provide: ARK_REPOSITORY, useClass: InMemoryArkRepository },
    ViewArkUseCase,
    OrderSynthesisUseCase,
  ],
  exports: [ViewArkUseCase, OrderSynthesisUseCase],
})
export class ArkModule {}
