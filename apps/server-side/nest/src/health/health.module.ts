import { Module } from '@nestjs/common';

import { ClockModule } from '../wiring/clock.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ClockModule],
  controllers: [HealthController],
})
export class HealthModule {}
