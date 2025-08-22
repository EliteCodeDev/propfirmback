import { Injectable } from '@nestjs/common';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { riskEvaluationResult } from 'src/common/types/risk-results';
@Injectable()
export class TasksService {
  constructor() {}

  async approvedChallenge() {}
  async setDesaprobableChallenge(evaluation: riskEvaluationResult) {}
  async setAprobableChallenge(evaluation: riskEvaluationResult) {}
}
