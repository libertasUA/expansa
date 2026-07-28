import { Module } from '@nestjs/common';

import { ArkModule } from '../../ark/ark.module';
import { ArkController } from './ark.controller';
import { MeController } from './me.controller';

/**
 * Version 1 of the game contract. Changes here are additive only — a field may
 * be added, but removing one or changing its meaning requires `/v2`, because
 * clients in app stores update over weeks and the old ones keep calling.
 */
@Module({
  imports: [ArkModule],
  controllers: [MeController, ArkController],
})
export class V1Module {}
