import { MigrationInterface,QueryRunner } from "typeorm";


export class CoordenadasCertificadosMigration implements MigrationInterface {

    public async up(queryRunner: QueryRunner):Promise<void>{
        await queryRunner.query(`
            INSERT INTO certificate_coordinates (type, metadata) VALUES 
            (
                'withdrawal',
                '{
                    "qrX": -37,
                    "qrY": 215,
                    "Firma": "",
                    "dateX": 230,
                    "dateY": 168,
                    "nameX": 10,
                    "nameY": 2,
                    "qrBgX": 990,
                    "qrBgY": 930,
                    "dolarX": 13,
                    "dolarY": 110,
                    "firmaX": 85,
                    "firmaY": 230,
                    "montoX": 8,
                    "montoY": 100,
                    "qrSize": 75,
                    "montoSize": 40,
                    "firmaWidth": 170,
                    "firmaHeight": 135,
                    "dateFontSize": 22,
                    "nameFontSize": 45,
                    "qrBackgroundSize": 25
                }'::jsonb
            ),
            (
                'phase1',
                '{
                    "qrX": -37,
                    "qrY": 200,
                    "Firma": "",
                    "dateX": 230,
                    "dateY": 155,
                    "nameX": 10,
                    "nameY": 2,
                    "qrBgX": 990,
                    "qrBgY": 930,
                    "firmaX": 85,
                    "firmaY": 218,
                    "qrSize": 75,
                    "firmaWidth": 170,
                    "firmaHeight": 135,
                    "dateFontSize": 22,
                    "nameFontSize": 45,
                    "qrBackgroundSize": 25
                }'::jsonb
            ),
            (
                'phase2',
                '{
                    "qrX": -37,
                    "qrY": 200,
                    "Firma": "",
                    "dateX": 230,
                    "dateY": 155,
                    "nameX": 10,
                    "nameY": 2,
                    "qrBgX": 990,
                    "qrBgY": 930,
                    "firmaX": 85,
                    "firmaY": 218,
                    "qrSize": 75,
                    "firmaWidth": 170,
                    "firmaHeight": 135,
                    "dateFontSize": 22,
                    "nameFontSize": 45,
                    "qrBackgroundSize": 25
                }'::jsonb
            ),
            (
                'phase3',
                '{
                    "qrX": -37,
                    "qrY": 200,
                    "Firma": "",
                    "dateX": 230,
                    "dateY": 155,
                    "nameX": 10,
                    "nameY": 2,
                    "qrBgX": 990,
                    "qrBgY": 930,
                    "firmaX": 85,
                    "firmaY": 218,
                    "qrSize": 75,
                    "firmaWidth": 170,
                    "firmaHeight": 135,
                    "dateFontSize": 22,
                    "nameFontSize": 45,
                    "qrBackgroundSize": 25
                }'::jsonb
            ),
            (
                'real',
                '{
                    "qrX": -37,
                    "qrY": 200,
                    "Firma": "",
                    "dateX": 230,
                    "dateY": 170,
                    "nameX": 10,
                    "nameY": 2,
                    "qrBgX": 990,
                    "qrBgY": 930,
                    "firmaX": 85,
                    "firmaY": 218,
                    "qrSize": 75,
                    "firmaWidth": 170,
                    "firmaHeight": 135,
                    "dateFontSize": 22,
                    "nameFontSize": 45,
                    "qrBackgroundSize": 25
                }'::jsonb
            )
            ON CONFLICT (type) DO NOTHING
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM certificate_coordinates WHERE type IN ('withdrawal', 'phase1', 'phase2', 'phase3', 'real')
        `)
    }

}