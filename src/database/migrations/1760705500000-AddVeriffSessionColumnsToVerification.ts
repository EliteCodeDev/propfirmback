import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVeriffSessionColumnsToVerification1760705500000 implements MigrationInterface {
  name = 'AddVeriffSessionColumnsToVerification1760705500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'Verification',
      new TableColumn({
        name: 'veriffSessionUrl',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'Verification',
      new TableColumn({
        name: 'veriffSessionId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('Verification', 'veriffSessionId');
    await queryRunner.dropColumn('Verification', 'veriffSessionUrl');
  }
}