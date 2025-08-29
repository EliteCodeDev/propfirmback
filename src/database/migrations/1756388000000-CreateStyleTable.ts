import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStyleTable1756388000000 implements MigrationInterface {
    name = 'CreateStyleTable1756388000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Style" (
                "styleID" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "primaryColor" character varying(7) NOT NULL,
                "secondaryColor" character varying(7) NOT NULL,
                "tertiaryColor" character varying(7) NOT NULL,
                "banner" character varying(255),
                "companyName" character varying(150) NOT NULL,
                "landingURL" character varying(255),
                "isActive" boolean NOT NULL DEFAULT true,
                "name" character varying(100),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_Style_styleID" PRIMARY KEY ("styleID")
            )
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."primaryColor" IS 'Primary color in hex format (e.g., #FF5733)'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."secondaryColor" IS 'Secondary color in hex format (e.g., #33FF57)'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."tertiaryColor" IS 'Tertiary color in hex format (e.g., #3357FF)'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."banner" IS 'Banner image URL or path'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."companyName" IS 'Company name for branding'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."landingURL" IS 'Landing page URL'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."isActive" IS 'Whether this style is active'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "Style"."name" IS 'Style name or identifier'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Style"`);
    }
}