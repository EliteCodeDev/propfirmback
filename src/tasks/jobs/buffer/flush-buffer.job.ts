import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';

@Injectable()
export class FlushBufferJob {
  private readonly logger = new Logger(FlushBufferJob.name);
  constructor(
    private readonly bufferService: BufferService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(ChallengeDetails)
    private readonly detailsRepo: Repository<ChallengeDetails>,
  ) {}

  // Cada minuto en el segundo 0 para persistir datos actualizados
  @Cron('30 * * * * *')
  async flush() {
    const entries = await this.bufferService.listEntries();
    const total = entries.length;
    if (total === 0) {
      this.logger.debug('FlushBufferJob: no hay cuentas en buffer');
      return;
    }

    this.logger.debug(`FlushBufferJob: iniciando flush de ${total} cuentas`);

    let persisted = 0;
    let skipped = 0;
    let failed = 0;

    for (const [login] of entries) {
      this.logger.debug(`FlushBufferJob: flush de ${login}`);
      try {
        await this.bufferService.withLock(login, async () => {
          this.logger.debug(
            `FlushBufferJob: flush de ${login} - lock obtenido`,
          );
          // 1) Snapshot inmutable del estado actual (ya estamos dentro del lock)
          const current = this.bufferService.getBuffer(login);
          if (!current) {
            skipped++;
            return;
          }

          const snapshot = JSON.parse(JSON.stringify(current));
          // this.logger.debug(
          //   `FlushBufferJob: flush de ${login} - snapshot: ${JSON.stringify(snapshot)}`,
          // );
          // 2) Resolver challenge activo por login de broker account
          const challenge = await this.challengeRepo
            .createQueryBuilder('c')
            .innerJoin('c.brokerAccount', 'ba')
            .where('ba.login = :login', { login })
            .andWhere('c.isActive = :isActive', { isActive: true })
            .orderBy('c.startDate', 'DESC')
            .getOne();

          if (!challenge) {
            // No hay challenge activo asociado -> omitir pero no borrar el buffer
            this.logger.warn(
              `FlushBufferJob: no se encontró Challenge activo para login=${login}`,
            );
            skipped++;
            return;
          }

          // 3) Mapear snapshot -> ChallengeDetails (upsert por PK challengeID)
          const payload: DeepPartial<ChallengeDetails> = {
            challengeID: challenge.challengeID,
            metaStats: snapshot.metaStats ?? null,
            positions: {
              openPositions: snapshot.openPositions ?? [],
              closedPositions: snapshot.closedPositions ?? [],
            },
            rulesValidation: snapshot.rulesEvaluation ?? null,
            lastUpdate: snapshot.lastUpdate
              ? new Date(snapshot.lastUpdate)
              : new Date(),
          };
          this.logger.debug(
            `GAAAAFlushBufferJob: flush de ${login} - payload: ${JSON.stringify(payload)}`,
          );
          const details = this.detailsRepo.create(payload);

          await this.detailsRepo.save(details);
          this.logger.debug(
            `FlushBufferJob: flush de ${login} - ChallengeDetails persistido`,
          );

          // 4) Mantener la cuenta en el buffer (no eliminar)
          // await this.bufferService.deleteAccount(login);
          this.logger.debug(
            `FlushBufferJob: flush de ${login} - datos persistidos, cuenta mantenida en buffer`,
          );
          persisted++;
        });
      } catch (err) {
        failed++;
        this.logger.error(
          `FlushBufferJob: error al persistir login=${login}: ${err?.message || err}`,
        );
      }
    }

    this.logger.debug(
      `FlushBufferJob: fin flush -> total=${total} persisted=${persisted} skipped=${skipped} failed=${failed}`,
    );
  }
}
