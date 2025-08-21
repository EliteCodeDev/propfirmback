import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();
// es utilizado por el CLI de TypeORM para cargar las variables de entorno desde el archivo .env
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  // Buscar entidades solo dentro de carpetas "entities" (incluyendo subcarpetas)
  entities: ['src/**/entities/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  // Respetar la variable LOG_DB_QUERIES para mostrar/ocultar queries en CLI; mantener errores siempre si se usa array
  logging:
    process.env.LOG_DB_QUERIES === 'true' ? ['query', 'error'] : ['error'],
});
