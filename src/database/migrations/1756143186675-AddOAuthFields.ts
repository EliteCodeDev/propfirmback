import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOAuthFields1756143186675 implements MigrationInterface {
    name = 'AddOAuthFields1756143186675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserAccount" ADD "googleId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "UserAccount" ADD "provider" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "UserAccount" ADD "avatar" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserAccount" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "UserAccount" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "UserAccount" DROP COLUMN "googleId"`);
    }

}
