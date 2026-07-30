import { Module } from '@nestjs/common';

import { V1Module } from './api/v1/v1.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AuthModule, HealthModule, V1Module],
})
export class AppModule {}
