/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { ChallengeCategory } from '../modules/challenge-templates/entities/challenge-category.entity';
import { ChallengePlan } from '../modules/challenge-templates/entities/challenge-plan.entity';
import { ChallengeRelation } from '../modules/challenge-templates/entities/challenge-relation.entity';
import { ChallengeBalance } from '../modules/challenge-templates/entities/balance/challenge-balance.entity';
import { RelationBalance } from '../modules/challenge-templates/entities/balance/relation-balance.entity';
import { ChallengeStage } from '../modules/challenge-templates/entities/stage/challenge-stage.entity';
import { RelationStage } from '../modules/challenge-templates/entities/stage/relation-stage.entity';
import { StageRule } from '../modules/challenge-templates/entities/stage/stage-rule.entity';
import { StageParameter } from '../modules/challenge-templates/entities/stage/stage-parameter.entity';
import { StageRuleType } from '../common/enums/stage-rule-type.enum';

async function ensureCategory(
  ds: DataSource,
  name: string
): Promise<ChallengeCategory> {
  const categoryRepo = ds.getRepository(ChallengeCategory);
  
  let category = await categoryRepo.findOne({ where: { name } });
  if (!category) {
    category = categoryRepo.create({ name });
    await categoryRepo.save(category);
    console.log(`✅ Categoría creada: ${name}`);
  }
  
  return category;
}

async function ensurePlan(
  ds: DataSource,
  name: string,
  wooID?: number
): Promise<ChallengePlan> {
  const planRepo = ds.getRepository(ChallengePlan);
  
  let plan = await planRepo.findOne({ where: { name } });
  if (!plan) {
    plan = planRepo.create({
      name,
      isActive: true,
      wooID: wooID || null,
    });
    await planRepo.save(plan);
    console.log(`✅ Plan creado: ${name}`);
  }
  
  return plan;
}

async function ensureBalance(
  ds: DataSource,
  name: string,
  balance: number,
  hasDiscount: boolean = false,
  discount?: number
): Promise<ChallengeBalance> {
  const balanceRepo = ds.getRepository(ChallengeBalance);
  
  let challengeBalance = await balanceRepo.findOne({ where: { name } });
  if (!challengeBalance) {
    challengeBalance = balanceRepo.create({
      name,
      balance,
      isActive: true,
      hasDiscount,
      discount: discount || null,
    });
    await balanceRepo.save(challengeBalance);
    console.log(`✅ Balance creado: ${name} - $${balance}`);
  }
  
  return challengeBalance;
}

async function ensureStage(
  ds: DataSource,
  name: string
): Promise<ChallengeStage> {
  const stageRepo = ds.getRepository(ChallengeStage);
  
  let stage = await stageRepo.findOne({ where: { name } });
  if (!stage) {
    stage = stageRepo.create({ name });
    await stageRepo.save(stage);
    console.log(`✅ Stage creado: ${name}`);
  }
  
  return stage;
}

