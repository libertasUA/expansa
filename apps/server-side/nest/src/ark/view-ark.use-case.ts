import { Inject, Injectable } from '@nestjs/common';

import type { QuantityEngine } from '@expansa/engine-quantity';
import type { Clock, Principal } from '@expansa/kernel';

import { CLOCK } from '../wiring/clock.module';
import { QUANTITY_ENGINE } from '../wiring/quantity.module';
import { ARK_REPOSITORY, type Ark, type ArkRepository } from './ark';
import { settleSynthesis } from './settle';

@Injectable()
export class ViewArkUseCase {
  constructor(
    @Inject(ARK_REPOSITORY) private readonly arks: ArkRepository,
    @Inject(QUANTITY_ENGINE) private readonly quantities: QuantityEngine,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * The ark as it stands now.
   *
   * Settles finished orders for the answer but **does not save**: ADR 0002 puts
   * lazy projection on the read path precisely so that reading writes nothing.
   * Whatever is settled here will be settled again, identically, by the next
   * write — the projection is associative, so doing it twice costs nothing and
   * cannot drift.
   */
  async execute(principal: Principal): Promise<Ark> {
    const ark = await this.arks.load(principal.accountId);
    const now = this.clock.now();

    const settled = settleSynthesis(ark, now, this.quantities);
    return { ...settled, checkpoint: this.quantities.project(settled.checkpoint, now) };
  }
}
