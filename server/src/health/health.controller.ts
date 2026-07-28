import { Controller, Get, Inject } from '@nestjs/common';
import type { Clock } from '@expansa/kernel';

import { Public } from '../auth/public.decorator';
import { CLOCK } from '../wiring/clock.module';

interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  /**
   * Liveness only: it answers "is this process running", not "can it serve
   * traffic". Readiness checks against PostgreSQL and the job queue belong here
   * once those exist, at which point this should move to a dedicated endpoint so
   * that a degraded dependency does not get the container killed by a restart
   * policy.
   *
   * Unversioned on purpose. The `/v1` rule covers the game contract, which
   * clients are pinned to; this endpoint is infrastructure, read by Docker and
   * by whatever supervises the container.
   *
   * Public because the thing checking it holds no credentials, and a liveness
   * probe that can fail on an auth outage restarts a healthy container.
   */
  @Public()
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      // Process uptime, not domain time: how long this container has been up is
      // a fact about the process, and the Clock deliberately cannot report it.
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date(this.clock.now()).toISOString(),
    };
  }
}
