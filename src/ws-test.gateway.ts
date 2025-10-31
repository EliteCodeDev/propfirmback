import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WebSocket } from 'ws';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account, PositionsClassType, OpenPosition, ClosedPosition } from 'src/common/utils';
import { riskEvaluation } from 'src/common/functions/risk-evaluation';
import { ChallengeDetailsService } from 'src/modules/challenges/services/challenge-details.service';
import { ChallengeStatus } from 'src/common/enums';
import { ChallengesService } from 'src/modules/challenges/services/challenges.service';
import { getBasicRiskParams } from 'src/common/utils/mappers/account-mapper';

export interface WebSocketData {
  lastMessage?: any;
  status: 'Conectado' | 'Desconectado' | 'Error';
}

@Injectable()
export class WSTestGateway implements OnModuleInit {
  private urls = [
    'ws://69.30.199.194:6704/ws?type=pos',
    'ws://69.30.199.194:6704/ws?type=account',
    'ws://69.30.199.194:6704/ws?type=deal',
  ];

  private connections: Record<string, WebSocketData> = {};
  // Evita disparos repetidos de desaprobación en ventanas cortas
  private disapprovalDebounce: Map<string, number> = new Map();
  private readonly logger = new Logger(WSTestGateway.name);

  constructor(
    private readonly bufferService: BufferService,
    private readonly challengeDetailsService: ChallengeDetailsService,
    private readonly challengesService: ChallengesService,
  ) {}

  onModuleInit() {
    console.log('Iniciando pruebas de WebSockets...');
    this.urls.forEach((url) => this.connectToServer(url));
  }

