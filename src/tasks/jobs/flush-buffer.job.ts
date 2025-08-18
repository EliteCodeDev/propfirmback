import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';

@Injectable()
export class FlushBufferJob {
  private readonly logger = new Logger(FlushBufferJob.name);
  constructor(
    private readonly buffer: BufferService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(ChallengeDetails)
    private readonly detailsRepo: Repository<ChallengeDetails>,
  ) {}

  // Segundo 0 de cada décimo minuto
  @Cron('0 0/10 * * * *')
  async flush() {
    // const entries = await this.buffer.listEntries();
    // const total = entries.length;
    // if (total === 0) {
    //   this.logger.debug('FlushBufferJob: no hay cuentas en buffer');
    //   return;
    // }

    // this.logger.debug(`FlushBufferJob: iniciando flush de ${total} cuentas`);

    // let persisted = 0;
    // let skipped = 0;
    // let failed = 0;

    // for (const [login] of entries) {
    //   try {
    //     await this.buffer.withLock(login, async () => {
    //       // 1) Snapshot inmutable del estado actual
    //       const current = await this.buffer.getAccount(login);
    //       if (!current) {
    //         skipped++;
    //         return;
    //       }
    //       const snapshot = JSON.parse(JSON.stringify(current));

    //       // 2) Resolver challenge activo por login de broker account
    //       const challenge = await this.challengeRepo
    //         .createQueryBuilder('c')
    //         .innerJoin('c.brokerAccount', 'ba')
    //         .where('ba.login = :login', { login })
    //         .andWhere('c.isActive = :isActive', { isActive: true })
    //         .orderBy('c.startDate', 'DESC')
    //         .getOne();

    //       if (!challenge) {
    //         // No hay challenge activo asociado -> omitir pero no borrar el buffer
    //         this.logger.warn(
    //           `FlushBufferJob: no se encontró Challenge activo para login=${login}`,
    //         );
    //         skipped++;
    //         return;
    //       }

    //       // 3) Mapear snapshot -> ChallengeDetails (upsert por PK challengeID)
    //       const details = this.detailsRepo.create({
    //         challengeID: challenge.challengeID,
    //         metaStats: snapshot.metaStats
    //           ? JSON.stringify(snapshot.metaStats)
    //           : null,
    //         positions: JSON.stringify({
    //           openPositions: snapshot.openPositions ?? null,
    //           closedPositions: snapshot.closedPositions ?? null,
    //         }),
    //         rulesValidation: snapshot.validation
    //           ? JSON.stringify(snapshot.validation)
    //           : null,
    //         lastUpdate: snapshot.lastUpdate
    //           ? new Date(snapshot.lastUpdate)
    //           : new Date(),
    //       });

    //       await this.detailsRepo.save(details);

    //       // 4) Liberar el recurso siempre (el lock evita escrituras concurrentes)
    //       await this.buffer.delete(login);
    //       persisted++;
    //     });
    //   } catch (err) {
    //     failed++;
    //     this.logger.error(
    //       `FlushBufferJob: error al persistir login=${login}: ${err?.message || err}`,
    //     );
    //   }
    // }

    // this.logger.debug(
    //   `FlushBufferJob: fin flush -> total=${total} persisted=${persisted} skipped=${skipped} failed=${failed}`,
    // );
  }
}
