import { Inject, Injectable } from '@nestjs/common';

import type { Checkpoint } from '@expansa/engine-quantity';
import type { AccountId, Clock } from '@expansa/kernel';

import { STARTING_STATE } from '../content/quantities';
import { CLOCK } from '../wiring/clock.module';
import type { Ark, ArkRepository } from './ark';

/**
 * Storage for the first vertical slice, behind the same port PostgreSQL will
 * implement.
 *
 * The point of writing this rather than waiting for the database is that the
 * persistence decisions (#13, #17) do not change any of the code above it — the
 * use cases, the engine and the client are all finished and working before a
 * single migration exists. Swapping this class for a Drizzle-backed one is the
 * whole of that change.
 *
 * State lives in a process-local Map, so it is lost on restart and would be wrong
 * behind more than one server. Both are fine for a slice and neither is fine for
 * anything else.
 */
@Injectable()
export class InMemoryArkRepository implements ArkRepository {
  private readonly arks = new Map<AccountId, Ark>();

  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  load(accountId: AccountId): Promise<Ark> {
    const existing = this.arks.get(accountId);
    if (existing !== undefined) {
      return Promise.resolve(existing);
    }

    const created: Ark = {
      accountId,
      checkpoint: this.initialCheckpoint(),
      pending: [],
    };
    this.arks.set(accountId, created);
    return Promise.resolve(created);
  }

  save(ark: Ark): Promise<void> {
    this.arks.set(ark.accountId, ark);
    return Promise.resolve();
  }

  private initialCheckpoint(): Checkpoint {
    return { at: this.clock.now(), states: { ...STARTING_STATE } };
  }
}
