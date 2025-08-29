import { DataSource } from 'typeorm';
import { Style } from '../modules/styles/entities/style.entity';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'propfirm',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Style],
  synchronize: false,
});

async function seedStyles() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Check if ACTIVAR_STYLE is enabled
    const activarStyle = process.env.ACTIVAR_STYLE?.toLowerCase() === 'true';
    
    if (!activarStyle) {
      console.log('ACTIVAR_STYLE is not enabled, skipping style creation');
      return;
    }

    const styleRepository = AppDataSource.getRepository(Style);

    // Check if Default Style already exists
    const existingStyle = await styleRepository.findOne({
      where: { name: 'Default Style' },
    });

    if (existingStyle) {
      console.log('styleProp already exists, skipping seed');
      return;
    }

    // Create styleProp with environment variables
    const defaultStyle = styleRepository.create({
      name: 'Default Style',
      primaryColor: process.env.DEFAULT_PRIMARY_COLOR,
      secondaryColor: process.env.DEFAULT_SECONDARY_COLOR,
      tertiaryColor: process.env.DEFAULT_TERTIARY_COLOR,
      banner: process.env.DEFAULT_BANNER_URL || '',
      companyName: process.env.DEFAULT_COMPANY_NAME ,
      landingURL: process.env.DEFAULT_LANDING_URL ,
      isActive: true,
    });

    await styleRepository.save(defaultStyle);
    console.log('✅ Default style created successfully:', defaultStyle);
    console.log('Environment variables used:');
    console.log('- ACTIVAR_STYLE:', process.env.ACTIVAR_STYLE);
    console.log('- DEFAULT_PRIMARY_COLOR:', process.env.DEFAULT_PRIMARY_COLOR);
    console.log('- DEFAULT_SECONDARY_COLOR:', process.env.DEFAULT_SECONDARY_COLOR);
    console.log('- DEFAULT_TERTIARY_COLOR:', process.env.DEFAULT_TERTIARY_COLOR);
    console.log('- DEFAULT_BANNER_URL:', process.env.DEFAULT_BANNER_URL);
    console.log('- DEFAULT_COMPANY_NAME:', process.env.DEFAULT_COMPANY_NAME);
    console.log('- DEFAULT_LANDING_URL:', process.env.DEFAULT_LANDING_URL);

    console.log('🎉 Seed de estilos completado.');
  } catch (error) {
    console.error('❌ Error seeding styles:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

if (require.main === module) {
  seedStyles();
}

export { seedStyles };