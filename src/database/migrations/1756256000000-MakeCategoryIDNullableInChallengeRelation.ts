import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCategoryIDNullableInChallengeRelation1756256000000 implements MigrationInterface {
    name = 'MakeCategoryIDNullableInChallengeRelation1756256000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop NOT NULL constraint on categoryID
        await queryRunner.query(`ALTER TABLE "ChallengeRelation" ALTER COLUMN "categoryID" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-apply NOT NULL (will fail if there are rows with NULL categoryID)
        await queryRunner.query(`ALTER TABLE "ChallengeRelation" ALTER COLUMN "categoryID" SET NOT NULL`);
    }
}