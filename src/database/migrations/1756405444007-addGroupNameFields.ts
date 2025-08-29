import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupNameFields1756405444007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "ChallengeRelation"
            ADD COLUMN "groupName" VARCHAR(255);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
