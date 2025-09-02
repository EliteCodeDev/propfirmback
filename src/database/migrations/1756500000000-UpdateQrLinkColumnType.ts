import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQrLinkColumnType1756500000000 implements MigrationInterface {
  name = 'UpdateQrLinkColumnType1756500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Certificate" ALTER COLUMN "qrLink" TYPE text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Certificate" ALTER COLUMN "qrLink" TYPE character varying(255)`
    );
  }
}