  private connectToServer(url: string) {
    const type = url.split('?type=')[1];
    const ws = new WebSocket(url);

    this.connections[type] = { status: 'Desconectado' };

    ws.on('open', () => {
      this.connections[type].status = 'Conectado';
      console.log(`Conectado a: ${url}`);
    });

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        this.connections[type].lastMessage = parsed;
        console.log(`[${type}]`, parsed);

        // Ingestar en buffer y evaluar reglas en tiempo real
        this.ingestMessage(type, parsed).catch((err) =>
          this.logger.error(`Error procesando mensaje WS (${type}): ${err?.message || err}`),
        );
      } catch {
        this.connections[type].lastMessage = msg.toString();
        console.log(`[${type}]`, msg.toString());
      }
    });

    ws.on('error', (err) => {
      this.connections[type].status = 'Error';
      console.error(`Error en ${url}:`, err.message);
    });

    ws.on('close', () => {
      this.connections[type].status = 'Desconectado';
      console.log(`🔌 Conexión cerrada con ${url}, reintentando en 5s...`);
      setTimeout(() => this.connectToServer(url), 5000);
    });
  }

  // 🔹 Endpoint para ver todos los datos
  getStatus() {
    return this.connections;
  }

  /**
   * Ingesta mensajes WS en el buffer por tipo y actualiza reglas
   */
  private async ingestMessage(type: string, data: any) {
    switch (type) {
      case 'account':
        await this.processAccountData(data);
        break;
      case 'pos':
        await this.processOpenPositions(data);
        break;
      case 'deal':
        await this.processClosedPositions(data);
        break;
      default:
        this.logger.warn(`Tipo de mensaje WS no reconocido: ${type}`);
    }
  }

  /**
   * Procesa y actualiza datos de cuenta (balance/equity)
   */
  private async processAccountData(payload: any) {
    // Algunos proveedores envían objeto único; otros, arrays
    const items = Array.isArray(payload) ? payload : [payload];

    for (const item of items) {
      const rawLogin = String(item.loginID ?? item.login ?? item.account ?? '').trim();
      if (!rawLogin) continue;
      const login = this.getCanonicalLogin(rawLogin);

      await this.bufferService.withLock(login, async () => {
        let acc = this.bufferService.getBuffer(login);
        // Migrar datos si existen bajo clave no normalizada
        if (!acc && rawLogin !== login) {
          const oldAcc = this.bufferService.getBuffer(rawLogin);
          if (oldAcc) {
            oldAcc.login = login;
            this.bufferService.deleteBuffer(rawLogin);
            this.bufferService.insertBuffer(login, oldAcc);
            acc = oldAcc;
            this.logger.debug(`WS: migrada cuenta de '${rawLogin}' a '${login}' (account)`);
          }
        }
        if (!acc) {
          // Crear cuenta base usando datos del Challenge para inicializar balances y reglas
          const challenge = await this.challengesService.findByBrokerLogin(login);
          const base = new Account('', login);
          base.challengeId = challenge?.challengeID || '';
          const init = Number(challenge?.brokerAccount?.innitialBalance ?? 0) || 0;
          const dyn = Number(challenge?.dynamicBalance ?? 0) || 0;
          base.balance = {
            initialBalance: init,
            currentBalance: dyn || 0,
            dailyBalance: 0,
          } as any;
          base.equity = Number(challenge?.details?.metaStats?.equity ?? dyn ?? 0) || 0;
          // Parámetros de riesgo desde el challenge (si disponible)
          if (challenge) {
            try {
              base.riskValidation = getBasicRiskParams(challenge);
            } catch {}
          }
          base.openPositions = new PositionsClassType();
          base.closedPositions = new PositionsClassType();
          base.lastUpdate = new Date();
          this.bufferService.insertBuffer(login, base);
          acc = base;
          this.logger.debug(`WS: creada cuenta en buffer para login=${login} (account)`);
        }

        // Balance/equity actuales
        const currentBalance = Number(
          item.balance ?? acc.balance?.currentBalance ?? 0,
        );
        acc.balance.currentBalance = isNaN(currentBalance)
          ? acc.balance.currentBalance
          : currentBalance;

        const equity = Number(
          item.equity ?? acc.equity ?? acc.balance.currentBalance,
        );
        acc.equity = isNaN(equity) ? acc.equity : equity;

        // Completar initialBalance si falta
        if (!acc.balance || acc.balance.initialBalance == null || Number(acc.balance.initialBalance) <= 0) {
          try {
            const challenge = await this.challengesService.findByBrokerLogin(login);
            const init = Number(challenge?.brokerAccount?.innitialBalance ?? 0);
            if (!isNaN(init) && init > 0) {
              acc.balance.initialBalance = init;
            }
            if (!acc.riskValidation && challenge) {
              acc.riskValidation = getBasicRiskParams(challenge);
            }
          } catch {}
        }

        // Si no existe baseline diario válido, inicializarlo desde WS
        const hasValidDaily =
          acc.balance?.dailyBalance !== undefined &&
          acc.balance.dailyBalance !== null &&
          !isNaN(Number(acc.balance.dailyBalance)) &&
          Number(acc.balance.dailyBalance) > 0;
        if (!hasValidDaily) {
          const baseline = !isNaN(currentBalance) && currentBalance > 0
            ? currentBalance
            : (!isNaN(equity) && equity > 0 ? equity : acc.balance.currentBalance);
          if (!isNaN(baseline) && baseline > 0) {
            acc.balance.dailyBalance = baseline;
          }
        }

        acc.lastUpdate = new Date();

        // Evaluar reglas en tiempo real con balance/equity del WS
        if (acc.riskValidation && this.hasSufficientDataForRiskEvaluation(acc)) {
          try {
            acc.rulesEvaluation = riskEvaluation(acc, acc.riskValidation);
          } catch (e) {
            this.logger.error(
              `Error evaluando riesgo para ${login}: ${e?.message || e}`,
            );
          }
          // Trigger de desaprobación inmediata por violación de pérdida diaria/máxima
          await this.triggerRealtimeAutoDisapproval(acc).catch((e) =>
            this.logger.error(
              `Trigger desaprobación (account) falló para ${login}: ${e?.message || e}`,
            ),
          );
        }

        acc.markAsDirty();

        // Persistir cambios en tiempo real
        await this.persistAccountRealtime(acc).catch((e) =>
          this.logger.error(`Persistencia (account) falló para ${login}: ${e?.message || e}`),
        );
      });
    }
  }

  /**
   * Procesa y actualiza posiciones abiertas desde WS
   */
  private async processOpenPositions(payload: any) {
    const items = Array.isArray(payload) ? payload : [payload];

    // Agrupar por login
    const byLogin: Record<string, any[]> = {};
    for (const p of items) {
      const rawLogin = String(p.loginID ?? p.loginId ?? p.login ?? p.account ?? '').trim();
      if (!rawLogin) continue;
      const login = this.getCanonicalLogin(rawLogin);
      byLogin[login] = byLogin[login] || [];
      byLogin[login].push({ ...p, __rawLogin: rawLogin });
    }

    for (const [login, positions] of Object.entries(byLogin)) {
      await this.bufferService.withLock(login, async () => {
        let acc = this.bufferService.getBuffer(login);
        // Migrar si existe bajo clave antigua
        const sample = positions[0];
        const rawLogin = sample?.__rawLogin ?? login;
        if (!acc && rawLogin !== login) {
          const oldAcc = this.bufferService.getBuffer(rawLogin);
          if (oldAcc) {
            oldAcc.login = login;
            this.bufferService.deleteBuffer(rawLogin);
            this.bufferService.insertBuffer(login, oldAcc);
            acc = oldAcc;
            this.logger.debug(`WS: migrada cuenta de '${rawLogin}' a '${login}' (open positions)`);
          }
        }
        if (!acc) {
          const challenge = await this.challengesService.findByBrokerLogin(login);
          const base = new Account('', login);
          base.challengeId = challenge?.challengeID || '';
          const init = Number(challenge?.brokerAccount?.innitialBalance ?? 0) || 0;
          const dyn = Number(challenge?.dynamicBalance ?? 0) || 0;
          base.balance = { currentBalance: dyn || 0, initialBalance: init, dailyBalance: dyn || init || 0 } as any;
          base.equity = Number(challenge?.details?.metaStats?.equity ?? dyn ?? 0) || 0;
          if (challenge) {
            try { base.riskValidation = getBasicRiskParams(challenge); } catch {}
          }
          base.openPositions = new PositionsClassType();
          base.closedPositions = new PositionsClassType();
          base.lastUpdate = new Date();
          this.bufferService.insertBuffer(login, base);
          acc = base;
          this.logger.debug(`WS: creada cuenta en buffer para login=${login} (open positions)`);
        }

        const mapped = this.mapWsOpenPositions(positions);
        const mappedOpen = Array.isArray(mapped.positions)
          ? mapped.positions
          : [];

        // No sobrescribir posiciones abiertas previas si el payload viene vacío
        if (mappedOpen.length > 0) {
          acc.openPositions = mapped;
          // Hay nuevas abiertas: mantener sólo adición sin borrar en DB
        } else {
          this.logger.debug(
            `WS open positions vacío para ${login}; preservando abiertas previas en buffer`,
          );
        }

        // Re-evaluar reglas en tiempo real con balance/equity del WS
        if (acc.riskValidation && this.hasSufficientDataForRiskEvaluation(acc)) {
          try {
            acc.rulesEvaluation = riskEvaluation(acc, acc.riskValidation);
          } catch (e) {
            this.logger.error(
              `Error evaluando riesgo (pos) para ${login}: ${e?.message || e}`,
            );
          }
          // Trigger de desaprobación inmediata por violación de pérdida diaria/máxima
          await this.triggerRealtimeAutoDisapproval(acc).catch((e) =>
            this.logger.error(
              `Trigger desaprobación (pos) falló para ${login}: ${e?.message || e}`,
            ),
          );
        }

        acc.lastUpdate = new Date();
        acc.markAsDirty();

        // Persistir cambios en tiempo real
        await this.persistAccountRealtime(acc).catch((e) =>
          this.logger.error(`Persistencia (pos) falló para ${login}: ${e?.message || e}`),
        );
      });
    }
  }

  /**
   * Procesa y actualiza posiciones cerradas desde WS
   */
  private async processClosedPositions(payload: any) {
    const items = Array.isArray(payload) ? payload : [payload];
    const byLogin: Record<string, any[]> = {};
    for (const p of items) {
      const rawLogin = String(p.loginID ?? p.loginId ?? p.login ?? p.account ?? '').trim();
      if (!rawLogin) continue;
      const login = this.getCanonicalLogin(rawLogin);
      byLogin[login] = byLogin[login] || [];
      byLogin[login].push({ ...p, __rawLogin: rawLogin });
    }

    for (const [login, positions] of Object.entries(byLogin)) {
      await this.bufferService.withLock(login, async () => {
        let acc = this.bufferService.getBuffer(login);
        // Migrar si existe bajo clave antigua
        const sample = positions[0];
        const rawLogin = sample?.__rawLogin ?? login;
        if (!acc && rawLogin !== login) {
          const oldAcc = this.bufferService.getBuffer(rawLogin);
          if (oldAcc) {
            oldAcc.login = login;
            this.bufferService.deleteBuffer(rawLogin);
            this.bufferService.insertBuffer(login, oldAcc);
            acc = oldAcc;
            this.logger.debug(`WS: migrada cuenta de '${rawLogin}' a '${login}' (closed positions)`);
          }
        }
        if (!acc) {
          const challenge = await this.challengesService.findByBrokerLogin(login);
          const base = new Account('', login);
          base.challengeId = challenge?.challengeID || '';
          const init = Number(challenge?.brokerAccount?.innitialBalance ?? 0) || 0;
          const dyn = Number(challenge?.dynamicBalance ?? 0) || 0;
          base.balance = { currentBalance: dyn || 0, initialBalance: init, dailyBalance: dyn || init || 0 } as any;
          base.equity = Number(challenge?.details?.metaStats?.equity ?? dyn ?? 0) || 0;
          if (challenge) {
            try { base.riskValidation = getBasicRiskParams(challenge); } catch {}
          }
          base.openPositions = new PositionsClassType();
          base.closedPositions = new PositionsClassType();
          base.lastUpdate = new Date();
          this.bufferService.insertBuffer(login, base);
          acc = base;
          this.logger.debug(`WS: creada cuenta en buffer para login=${login} (closed positions)`);
        }

        const mapped = this.mapWsClosedPositions(positions);
        const mappedClosed: ClosedPosition[] = Array.isArray(mapped.positions)
          ? (mapped.positions as ClosedPosition[])
          : [];

        // Fusionar con posiciones cerradas previas para no perder histórico
        if (mappedClosed.length > 0) {
          const existingRaw = Array.isArray(acc.closedPositions?.positions)
            ? acc.closedPositions.positions
            : [];
          const existing: ClosedPosition[] = (existingRaw as any[]).filter(
            (p) => p && typeof p === 'object' && 'TimeClose' in p,
          ) as ClosedPosition[];

          const byKey: Record<string, ClosedPosition> = {};
          for (const pos of existing) {
            const key = this.getPositionKey(pos);
            if (!key) continue;
            byKey[key] = pos;
          }
          for (const pos of mappedClosed) {
            const key = this.getPositionKey(pos);
            if (!key) continue;
            byKey[key] = pos; // reemplaza si ya existía
          }

          const merged = Object.values(byKey);
          // Opcional: ordenar por cierre si disponible, sino por apertura
          merged.sort((a, b) => {
            const ta = a.TimeClose ?? a.TimeOpen ?? '';
            const tb = b.TimeClose ?? b.TimeOpen ?? '';
            return ta.localeCompare(tb);
          });

          if (!acc.closedPositions) {
            acc.closedPositions = new PositionsClassType();
          }
          acc.closedPositions.setPositions(merged);
          acc.closedPositions.setLenght(merged.length);

          // Remover de abiertas cualquier orden que ya figure como cerrada
          const currentOpenRaw = Array.isArray(acc.openPositions?.positions)
            ? acc.openPositions!.positions
            : [];
          const existingOpen: OpenPosition[] = (currentOpenRaw as any[]).filter(
            (p) => p && typeof p === 'object' && 'OrderId' in p,
          ) as OpenPosition[];

          const closedIds = new Set(
            merged
              .map((p) => (p?.OrderId !== undefined ? String(p.OrderId) : ''))
              .filter((id) => id && id.length > 0),
          );
          const filteredOpen = existingOpen.filter(
            (op) => !closedIds.has(String(op.OrderId)),
          );

          if (!acc.openPositions) {
            acc.openPositions = new PositionsClassType();
          }
          if (filteredOpen.length !== existingOpen.length) {
            acc.openPositions.setPositions(filteredOpen);
            acc.openPositions.setLenght(filteredOpen.length);
            // Si no quedan abiertas, no mandar vaciado a DB; sólo buffer
          }
        } else {
          this.logger.debug(
            `WS closed positions vacío para ${login}; preservando cerradas previas en buffer`,
          );
        }

        // Re-evaluar reglas en tiempo real con balance/equity del WS
        if (acc.riskValidation && this.hasSufficientDataForRiskEvaluation(acc)) {
          try {
            acc.rulesEvaluation = riskEvaluation(acc, acc.riskValidation);
          } catch (e) {
            this.logger.error(
              `Error evaluando riesgo (deal) para ${login}: ${e?.message || e}`,
            );
          }
          // Trigger de desaprobación inmediata por violación de pérdida diaria/máxima
          await this.triggerRealtimeAutoDisapproval(acc).catch((e) =>
            this.logger.error(
              `Trigger desaprobación (deal) falló para ${login}: ${e?.message || e}`,
            ),
          );
        }

        acc.lastUpdate = new Date();
        acc.markAsDirty();

        // Persistir cambios en tiempo real
        await this.persistAccountRealtime(acc).catch((e) =>
          this.logger.error(`Persistencia (deal) falló para ${login}: ${e?.message || e}`),
        );
      });
    }
  }

  /**
   * Construye el payload y persiste en ChallengeDetails en tiempo real via upsert
   */
  private async persistAccountRealtime(acc: Account): Promise<void> {
    try {
      // Resolver challengeID si falta
      if (!acc.challengeId || acc.challengeId.length === 0) {
        const challenge = await this.challengesService.findByBrokerLogin(acc.login);
        if (!challenge) {
          this.logger.warn(`No se encontró Challenge para login=${acc.login}; omitimos persistencia`);
          return;
        }
        acc.challengeId = challenge.challengeID;
      }

      // Si no hay cambios, salir
      if (!acc.isDirty()) {
        return;
      }

      // Preparar posiciones (evitar enviar arrays vacíos para no sobreescribir)
      const openPositionsArr = Array.isArray(acc.openPositions?.positions)
        ? (acc.openPositions!.positions as any[])
        : [];
      const closedPositionsArr = Array.isArray(acc.closedPositions?.positions)
        ? (acc.closedPositions!.positions as any[])
        : [];

      const positionsPayload: any = {};
      if (openPositionsArr.length > 0) {
        positionsPayload.openPositions = openPositionsArr;
      }
      if (closedPositionsArr.length > 0) {
        positionsPayload.closedPositions = closedPositionsArr;
      }

      // Balance: incluir sólo valores válidos (>0) para no resetear BD
      const balancePayload: any = {};
      if (acc.balance) {
        const { currentBalance, dailyBalance, initialBalance } = acc.balance as any;
        const curr = Number(currentBalance);
        const daily = Number(dailyBalance);
        const init = Number(initialBalance);
        if (!isNaN(curr) && isFinite(curr) && curr > 0)
          balancePayload.currentBalance = curr;
        if (!isNaN(daily) && isFinite(daily) && daily > 0)
          balancePayload.dailyBalance = daily;
        if (!isNaN(init) && isFinite(init) && init > 0)
          balancePayload.initialBalance = init;
      }

      // MetaStats: persistir equity sólo si es válido (>0)
      const metaStatsPayload: any = {};
      if (typeof acc.equity === 'number') {
        const eq = Number(acc.equity);
        if (!isNaN(eq) && isFinite(eq) && eq > 0) {
          metaStatsPayload.equity = eq;
        }
      }

      // Construir payload final para upsert
      const payload = {
        metaStats: Object.keys(metaStatsPayload).length ? metaStatsPayload : undefined,
        positions: Object.keys(positionsPayload).length ? positionsPayload : undefined,
        rulesValidation: acc.rulesEvaluation ?? undefined,
        balance: Object.keys(balancePayload).length ? balancePayload : undefined,
        lastUpdate: acc.lastUpdate ?? new Date(),
        // rulesParams: no se actualiza desde WS
      };

      await this.challengeDetailsService.upsertChallengeDetails(acc.challengeId!, payload as any);
      acc.markAsClean();
    } catch (e) {
      // No lanzar, solo loguear
      this.logger.error(`Error persistiendo realtime para login=${acc.login}: ${e?.message || e}`);
    }
  }

  /**
   * Dispara desaprobación inmediata si daily o max drawdown violan umbral.
   * Incluye debounce para evitar múltiples disparos seguidos.
   */
  private async triggerRealtimeAutoDisapproval(acc: Account): Promise<void> {
    const evalRes = acc.rulesEvaluation as any;
    if (!evalRes) return;

    const dailyFail = evalRes?.dailyDrawdown && evalRes.dailyDrawdown.status === false;
    const maxFail = evalRes?.maxDrawdown && evalRes.maxDrawdown.status === false;

    // Solo disparar si alguna de las dos reglas críticas falla
    if (!dailyFail && !maxFail) return;

    // Resolver challengeID si falta
    if (!acc.challengeId || acc.challengeId.length === 0) {
      const challenge = await this.challengesService.findByBrokerLogin(acc.login);
      if (!challenge) {
        this.logger.warn(`Trigger: Challenge no encontrado para login=${acc.login}; omito desaprobación`);
        return;
      }
      acc.challengeId = challenge.challengeID;
    }

    const key = acc.challengeId || acc.login;
    const now = Date.now();
    const last = this.disapprovalDebounce.get(key) || 0;
    const ttlMs = 60_000; // 60s de ventana anti-doble disparo
    if (now - last < ttlMs) {
      return; // dentro de ventana de debounce
    }

    // Verificar estado actual del challenge para evitar llamadas innecesarias
    try {
      const challenge = await this.challengesService.findByBrokerLogin(acc.login);
      if (!challenge) return;
      if (challenge.status === ChallengeStatus.DISAPPROVED || challenge.isActive === false) {
        return; // ya desaprobado o inactivo
      }
    } catch (e) {
      // Si falla la verificación, continuar con cuidado (log y seguir)
      this.logger.warn(`Trigger: no se pudo verificar estado challenge para login=${acc.login}: ${e?.message || e}`);
    }

    const observationParts: string[] = [];
    if (dailyFail) {
      const val = Number(evalRes.dailyDrawdown?.drawdown);
      observationParts.push(`Daily loss excedida: ${isNaN(val) ? '-' : val.toFixed(2)}%`);
    }
    if (maxFail) {
      const val = Number(evalRes.maxDrawdown?.drawdown);
      observationParts.push(`Max loss excedida: ${isNaN(val) ? '-' : val.toFixed(2)}%`);
    }
    const observation = observationParts.join(' | ') || 'Violación de reglas críticas (daily/max loss)';

    await this.challengesService
      .setDisapprovedChallenge(acc.challengeId!, observation)
      .then(() => {
        this.disapprovalDebounce.set(key, now);
        this.logger.debug(
          `Trigger: challenge=${acc.challengeId} desaprobado inmediatamente por violación de pérdida`,
        );
      })
      .catch((err) => {
        this.logger.error(
          `Trigger: error al desaprobar challenge=${acc.challengeId}: ${err?.message || err}`,
        );
      });
  }

  /**
   * Mapea formato WS de posiciones abiertas a estructura interna
   */
  private mapWsOpenPositions(openPositionsData: any[]): PositionsClassType {
    const positions = openPositionsData.map((pos) => {
      const position = new OpenPosition();
      position.OrderId = String(
        pos.ticket ?? pos.position ?? pos.positionid ?? pos.dealId ?? pos.id,
      );
      position.Symbol = pos.symbol ?? pos.symbolName ?? '';

      // Algunos envían action_name, otros tradetype numérico (0=BUY,1=SELL)
      const typeRaw = (pos.action_name ?? pos.type ?? '').toString().toUpperCase();
      const tradeTypeNum = Number(pos.tradetype);
      const byNum = !isNaN(tradeTypeNum)
        ? tradeTypeNum === 1
          ? 'SELL'
          : 'BUY'
        : undefined;
      position.Type = (typeRaw === 'SELL' ? 'SELL' : typeRaw === 'BUY' ? 'BUY' : byNum) || 'BUY';

      position.Volume = Number(pos.volume ?? pos.lot ?? pos.lotsize ?? 0);
      position.OpenPrice = Number(pos.price_open ?? pos.openprice ?? pos.price ?? 0);
      position.ClosePrice = null;
      position.SL = Number(pos.price_sl ?? pos.sl ?? 0);
      position.TP = Number(pos.price_tp ?? pos.tp ?? 0);

      // Profit directo si viene, no recalculamos
      const profit = Number(pos.profit);
      position.Profit = isNaN(profit) ? 0 : profit;
      position.Swap = Number(pos.swap ?? 0);
      position.Commentary = pos.comment ?? '';
      position.TimeOpen =
        this.normalizeTimestamp(
          pos.time_create ??
            pos.opentime ??
            pos.time_open ??
            pos.open_time ??
            pos.openTime,
        );
      return position;
    });
    const unique = this.dedupePositions<OpenPosition>(positions);
    const positionsClass = new PositionsClassType();
    positionsClass.setPositions(unique);
    positionsClass.setLenght(unique.length);
    return positionsClass;
  }

  /**
   * Mapea formato WS de posiciones cerradas a estructura interna
   */
  private mapWsClosedPositions(closedPositionsData: any[]): PositionsClassType {
    const positions = closedPositionsData.map((pos) => {
      const position = new ClosedPosition();
      position.OrderId = String(
        pos.order ??
        pos.ticket ??
        pos.position ??
        pos.id
      );
      position.Symbol = pos.symbol ?? pos.symbolName ?? '';
      const typeRaw = (pos.action ?? pos.action_name ?? '').toString().toUpperCase();
      const tradeTypeNum = Number(pos.tradetype);
      const byNum = !isNaN(tradeTypeNum)
        ? tradeTypeNum === 1
          ? 'SELL'
          : 'BUY'
        : undefined;
      position.Type = (typeRaw === 'SELL' ? 'SELL' : typeRaw === 'BUY' ? 'BUY' : byNum) || 'BUY';
      position.Volume = Number(pos.volume ?? pos.lot ?? 0);
      position.OpenPrice = Number(pos.price_open ?? pos.openprice ?? 0);
      position.ClosePrice = Number(pos.price_close ?? pos.closeprice ?? 0);
      position.Profit = Number(pos.profit ?? 0);
      position.Swap = Number(pos.swap ?? 0);
      position.Commission = Number(pos.commission ?? 0);
      position.Rate = Number((pos as any).rate ?? 1);
      position.TimeOpen =
        this.normalizeTimestamp(
          pos.time_open ??
            pos.opentime ??
            pos.open_time ??
            pos.openTime ??
            pos.time_create,
        );
      position.TimeClose =
        this.normalizeTimestamp(
          pos.time_close ??
            pos.closetime ??
            pos.close_time ??
            pos.closeTime ??
            (pos as any).time_close_gmt,
        );
      position.Commentary = pos.comment ?? '';
      position.SL = Number(pos.price_sl ?? pos.sl ?? 0);
      position.TP = Number(pos.price_tp ?? pos.tp ?? 0);
      return position;
    });
    const unique = this.dedupePositions<ClosedPosition>(positions);
    const positionsClass = new PositionsClassType();
    positionsClass.setPositions(unique);
    positionsClass.setLenght(unique.length);
    return positionsClass;
  }

  // Eliminado método de recreación de Account: se actualiza en sitio bajo lock

  /**
   * Normaliza timestamps provenientes del WS (segundos, milisegundos o cadenas)
   * Devuelve ISO string o null si no es parseable.
   */
  private hasSufficientDataForRiskEvaluation(acc: Account): boolean {
    // Permitir evaluación si hay al menos balance actual o equity
    const curr = Number(acc.balance?.currentBalance);
    const equity = Number(acc.equity);
    const hasCurr = !isNaN(curr);
    const hasEquity = !isNaN(equity);

    // Opcional: referencias para drawdown
    const daily = Number(acc.balance?.dailyBalance);
    const init = Number(acc.balance?.initialBalance);
    const hasRef = !isNaN(daily) || (!isNaN(init) && init > 0);

    if (!hasCurr && !hasEquity) {
      this.logger.debug(
        `Saltando evaluación de riesgo para ${acc.login}: falta balance/equity`,
      );
      return false;
    }
    // Si no hay referencia, igual evaluamos: las funciones con guardas devolverán estado=false donde aplique
    if (!hasRef) {
      this.logger.debug(
        `Evaluación de riesgo para ${acc.login} sin referencia válida (daily/initial)`,
      );
    }
    return true;
  }

  private normalizeTimestamp(raw: any): string | null {
    if (raw === null || raw === undefined) return null;
    try {
      if (typeof raw === 'number') {
        const ms = raw > 1e12 ? raw : raw * 1000; // segundos vs milisegundos
        return new Date(ms).toISOString();
      }
      if (typeof raw === 'string') {
        const num = Number(raw);
        if (!isNaN(num)) {
          const ms = num > 1e12 ? num : num * 1000;
          return new Date(ms).toISOString();
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      if (raw instanceof Date) {
        return isNaN(raw.getTime()) ? null : raw.toISOString();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Genera una clave canónica para identificar de forma única una posición.
   * Prioriza `OrderId`; si falta, usa una clave compuesta estable.
   */
  private getPositionKey(p: OpenPosition | ClosedPosition): string {
    const id = (p as any)?.OrderId;
    if (id && String(id).trim().length > 0) {
      return `O:${String(id).trim()}`;
    }
    const sym = String((p as any)?.Symbol ?? '').trim();
    const type = String((p as any)?.Type ?? '').trim();
    const vol = Number((p as any)?.Volume ?? 0);
    const open = String((p as any)?.TimeOpen ?? '').trim();
    const close = String((p as any)?.TimeClose ?? '').trim();
    const openPx = Number((p as any)?.OpenPrice ?? 0);
    const closePx = Number((p as any)?.ClosePrice ?? 0);
    return `C:${sym}|${type}|${vol}|${openPx}|${closePx}|${open}|${close}`;
  }

  /**
   * Elimina duplicados manteniendo el último visto para cada clave canónica.
   */
  private dedupePositions<T extends OpenPosition | ClosedPosition>(positions: T[]): T[] {
    const byKey: Record<string, T> = {};
    for (const p of positions) {
      const key = this.getPositionKey(p);
      if (!key) continue;
      byKey[key] = p;
    }
    return Object.values(byKey);
  }

  /**
   * Devuelve una clave de login canónica: recorta espacios y extrae el bloque numérico principal
   * Preferencia: secuencias de 10-13 dígitos; si hay varias, usa la más larga.
   */
  private getCanonicalLogin(value: string): string {
    const v = (value || '').trim();
    if (!v) return v;
    if (/^\d+$/.test(v)) return v;
    const matches = v.match(/\d{6,}/g) || [];
    if (matches.length === 0) return v;
    // Priorizar 10-13 dígitos
    const preferred = matches.find((m) => m.length >= 10 && m.length <= 13);
    if (preferred) return preferred;
    // En su defecto, usar la secuencia más larga
    return matches.sort((a, b) => b.length - a.length)[0];
  }

}
