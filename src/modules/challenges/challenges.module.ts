import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeDetails]),
    ChallengeTemplatesModule, // Importamos el módulo de templates
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
