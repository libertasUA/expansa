import { randomUUID } from 'node:crypto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { InsufficientQuantityError, type QuantityEngine } from '@expansa/engine-quantity';
import { addDuration, type Clock, type Principal, seconds } from '@expansa/kernel';

import { SYNTHESIS } from '../content/quantities';
import { CLOCK } from '../wiring/clock.module';
import { QUANTITY_ENGINE } from '../wiring/quantity.module';
import { ARK_REPOSITORY, type Ark, type ArkRepository } from './ark';
import { settleSynthesis } from './settle';

@Injectable()
export class OrderSynthesisUseCase {
  constructor(
    @Inject(ARK_REPOSITORY) private readonly arks: ArkRepository,
    @Inject(QUANTITY_ENGINE) private readonly quantities: QuantityEngine,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Spends energy now, delivers fuel later.
   *
   * Takes a `Principal` rather than a request: the same use case has to be
   * callable from a job handler and from a script, and only one of those has an
   * HTTP request to read.
   */
  async execute(principal: Principal, fuel: number): Promise<Ark> {
    if (!Number.isInteger(fuel) || fuel <= 0 || fuel > SYNTHESIS.maxPerOrder) {
      throw new BadRequestException(
        `fuel must be a whole number between 1 and ${SYNTHESIS.maxPerOrder}`,
      );
    }

    const ark = await this.arks.load(principal.accountId);
    const now = this.clock.now();

    // Settle first, then mutate. Skipping this would price the order against a
    // stale checkpoint, and any fuel delivered in the meantime would be credited
    // afterwards on top of a state that had already moved past it.
    const settled = settleSynthesis(ark, now, this.quantities);

    const cost = { energy: fuel * SYNTHESIS.energyPerFuel };
    let checkpoint;
    try {
      checkpoint = this.quantities.spend(settled.checkpoint, now, cost);
    } catch (error) {
      if (error instanceof InsufficientQuantityError) {
        throw new BadRequestException(
          `Not enough ${error.quantityId}: have ${Math.floor(error.available)}, ` +
            `need ${error.required}`,
        );
      }
      throw error;
    }

    const next: Ark = {
      ...settled,
      checkpoint,
      pending: [
        ...settled.pending,
        {
          id: randomUUID(),
          fuel,
          orderedAt: now,
          completesAt: addDuration(now, seconds(fuel * SYNTHESIS.secondsPerFuel)),
        },
      ],
    };

    await this.arks.save(next);
    return next;
  }
}
