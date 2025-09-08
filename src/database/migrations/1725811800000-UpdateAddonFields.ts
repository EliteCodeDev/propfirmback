import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAddonFields1725811800000 implements MigrationInterface {
    name = 'UpdateAddonFields1725811800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'value' column to RelationAddon table
        await queryRunner.query(`ALTER TABLE "RelationAddon" ADD "value" json`);
        
        // Add 'slugRule' column to Addons table
        await queryRunner.query(`ALTER TABLE "Addons" ADD "slugRule" character varying`);
        
        // Add 'value' column to ChallengeAddon table (already done in entity)
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" ADD "value" json`);
        
        // Remove 'price' column from ChallengeAddon table if it exists
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" DROP COLUMN IF EXISTS "price"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse the changes
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" ADD "price" double precision`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "Addons" DROP COLUMN "slugRule"`);
        await queryRunner.query(`ALTER TABLE "RelationAddon" DROP COLUMN "value"`);
    }
}