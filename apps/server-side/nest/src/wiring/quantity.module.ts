import { Module } from '@nestjs/common';

import { type QuantityEngine, createQuantityEngine } from '@expansa/engine-quantity';

import { QUANTITIES } from '../content/quantities';

export const QUANTITY_ENGINE = Symbol('QuantityEngine');

/**
 * Builds the engine from content.
 *
 * This is the composition root doing its one job: Contour 3 data meets a Contour
 * 2 engine here and nowhere else. The engine has no idea where the definitions
 * came from, and the content has no idea what will be done with it.
 */
@Module({
  providers: [
    {
      provide: QUANTITY_ENGINE,
      useFactory: (): QuantityEngine => createQuantityEngine(QUANTITIES),
    },
  ],
  exports: [QUANTITY_ENGINE],
})
export class QuantityModule {}