async function ensureRule(
  ds: DataSource,
  ruleSlug: string,
  ruleName: string,
  ruleDescription: string,
  ruleType: StageRuleType
): Promise<StageRule> {
  const ruleRepo = ds.getRepository(StageRule);
  
  let rule = await ruleRepo.findOne({ where: { ruleSlug } });
  if (!rule) {
    rule = ruleRepo.create({
      ruleSlug,
      ruleName,
      ruleDescription,
      ruleType,
    });
    await ruleRepo.save(rule);
    console.log(`✅ Regla creada: ${ruleSlug}`);
  }
  
  return rule;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    
    console.log('🚀 Iniciando seed de challenge templates...');
    
    // 1. Crear categorías
    console.log('\n📁 Creando categorías...');
    const categories = await Promise.all([
      ensureCategory(ds, 'Two-Step Challenge'),
      ensureCategory(ds, 'One-Step Challenge'),
      ensureCategory(ds, 'Instant Funding'),
      ensureCategory(ds, 'Evaluation'),
      ensureCategory(ds, 'Funded Account'),
    ]);

    // 2. Crear planes
    console.log('\n📋 Creando planes...');
    const plans = await Promise.all([
      ensurePlan(ds, 'Standard Challenge', 1001),
      ensurePlan(ds, 'Aggressive Challenge', 1002),
      ensurePlan(ds, 'Conservative Challenge', 1003),
      ensurePlan(ds, 'Swing Trading Plan', 1004),
      ensurePlan(ds, 'Scalping Plan', 1005),
      ensurePlan(ds, 'News Trading Plan', 1006),
    ]);

    // 3. Crear balances típicos de prop firms
    console.log('\n💰 Creando balances...');
    const balances = await Promise.all([
      ensureBalance(ds, '$5,000 Account', 5000),
      ensureBalance(ds, '$10,000 Account', 10000),
      ensureBalance(ds, '$25,000 Account', 25000),
      ensureBalance(ds, '$50,000 Account', 50000),
      ensureBalance(ds, '$100,000 Account', 100000),
      ensureBalance(ds, '$200,000 Account', 200000),
      ensureBalance(ds, '$400,000 Account', 400000),
      ensureBalance(ds, '$10,000 Account - Discounted', 10000, true, 0.2),
      ensureBalance(ds, '$25,000 Account - Black Friday', 25000, true, 0.5),
    ]);

    // 4. Crear stages
    console.log('\n🎯 Creando stages...');
    const stages = await Promise.all([
      ensureStage(ds, 'Phase 1 - Evaluation'),
      ensureStage(ds, 'Phase 2 - Verification'),
      ensureStage(ds, 'Funded Account'),
      ensureStage(ds, 'Single Phase Evaluation'),
      ensureStage(ds, 'Instant Funding Setup'),
    ]);

    // 5. Crear reglas de trading típicas
    console.log('\n📏 Creando reglas...');
    const rules = await Promise.all([
      ensureRule(ds, 'profit_target', 'Profit Target', 'Target profit percentage to pass the phase', StageRuleType.PERCENTAGE),
      ensureRule(ds, 'max_daily_loss', 'Maximum Daily Loss', 'Maximum daily loss percentage allowed', StageRuleType.PERCENTAGE),
      ensureRule(ds, 'max_total_loss', 'Maximum Total Loss', 'Maximum total loss percentage allowed', StageRuleType.PERCENTAGE),
      ensureRule(ds, 'min_trading_days', 'Minimum Trading Days', 'Minimum number of trading days required', StageRuleType.NUMBER),
      ensureRule(ds, 'max_lot_size', 'Maximum Lot Size', 'Maximum lot size per trade', StageRuleType.NUMBER),
      ensureRule(ds, 'news_trading_allowed', 'News Trading Allowed', 'Whether news trading is permitted', StageRuleType.BOOLEAN),
      ensureRule(ds, 'weekend_holding', 'Weekend Holding', 'Whether positions can be held over weekends', StageRuleType.BOOLEAN),
      ensureRule(ds, 'ea_allowed', 'Expert Advisors Allowed', 'Whether automated trading is permitted', StageRuleType.BOOLEAN),
      ensureRule(ds, 'profit_split', 'Profit Split', 'Trader profit split percentage', StageRuleType.PERCENTAGE),
      ensureRule(ds, 'consistency_rule', 'Consistency Rule', 'Maximum percentage of profit from single day', StageRuleType.PERCENTAGE),
      ensureRule(ds, 'copy_trading', 'Copy Trading Allowed', 'Whether copy trading is permitted', StageRuleType.BOOLEAN),
      ensureRule(ds, 'martingale_allowed', 'Martingale Strategy', 'Whether martingale strategy is allowed', StageRuleType.BOOLEAN),
    ]);

    // 6. Crear relaciones entre categorías y planes
    console.log('\n🔗 Creando relaciones...');
    const relationRepo = ds.getRepository(ChallengeRelation);
    const relationBalanceRepo = ds.getRepository(RelationBalance);
    const relationStageRepo = ds.getRepository(RelationStage);
    const stageParameterRepo = ds.getRepository(StageParameter);

    // === RELACIÓN 1: Two-Step Challenge + Standard Plan ===
    const twoStepCategory = categories[0];
    const standardPlan = plans[0];
    
    let relation1 = await relationRepo.findOne({
      where: { categoryID: twoStepCategory.categoryID, planID: standardPlan.planID }
    });
    
    if (!relation1) {
      relation1 = relationRepo.create({
        categoryID: twoStepCategory.categoryID,
        planID: standardPlan.planID,
      });
      await relationRepo.save(relation1);
      console.log('✅ Relación creada: Two-Step + Standard Plan');
    }

    // Crear balances para esta relación
    const standardPrices = [155, 250, 345, 540, 1080];
    for (let i = 0; i < 5; i++) {
      const balance = balances[i];
      
      const existingRelationBalance = await relationBalanceRepo.findOne({
        where: { balanceID: balance.balanceID, relationID: relation1.relationID }
      });
      
      if (!existingRelationBalance) {
        const relationBalance = relationBalanceRepo.create({
          balanceID: balance.balanceID,
          relationID: relation1.relationID,
          price: standardPrices[i],
          isActive: true,
          hasDiscount: false,
          discount: 0,
          wooID: 2000 + i,
        });
        await relationBalanceRepo.save(relationBalance);
      }
    }

    // Crear stages para esta relación
    const stageConfigs = [
      { stage: stages[0], phase: 1 }, // Phase 1
      { stage: stages[1], phase: 2 }, // Phase 2
      { stage: stages[2], phase: 3 }, // Funded
    ];

    const relationStages = [];
    for (const config of stageConfigs) {
      let relationStage = await relationStageRepo.findOne({
        where: { stageID: config.stage.stageID, relationID: relation1.relationID }
      });
      
      if (!relationStage) {
        relationStage = relationStageRepo.create({
          stageID: config.stage.stageID,
          relationID: relation1.relationID,
          numPhase: config.phase,
        });
        await relationStageRepo.save(relationStage);
      }
      relationStages.push(relationStage);
    }

    // Crear parámetros para cada stage
    const stageParameterConfigs = [
      // Phase 1 parameters
      {
        stageIndex: 0,
        parameters: [
          { ruleIndex: 0, value: '8' }, // profit_target: 8%
          { ruleIndex: 1, value: '5' }, // max_daily_loss: 5%
          { ruleIndex: 2, value: '10' }, // max_total_loss: 10%
          { ruleIndex: 3, value: '4' }, // min_trading_days: 4
          { ruleIndex: 4, value: '10' }, // max_lot_size: 10
          { ruleIndex: 5, value: 'false' }, // news_trading_allowed: false
          { ruleIndex: 6, value: 'false' }, // weekend_holding: false
          { ruleIndex: 7, value: 'true' }, // ea_allowed: true
        ]
      },
      // Phase 2 parameters
      {
        stageIndex: 1,
        parameters: [
          { ruleIndex: 0, value: '5' }, // profit_target: 5%
          { ruleIndex: 1, value: '5' }, // max_daily_loss: 5%
          { ruleIndex: 2, value: '10' }, // max_total_loss: 10%
          { ruleIndex: 3, value: '4' }, // min_trading_days: 4
          { ruleIndex: 4, value: '10' }, // max_lot_size: 10
          { ruleIndex: 5, value: 'false' }, // news_trading_allowed: false
          { ruleIndex: 6, value: 'false' }, // weekend_holding: false
          { ruleIndex: 7, value: 'true' }, // ea_allowed: true
        ]
      },
      // Funded Account parameters
      {
        stageIndex: 2,
        parameters: [
          { ruleIndex: 1, value: '5' }, // max_daily_loss: 5%
          { ruleIndex: 2, value: '10' }, // max_total_loss: 10%
          { ruleIndex: 4, value: '10' }, // max_lot_size: 10
          { ruleIndex: 5, value: 'true' }, // news_trading_allowed: true
          { ruleIndex: 6, value: 'true' }, // weekend_holding: true
          { ruleIndex: 7, value: 'true' }, // ea_allowed: true
          { ruleIndex: 8, value: '80' }, // profit_split: 80%
          { ruleIndex: 9, value: '50' }, // consistency_rule: 50%
        ]
      }
    ];

    for (const stageConfig of stageParameterConfigs) {
      const relationStage = relationStages[stageConfig.stageIndex];
      
      for (const param of stageConfig.parameters) {
        const rule = rules[param.ruleIndex];
        
        const existingParam = await stageParameterRepo.findOne({
          where: { ruleID: rule.ruleID, relationStageID: relationStage.relationStageID }
        });
        
        if (!existingParam) {
          const stageParam = stageParameterRepo.create({
            ruleID: rule.ruleID,
            relationStageID: relationStage.relationStageID,
            ruleValue: param.value,
            isActive: true,
          });
          await stageParameterRepo.save(stageParam);
        }
      }
    }

    // === RELACIÓN 2: One-Step Challenge + Aggressive Plan ===
    const oneStepCategory = categories[1];
    const aggressivePlan = plans[1];
    
    let relation2 = await relationRepo.findOne({
      where: { categoryID: oneStepCategory.categoryID, planID: aggressivePlan.planID }
    });
    
    if (!relation2) {
      relation2 = relationRepo.create({
        categoryID: oneStepCategory.categoryID,
        planID: aggressivePlan.planID,
      });
      await relationRepo.save(relation2);
      console.log('✅ Relación creada: One-Step + Aggressive Plan');
    }

    // Crear balances para one-step (precios más altos)
    const oneStepPrices = [189, 289, 389, 589];
    for (let i = 0; i < 4; i++) {
      const balance = balances[i + 1]; // Empezar desde $10k
      
      const existingRelationBalance = await relationBalanceRepo.findOne({
        where: { balanceID: balance.balanceID, relationID: relation2.relationID }
      });
      
      if (!existingRelationBalance) {
        const relationBalance = relationBalanceRepo.create({
          balanceID: balance.balanceID,
          relationID: relation2.relationID,
          price: oneStepPrices[i],
          isActive: true,
          hasDiscount: false,
          discount: 0,
          wooID: 3000 + i,
        });
        await relationBalanceRepo.save(relationBalance);
      }
    }

    // Single phase para one-step
    let oneStepStage = await relationStageRepo.findOne({
      where: { stageID: stages[3].stageID, relationID: relation2.relationID }
    });
    
    if (!oneStepStage) {
      oneStepStage = relationStageRepo.create({
        stageID: stages[3].stageID, // Single Phase Evaluation
        relationID: relation2.relationID,
        numPhase: 1,
      });
      await relationStageRepo.save(oneStepStage);
    }

    // Parámetros más agresivos para one-step
    const oneStepParameters = [
      { ruleIndex: 0, value: '10' }, // profit_target: 10%
      { ruleIndex: 1, value: '5' }, // max_daily_loss: 5%
      { ruleIndex: 2, value: '8' }, // max_total_loss: 8%
      { ruleIndex: 3, value: '3' }, // min_trading_days: 3
      { ruleIndex: 4, value: '5' }, // max_lot_size: 5 (más restrictivo)
      { ruleIndex: 5, value: 'false' }, // news_trading_allowed: false
      { ruleIndex: 6, value: 'false' }, // weekend_holding: false
      { ruleIndex: 7, value: 'false' }, // ea_allowed: false (más restrictivo)
      { ruleIndex: 10, value: 'false' }, // copy_trading: false
      { ruleIndex: 11, value: 'false' }, // martingale_allowed: false
    ];

    for (const param of oneStepParameters) {
      const rule = rules[param.ruleIndex];
      
      const existingParam = await stageParameterRepo.findOne({
        where: { ruleID: rule.ruleID, relationStageID: oneStepStage.relationStageID }
      });
      
      if (!existingParam) {
        const stageParam = stageParameterRepo.create({
          ruleID: rule.ruleID,
          relationStageID: oneStepStage.relationStageID,
          ruleValue: param.value,
          isActive: true,
        });
        await stageParameterRepo.save(stageParam);
      }
    }

    // === RELACIÓN 3: Instant Funding + Conservative Plan ===
    const instantCategory = categories[2];
    const conservativePlan = plans[2];
    
    let relation3 = await relationRepo.findOne({
      where: { categoryID: instantCategory.categoryID, planID: conservativePlan.planID }
    });
    
    if (!relation3) {
      relation3 = relationRepo.create({
        categoryID: instantCategory.categoryID,
        planID: conservativePlan.planID,
      });
      await relationRepo.save(relation3);
      console.log('✅ Relación creada: Instant Funding + Conservative Plan');
    }

    // Balances para instant funding (precios más bajos)
    const instantPrices = [89, 139, 189];
    for (let i = 0; i < 3; i++) {
      const balance = balances[i];
      
      const existingRelationBalance = await relationBalanceRepo.findOne({
        where: { balanceID: balance.balanceID, relationID: relation3.relationID }
      });
      
      if (!existingRelationBalance) {
        const relationBalance = relationBalanceRepo.create({
          balanceID: balance.balanceID,
          relationID: relation3.relationID,
          price: instantPrices[i],
          isActive: true,
          hasDiscount: false,
          discount: 0,
          wooID: 4000 + i,
        });
        await relationBalanceRepo.save(relationBalance);
      }
    }

    // Setup stage para instant funding
    let instantStage = await relationStageRepo.findOne({
      where: { stageID: stages[4].stageID, relationID: relation3.relationID }
    });
    
    if (!instantStage) {
      instantStage = relationStageRepo.create({
        stageID: stages[4].stageID, // Instant Funding Setup
        relationID: relation3.relationID,
        numPhase: 1,
      });
      await relationStageRepo.save(instantStage);
    }

    // Parámetros más conservadores para instant funding
    const instantParameters = [
      { ruleIndex: 1, value: '3' }, // max_daily_loss: 3% (más conservador)
      { ruleIndex: 2, value: '6' }, // max_total_loss: 6% (más conservador)
      { ruleIndex: 4, value: '2' }, // max_lot_size: 2 (muy restrictivo)
      { ruleIndex: 5, value: 'false' }, // news_trading_allowed: false
      { ruleIndex: 6, value: 'false' }, // weekend_holding: false
      { ruleIndex: 7, value: 'false' }, // ea_allowed: false
      { ruleIndex: 8, value: '50' }, // profit_split: 50% (menor split)
      { ruleIndex: 10, value: 'false' }, // copy_trading: false
      { ruleIndex: 11, value: 'false' }, // martingale_allowed: false
    ];

    for (const param of instantParameters) {
      const rule = rules[param.ruleIndex];
      
      const existingParam = await stageParameterRepo.findOne({
        where: { ruleID: rule.ruleID, relationStageID: instantStage.relationStageID }
      });
      
      if (!existingParam) {
        const stageParam = stageParameterRepo.create({
          ruleID: rule.ruleID,
          relationStageID: instantStage.relationStageID,
          ruleValue: param.value,
          isActive: true,
        });
        await stageParameterRepo.save(stageParam);
      }
    }

    console.log('\n🎉 Seed de challenge templates completado exitosamente!');
    console.log('\n📊 Resumen de elementos creados:');
    console.log(`   📁 Categorías: ${categories.length}`);
    console.log(`   📋 Planes: ${plans.length}`);
    console.log(`   💰 Balances: ${balances.length}`);
    console.log(`   🎯 Stages: ${stages.length}`);
    console.log(`   📏 Reglas: ${rules.length}`);
    console.log(`   🔗 Relaciones principales: 3`);
    console.log('\n✨ El sistema de templates está listo para usar!');
    
  } catch (err) {
    console.error('❌ Error durante el seed de challenge templates:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();