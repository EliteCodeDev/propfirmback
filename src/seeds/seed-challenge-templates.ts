/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, Repository } from 'typeorm';

// Entities
import {
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
  RelationBalance,
  ChallengeRelation,
  ChallengeStage,
  RelationStage,
  StageRule,
  StageParameter,
} from '../modules/challenge-templates/entities';
import { StageRuleType } from '../common/enums/stage-rule-type.enum';

type Repos = {
  category: Repository<ChallengeCategory>;
  plan: Repository<ChallengePlan>;
  balance: Repository<ChallengeBalance>;
  relation: Repository<ChallengeRelation>;
  relationBalance: Repository<RelationBalance>;
  stage: Repository<ChallengeStage>;
  relationStage: Repository<RelationStage>;
  rule: Repository<StageRule>;
  parameter: Repository<StageParameter>;
};

async function ensureCategory(repos: Repos, name: string) {
  let cat = await repos.category.findOne({ where: { name } });
  if (!cat) {
    cat = repos.category.create({ name });
    await repos.category.save(cat);
    console.log(`✅ Category: ${name}`);
  } else {
    console.log(`↺ Category exists: ${name}`);
  }
  return cat;
}

async function ensurePlan(repos: Repos, name: string, isActive = true) {
  let plan = await repos.plan.findOne({ where: { name } });
  if (!plan) {
    plan = repos.plan.create({ name, isActive });
    await repos.plan.save(plan);
    console.log(`✅ Plan: ${name}`);
  } else {
    // keep idempotent, update active flag if needed
    plan.isActive = isActive;
    await repos.plan.save(plan);
    console.log(`↺ Plan exists: ${name}`);
  }
  return plan;
}

async function ensureBalance(
  repos: Repos,
  name: string,
  balance: number,
) {
  let bal = await repos.balance.findOne({ where: { name } });
  if (!bal) {
    bal = repos.balance.create({ name, balance, isActive: true });
    await repos.balance.save(bal);
    console.log(`✅ Balance: ${name} (${balance.toLocaleString()})`);
  } else {
    // update stored amount if changed
    bal.balance = balance;
    await repos.balance.save(bal);
    console.log(`↺ Balance exists: ${name}`);
  }
  return bal;
}

async function ensureRelation(
  repos: Repos,
  categoryID: string,
  planID: string,
) {
  let rel = await repos.relation.findOne({ where: { categoryID, planID } });
  if (!rel) {
    rel = repos.relation.create({ categoryID, planID });
    await repos.relation.save(rel);
    console.log(`✅ Relation: category=${categoryID} plan=${planID}`);
  } else {
    console.log(`↺ Relation exists: ${rel.relationID}`);
  }
  return rel;
}

async function ensureRelationBalance(
  repos: Repos,
  relationID: string,
  balanceID: string,
  price: number,
) {
  let rb = await repos.relationBalance.findOne({ where: { relationID, balanceID } });
  if (!rb) {
    rb = repos.relationBalance.create({ relationID, balanceID, price, isActive: true });
    await repos.relationBalance.save(rb);
    console.log(`  💵 Price set: relation=${relationID} balance=${balanceID} -> $${price}`);
  } else {
    rb.price = price;
    await repos.relationBalance.save(rb);
    console.log(`  ↺ Price updated: relation=${relationID} balance=${balanceID} -> $${price}`);
  }
  return rb;
}

async function ensureStage(repos: Repos, name: string) {
  let st = await repos.stage.findOne({ where: { name } });
  if (!st) {
    st = repos.stage.create({ name });
    await repos.stage.save(st);
    console.log(`✅ Stage: ${name}`);
  }
  return st;
}

async function ensureRelationStage(
  repos: Repos,
  relationID: string,
  stageID: string,
  numPhase: number,
) {
  let rs = await repos.relationStage.findOne({ where: { relationID, stageID } });
  if (!rs) {
    rs = repos.relationStage.create({ relationID, stageID, numPhase });
    await repos.relationStage.save(rs);
    console.log(`  ✅ RelationStage: stage=${stageID} numPhase=${numPhase}`);
  } else {
    rs.numPhase = numPhase;
    await repos.relationStage.save(rs);
    console.log(`  ↺ RelationStage exists: stage=${stageID} numPhase=${numPhase}`);
  }
  return rs;
}

