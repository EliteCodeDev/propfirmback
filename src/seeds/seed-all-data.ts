/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Master seed file that runs all individual seed files in the correct order
 * to ensure proper data dependencies and relationships.
 */

const SEED_FILES = [
  // 1. Core entities first (no dependencies)
  'seed-users-realistic.ts',
  'seed-affiliates.ts',
  'seed-broker-accounts-realistic.ts',
  'seed-challenge-templates-comprehensive.ts',
  
  // 2. Entities that depend on users and templates
  'seed-challenges-realistic.ts',
  
  // 3. Entities that depend on challenges and users
  'seed-orders.ts',
  'seed-certificates.ts',
  'seed-withdrawals.ts',
  'seed-verifications.ts',
];

interface SeedResult {
  file: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runSeedFile(seedFile: string): Promise<SeedResult> {
  const startTime = Date.now();
  const seedPath = path.join(__dirname, seedFile);
  
  console.log(`\n🚀 Ejecutando: ${seedFile}`);
  console.log('=' .repeat(50));
  
  try {
    // Use ts-node to run TypeScript files directly
    execSync(`npx ts-node "${seedPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ ${seedFile} completado en ${duration}ms`);
    
    return {
      file: seedFile,
      success: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`\n❌ Error en ${seedFile}:`, errorMessage);
    
    return {
      file: seedFile,
      success: false,
      duration,
      error: errorMessage,
    };
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    console.log('🌱 INICIANDO SEED COMPLETO DE LA BASE DE DATOS');
    console.log('=' .repeat(60));
    console.log(`📁 Directorio de seeds: ${__dirname}`);
    console.log(`📋 Archivos a ejecutar: ${SEED_FILES.length}`);
    console.log('\n📝 Orden de ejecución:');
    SEED_FILES.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    const results: SeedResult[] = [];
    const totalStartTime = Date.now();
    
    // Execute seed files sequentially
    for (const seedFile of SEED_FILES) {
      const result = await runSeedFile(seedFile);
      results.push(result);
      
      // If a seed fails, ask if we should continue
      if (!result.success) {
        console.log('\n⚠️  Seed falló. Continuando con el siguiente...');
        // In production, you might want to stop here:
        // break;
      }
      
      // Small delay between seeds
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const totalDuration = Date.now() - totalStartTime;
    
    // Print summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Exitosos: ${successful.length}/${results.length}`);
    successful.forEach(result => {
      console.log(`   ✓ ${result.file} (${result.duration}ms)`);
    });
    
    if (failed.length > 0) {
      console.log(`\n❌ Fallidos: ${failed.length}/${results.length}`);
      failed.forEach(result => {
        console.log(`   ✗ ${result.file} (${result.duration}ms)`);
        if (result.error) {
          console.log(`     Error: ${result.error.substring(0, 100)}...`);
        }
      });
    }
    
    console.log(`\n⏱️  Tiempo total: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    
    if (failed.length === 0) {
      console.log('\n🎉 ¡TODOS LOS SEEDS EJECUTADOS EXITOSAMENTE!');
      console.log('\n🗄️  La base de datos ha sido poblada con datos realistas:');
      console.log('   👥 Usuarios con perfiles completos');
      console.log('   🤝 Sistema de afiliados con jerarquías');
      console.log('   💼 Cuentas de broker configuradas');
      console.log('   📋 Templates de challenges completos');
      console.log('   🎯 Challenges en diferentes estados');
      console.log('   🛒 Órdenes de compra variadas');
      console.log('   🏆 Certificados para challenges aprobados');
      console.log('   💸 Retiros en diferentes estados');
      console.log('   📄 Verificaciones KYC completas');
      console.log('\n✨ ¡El sistema está listo para desarrollo y testing!');
    } else {
      console.log('\n⚠️  Algunos seeds fallaron. Revisa los errores arriba.');
      process.exitCode = 1;
    }
    
  } catch (err) {
    console.error('❌ Error crítico durante la ejecución de seeds:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Proceso interrumpido por el usuario');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Proceso terminado');
  process.exit(1);
});

bootstrap();