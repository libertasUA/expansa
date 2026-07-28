import { Module } from '@nestjs/common';
import { type Clock, systemClock } from '@expansa/kernel';

/**
 * Injection token for the kernel Clock.
 *
 * The token lives here rather than in the kernel because the kernel knows
 * nothing about NestJS — it is portable to a client bundler, where decorators
 * and `reflect-metadata` do not exist. Contour 1 supplies the port; the server
 * supplies the wiring. See ADR 0003.
 */
export const CLOCK = Symbol('Clock');

export type { Clock };

@Module({
  providers: [{ provide: CLOCK, useValue: systemClock() }],
  exports: [CLOCK],
})
export class ClockModule {}