async function ensureRule(
  repos: Repos,
  ruleSlug: string,
  ruleType: StageRuleType,
  ruleName?: string,
  ruleDescription?: string,
) {
  let rule = await repos.rule.findOne({ where: { ruleSlug } });
  if (!rule) {
    rule = repos.rule.create({ ruleSlug, ruleType, ruleName, ruleDescription });
    await repos.rule.save(rule);
    console.log(`✅ Rule: ${ruleSlug}`);
  }
  return rule;
}

async function ensureParameter(
  repos: Repos,
  ruleID: string,
  relationStageID: string,
  ruleValue: string,
) {
  let param = await repos.parameter.findOne({ where: { ruleID, relationStageID } });
  if (!param) {
    param = repos.parameter.create({ ruleID, relationStageID, ruleValue, isActive: true });
    await repos.parameter.save(param);
    console.log(`    ▸ Param: rule=${ruleID} value="${ruleValue}"`);
  } else {
    param.ruleValue = ruleValue;
    await repos.parameter.save(param);
    console.log(`    ↺ Param updated: rule=${ruleID} value="${ruleValue}"`);
  }
  return param;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const repos: Repos = {
      category: ds.getRepository(ChallengeCategory),
      plan: ds.getRepository(ChallengePlan),
      balance: ds.getRepository(ChallengeBalance),
      relation: ds.getRepository(ChallengeRelation),
      relationBalance: ds.getRepository(RelationBalance),
      stage: ds.getRepository(ChallengeStage),
      relationStage: ds.getRepository(RelationStage),
      rule: ds.getRepository(StageRule),
      parameter: ds.getRepository(StageParameter),
    };

    // 1) Base data: stages and rules (global, reused by all relations)
    const stage1 = await ensureStage(repos, 'Phase 1');
    const stage2 = await ensureStage(repos, 'Phase 2');
    const stageFunded = await ensureStage(repos, 'Funded');

    const ruleProfitTarget = await ensureRule(
      repos,
      'profit_target',
      StageRuleType.PERCENTAGE,
      'Profit Target',
      'Required profit target for the phase',
    );
    const ruleDailyLoss = await ensureRule(
      repos,
      'daily_loss',
      StageRuleType.PERCENTAGE,
      'Daily Loss',
      'Maximum allowed daily loss',
    );
    const ruleMaxLoss = await ensureRule(
      repos,
      'maximum_loss',
      StageRuleType.PERCENTAGE,
      'Maximum Loss',
      'Maximum allowed overall loss',
    );
    const ruleDrawdownType = await ensureRule(
      repos,
      'maximum_drawdown_type',
      StageRuleType.STRING,
      'Maximum Drawdown',
      'Type of maximum drawdown (e.g., Static)',
    );
    const ruleMinTradingPeriod = await ensureRule(
      repos,
      'minimum_trading_period',
      StageRuleType.STRING,
      'Minimum Trading Period',
      'Minimum trading days/period for the phase',
    );
    const ruleTradingPeriod = await ensureRule(
      repos,
      'trading_period',
      StageRuleType.STRING,
      'Trading Period',
      'Allowed trading period duration for the phase',
    );

    // 2) Balances (account sizes)
    const balances = {
      '10k': await ensureBalance(repos, '10k', 10_000),
      '25k': await ensureBalance(repos, '25k', 25_000),
      '50k': await ensureBalance(repos, '50k', 50_000),
      '100k': await ensureBalance(repos, '100k', 100_000),
      '200k': await ensureBalance(repos, '200k', 200_000),
    } as const;

    // 3) A single plan to bind the categories (can be extended later)
    const defaultPlan = await ensurePlan(repos, 'Default');

    // 4) Categories and pricing
    type PriceMap = Record<'10k' | '25k' | '50k' | '100k' | '200k', number>;

    const datasets: Array<{
      categoryName: string;
      prices: PriceMap;
      stages: (args: { relationStageID: string }) => Promise<void>;
    }> = [
      {
        categoryName: 'STANDARD 2-STEP CHALLENGE',
        prices: { '10k': 84, '25k': 212, '50k': 355, '100k': 562, '200k': 998 },
        stages: async ({ relationStageID }) => { /* no-op per phase, we add below per phase */ },
      },
      {
        categoryName: '1-STEP HERO CHALLENGE',
        prices: { '10k': 141, '25k': 284, '50k': 427, '100k': 695, '200k': 1281 },
        stages: async ({ relationStageID }) => { /* handled below */ },
      },
      {
        categoryName: 'FAST PASS CHALLENGES',
        prices: { '10k': 210, '25k': 490, '50k': 820, '100k': 1280, '200k': 2200 },
        stages: async ({ relationStageID }) => { /* handled below */ },
      },
    ];

    for (const data of datasets) {
      const category = await ensureCategory(repos, data.categoryName);
      const relation = await ensureRelation(repos, category.categoryID, defaultPlan.planID);

      // Prices per balance
      await ensureRelationBalance(repos, relation.relationID, balances['10k'].balanceID, data.prices['10k']);
      await ensureRelationBalance(repos, relation.relationID, balances['25k'].balanceID, data.prices['25k']);
      await ensureRelationBalance(repos, relation.relationID, balances['50k'].balanceID, data.prices['50k']);
      await ensureRelationBalance(repos, relation.relationID, balances['100k'].balanceID, data.prices['100k']);
      await ensureRelationBalance(repos, relation.relationID, balances['200k'].balanceID, data.prices['200k']);

      // Stage parameters per category
      if (data.categoryName === 'STANDARD 2-STEP CHALLENGE') {
        const rs1 = await ensureRelationStage(repos, relation.relationID, stage1.stageID, 1);
        await ensureParameter(repos, ruleProfitTarget.ruleID, rs1.relationStageID, '8%');
        await ensureParameter(repos, ruleDailyLoss.ruleID, rs1.relationStageID, '6%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rs1.relationStageID, '12%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rs1.relationStageID, 'Static');

        const rs2 = await ensureRelationStage(repos, relation.relationID, stage2.stageID, 2);
        await ensureParameter(repos, ruleProfitTarget.ruleID, rs2.relationStageID, '5%');
        await ensureParameter(repos, ruleDailyLoss.ruleID, rs2.relationStageID, '6%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rs2.relationStageID, '12%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rs2.relationStageID, 'Static');

        const rsF = await ensureRelationStage(repos, relation.relationID, stageFunded.stageID, 3);
        await ensureParameter(repos, ruleDailyLoss.ruleID, rsF.relationStageID, '5%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rsF.relationStageID, '10%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rsF.relationStageID, 'Static');
      }

      if (data.categoryName === '1-STEP HERO CHALLENGE') {
        const rs1 = await ensureRelationStage(repos, relation.relationID, stage1.stageID, 1);
        await ensureParameter(repos, ruleProfitTarget.ruleID, rs1.relationStageID, '10%');
        await ensureParameter(repos, ruleDailyLoss.ruleID, rs1.relationStageID, '4%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rs1.relationStageID, '8%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rs1.relationStageID, 'Static');
        await ensureParameter(repos, ruleMinTradingPeriod.ruleID, rs1.relationStageID, '5 days');

        const rsF = await ensureRelationStage(repos, relation.relationID, stageFunded.stageID, 2);
        await ensureParameter(repos, ruleDailyLoss.ruleID, rsF.relationStageID, '4%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rsF.relationStageID, '7%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rsF.relationStageID, 'Static');
      }

      if (data.categoryName === 'FAST PASS CHALLENGES') {
        const rs1 = await ensureRelationStage(repos, relation.relationID, stage1.stageID, 1);
        await ensureParameter(repos, ruleProfitTarget.ruleID, rs1.relationStageID, '6%');
        await ensureParameter(repos, ruleDailyLoss.ruleID, rs1.relationStageID, '5%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rs1.relationStageID, '8%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rs1.relationStageID, 'Static');
        await ensureParameter(repos, ruleMinTradingPeriod.ruleID, rs1.relationStageID, '5 days');
        await ensureParameter(repos, ruleTradingPeriod.ruleID, rs1.relationStageID, 'No Time Limit');

        const rsF = await ensureRelationStage(repos, relation.relationID, stageFunded.stageID, 2);
        await ensureParameter(repos, ruleDailyLoss.ruleID, rsF.relationStageID, '3%');
        await ensureParameter(repos, ruleMaxLoss.ruleID, rsF.relationStageID, '7%');
        await ensureParameter(repos, ruleDrawdownType.ruleID, rsF.relationStageID, 'Static');
        await ensureParameter(repos, ruleTradingPeriod.ruleID, rsF.relationStageID, 'No Time Limit');
      }
    }

    console.log('🎉 Seed de challenge-templates completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de challenge-templates:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
