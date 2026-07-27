import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  /**
   * Liveness only: it answers "is this process running", not "can it serve
   * traffic". Readiness checks against PostgreSQL and the job queue belong here
   * once those exist, at which point this should move to a dedicated endpoint so
   * that a degraded dependency does not get the container killed by a restart
   * policy.
   */
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
