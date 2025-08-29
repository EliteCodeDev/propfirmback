import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';

@Injectable()
export class UpdateDailyBalanceJob {
  private readonly logger = new Logger(UpdateDailyBalanceJob.name);
  
  constructor(
    private readonly bufferService: BufferService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
  ) {}

  @Cron('10 0 17 * * *', { timeZone: 'America/Lima' })
  async updateDailyBalance() {
    this.logger.log('Iniciando actualización de balance diario');
    
    const entries = await this.bufferService.listEntries();
    const total = entries.length;
    
    if (total === 0) {
      this.logger.debug('No hay cuentas en el buffer para procesar');
      return;
    }

    this.logger.debug(`Procesando ${total} cuentas del buffer`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const [login] of entries) {
      this.logger.debug(`Procesando cuenta ${login}`);
      try {
        await this.bufferService.withLock(login, async () => {
          this.logger.debug(
            `UpdateDailyBalanceJob: procesando ${login} - lock obtenido`,
          );
          
          // 1) Obtener snapshot del estado actual del buffer
          const current = this.bufferService.getBuffer(login);
          if (!current) {
            skipped++;
            return;
          }

          const currentBalance = current.balance?.currentBalance;
          if (currentBalance === undefined || currentBalance === null) {
            this.logger.warn(
              `UpdateDailyBalanceJob: no se encontró currentBalance para login=${login}`,
            );
            skipped++;
            return;
          }

          // 2) Resolver challenge activo por login de broker account
          const challenge = await this.challengeRepo
            .createQueryBuilder('c')
            .innerJoin('c.brokerAccount', 'ba')
            .where('ba.login = :login', { login })
            .andWhere('c.isActive = :isActive', { isActive: true })
            .orderBy('c.startDate', 'DESC')
            .getOne();

          if (!challenge) {
            this.logger.warn(
              `UpdateDailyBalanceJob: no se encontró Challenge activo para login=${login}`,
            );
            skipped++;
            return;
          }

          // 3) Actualizar el campo dynamicBalance del challenge
          await this.challengeRepo.update(
            { challengeID: challenge.challengeID },
            { dynamicBalance: currentBalance }
          );

          this.logger.debug(
            `UpdateDailyBalanceJob: dynamicBalance actualizado para challengeID=${challenge.challengeID} con valor=${currentBalance}`,
          );
          
          // 4) Actualizar también el dailyBalance en el buffer
          current.balance.dailyBalance = currentBalance;
          
          updated++;
        });
      } catch (err) {
        failed++;
        this.logger.error(
          `UpdateDailyBalanceJob: error al procesar login=${login}: ${err?.message || err}`,
        );
      }
    }

    this.logger.log(
      `UpdateDailyBalanceJob: fin actualización -> total=${total} updated=${updated} skipped=${skipped} failed=${failed}`,
    );
  }
}
