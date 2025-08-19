import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ValueTransformer,
} from 'typeorm';
import { Challenge } from './challenge.entity';
import { MetaStats, positionsDetails } from 'src/common/utils/account';
import { RiskParams } from 'src/common/utils/risk';
import { riskEvaluationResult } from 'src/common/types/risk-results';
// Utilidad: transformer genérico para persistir objetos como JSON string en DB y exponer tipos en TS
const jsonStringTransformer = <T>(): ValueTransformer => ({
  to: (value: T | null | undefined): string | null =>
    value == null ? null : JSON.stringify(value),
  from: (value: string | null): T | null => {
    if (value == null) return null as any;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null as any;
    }
  },
});

@Entity('ChallengeDetails')
export class ChallengeDetails {
  @PrimaryColumn('uuid')
  challengeID: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonStringTransformer<MetaStats>(),
  })
  metaStats?: MetaStats | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonStringTransformer<positionsDetails>(),
  })
  positions?: positionsDetails | null;
  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonStringTransformer<RiskParams>(),
  })
  rulesParams?: RiskParams | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonStringTransformer<riskEvaluationResult>(),
  })
  rulesValidation?: riskEvaluationResult | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdate?: Date;

  // Relations
  @OneToOne(() => Challenge, (challenge) => challenge.details)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}
