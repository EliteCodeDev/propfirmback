import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeBrokerAccountChallengeToOneToOne1757653873238 implements MigrationInterface {
    name = 'ChangeBrokerAccountChallengeToOneToOne1757653873238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" ADD "price" double precision DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" ADD "hasDiscount" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" ADD "discount" double precision DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "Challenge" DROP CONSTRAINT "FK_431d6d54f72952b3c33ac8eaa3a"`);
        await queryRunner.query(`ALTER TABLE "Challenge" ADD CONSTRAINT "UQ_431d6d54f72952b3c33ac8eaa3a" UNIQUE ("brokerAccountID")`);
        await queryRunner.query(`ALTER TABLE "Challenge" ADD CONSTRAINT "FK_431d6d54f72952b3c33ac8eaa3a" FOREIGN KEY ("brokerAccountID") REFERENCES "BrokerAccount"("brokerAccountID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Challenge" DROP CONSTRAINT "FK_431d6d54f72952b3c33ac8eaa3a"`);
        await queryRunner.query(`ALTER TABLE "Challenge" DROP CONSTRAINT "UQ_431d6d54f72952b3c33ac8eaa3a"`);
        await queryRunner.query(`ALTER TABLE "Challenge" ADD CONSTRAINT "FK_431d6d54f72952b3c33ac8eaa3a" FOREIGN KEY ("brokerAccountID") REFERENCES "BrokerAccount"("brokerAccountID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" DROP COLUMN "hasDiscount"`);
        await queryRunner.query(`ALTER TABLE "ChallengeAddon" DROP COLUMN "price"`);
    }

}
