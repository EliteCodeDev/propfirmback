import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeFlushQueries1756490900000 implements MigrationInterface {
  name = 'OptimizeFlushQueries1756490900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice compuesto para la consulta principal del flush job
    // Esta consulta busca challenges activos por login de broker account
    await queryRunner.query(`
      CREATE INDEX "IDX_Challenge_Active_BrokerLogin" 
      ON "Challenge" ("isActive", "brokerAccountID") 
      WHERE "isActive" = true
    `);

    // Índice para optimizar la búsqueda por login en BrokerAccount
    // Ya existe un índice único en login, pero agregamos uno específico para isUsed
    await queryRunner.query(`
      CREATE INDEX "IDX_BrokerAccount_Login_Used" 
      ON "BrokerAccount" ("login", "isUsed")
    `);

    // Índice para ChallengeDetails por challengeID (ya es PK pero optimizamos para upserts)
    await queryRunner.query(`
      CREATE INDEX "IDX_ChallengeDetails_LastUpdate" 
      ON "ChallengeDetails" ("challengeID", "lastUpdate")
    `);

    // Índice para optimizar consultas de challenges por usuario y estado
    await queryRunner.query(`
      CREATE INDEX "IDX_Challenge_User_Status_Active" 
      ON "Challenge" ("userID", "status", "isActive") 
      WHERE "isActive" = true
    `);

    // Índice para optimizar consultas por relationID y numPhase
    await queryRunner.query(`
      CREATE INDEX "IDX_Challenge_Relation_Phase" 
      ON "Challenge" ("relationID", "numPhase", "isActive")
    `);

    // Índice para optimizar búsquedas por startDate (usado en ORDER BY)
    await queryRunner.query(`
      CREATE INDEX "IDX_Challenge_StartDate_Active" 
      ON "Challenge" ("startDate" DESC, "isActive") 
      WHERE "isActive" = true
    `);

    // Índice para optimizar consultas de broker accounts no utilizados
    await queryRunner.query(`
      CREATE INDEX "IDX_BrokerAccount_Available" 
      ON "BrokerAccount" ("isUsed", "platform") 
      WHERE "isUsed" = false
    `);

    // Índice para optimizar consultas de challenge details por fecha de actualización
    await queryRunner.query(`
      CREATE INDEX "IDX_ChallengeDetails_UpdateTime" 
      ON "ChallengeDetails" ("lastUpdate" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices en orden inverso
    await queryRunner.query(`DROP INDEX "IDX_ChallengeDetails_UpdateTime"`);
    await queryRunner.query(`DROP INDEX "IDX_BrokerAccount_Available"`);
    await queryRunner.query(`DROP INDEX "IDX_Challenge_StartDate_Active"`);
    await queryRunner.query(`DROP INDEX "IDX_Challenge_Relation_Phase"`);
    await queryRunner.query(`DROP INDEX "IDX_Challenge_User_Status_Active"`);
    await queryRunner.query(`DROP INDEX "IDX_ChallengeDetails_LastUpdate"`);
    await queryRunner.query(`DROP INDEX "IDX_BrokerAccount_Login_Used"`);
    await queryRunner.query(`DROP INDEX "IDX_Challenge_Active_BrokerLogin"`);
  }
}