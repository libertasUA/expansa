import { Body, Controller, Get, Post } from '@nestjs/common';
import type { Principal } from '@expansa/kernel';

import type { Ark } from '../../ark/ark';
import { OrderSynthesisUseCase } from '../../ark/order-synthesis.use-case';
import { ViewArkUseCase } from '../../ark/view-ark.use-case';
import { CurrentPrincipal } from '../../auth/current-principal.decorator';

interface QuantityView {
  readonly amount: number;
  readonly ratePerSecond: number;
  readonly capacity: number | null;
}

interface ArkView {
  /**
   * The checkpoint itself, not a computed total. The client extrapolates from it
   * locally with the same engine the server used, so a counter can tick every
   * frame without a request and still agree with the server when the player
   * spends. See ADR 0002.
   */
  readonly at: number;
  readonly quantities: Readonly<Record<string, QuantityView>>;
  readonly pending: readonly {
    readonly id: string;
    readonly fuel: number;
    readonly completesAt: number;
  }[];
}

@Controller('v1/ark')
export class ArkController {
  constructor(
    private readonly viewArk: ViewArkUseCase,
    private readonly orderSynthesis: OrderSynthesisUseCase,
  ) {}

  @Get()
  async get(@CurrentPrincipal() principal: Principal): Promise<ArkView> {
    return toView(await this.viewArk.execute(principal));
  }

  @Post('synthesise')
  async synthesise(
    @CurrentPrincipal() principal: Principal,
    @Body() body: { fuel?: unknown },
  ): Promise<ArkView> {
    // Hand-checked rather than validated by a schema: the validation approach is
    // still open (#14), and guessing at it here would be harder to undo than
    // three lines of arithmetic. The use case rejects bad input regardless.
    const fuel = typeof body?.fuel === 'number' ? body.fuel : Number.NaN;
    return toView(await this.orderSynthesis.execute(principal, fuel));
  }
}

function toView(ark: Ark): ArkView {
  return {
    at: ark.checkpoint.at,
    quantities: ark.checkpoint.states,
    pending: ark.pending.map((order) => ({
      id: order.id,
      fuel: order.fuel,
      completesAt: order.completesAt,
    })),
  };
}
