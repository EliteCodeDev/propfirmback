import { Injectable, Logger } from '@nestjs/common';
import { AccountDataDto } from '../dto/account-data/data.dto';
import { Account, PositionsClassType, Balance } from 'src/common/utils/account';
import { OpenPosition, ClosedPosition, ResumenPositionOpen, ResumePositionClose } from 'src/common/utils/positions';

@Injectable()
export class SmtAccountDataTransformPipe {
  private readonly logger = new Logger(SmtAccountDataTransformPipe.name);

  /**
   * Transforma AccountDataDto a Partial<Account> con login requerido
   */
  transform(data: AccountDataDto, login: string, existingAccount?: Account): Partial<Account> & { login: string } {
    this.logger.debug(`[transform] Transforming data for login=${login}`);

    const openResume = data.data?.open?.resume;
    const closeResume = data.data?.close?.resume;
    const openPositions = data.data?.open?.positions || [];
    const closedPositions = data.data?.close?.positions || [];

    // Crear el objeto Account parcial
    const account: Partial<Account> & { login: string } = {
      login: login,
      lastUpdate: new Date(),
    };

    // Mapear equity desde el resume de posiciones abiertas
    if (openResume?.Equity !== undefined) {
      account.equity = openResume.Equity;
    }

    // Mapear balance desde el resume de posiciones abiertas
    if (openResume?.Balance !== undefined) {
      account.balance = {
        currentBalance: openResume.Balance,
        initialBalance: openResume.Balance, // Asumimos que es el mismo por ahora
        dailyBalance: openResume.Balance,
      } as Balance;
    }

    // Mapear posiciones abiertas
    if (openPositions.length > 0 || openResume) {
      account.openPositions = this.createPositionsClassType(
        this.mapOpenPositions(openPositions),
        this.mapOpenResume(openResume),
        openPositions.length
      );
    }

    // Mapear posiciones cerradas con validación para evitar sobrescribir datos existentes con datos vacíos
    if (closedPositions.length > 0 || closeResume) {
      account.closedPositions = this.createPositionsClassType(
        this.mapClosedPositions(closedPositions),
        this.mapCloseResume(closeResume),
        closedPositions.length
      );
    } else {
      // Validar si ya existen posiciones cerradas previas en la cuenta existente
      const hasExistingClosedPositions = 
        existingAccount?.closedPositions?.positions &&
        existingAccount.closedPositions.positions.length > 0;

      if (hasExistingClosedPositions) {
        // Si ya existen posiciones cerradas y llegan datos vacíos, no sobrescribir
        this.logger.debug(
          `[transform] Omitiendo actualización de posiciones cerradas vacías para cuenta ${login} - datos previos existen (${existingAccount.closedPositions.positions.length} posiciones)`,
        );
        // No incluir closedPositions en el resultado para mantener las existentes
      } else {
        // Si no hay posiciones cerradas previas, crear estructura vacía
        account.closedPositions = this.createPositionsClassType(
          this.mapClosedPositions([]),
          this.mapCloseResume(closeResume),
          0
        );
      }
    }

    this.logger.debug(`[transform] Transformed account for login=${login}, equity=${account.equity}, balance=${account.balance?.currentBalance}`);

    return account;
  }

  /**
   * Crea una instancia de PositionsClassType
   */
  private createPositionsClassType(
    positions: OpenPosition[] | ClosedPosition[],
    resume: ResumenPositionOpen | ResumePositionClose,
    length: number
  ): PositionsClassType {
    const positionsClass = new PositionsClassType();
    positionsClass.setPositions(positions);
    positionsClass.setResume(resume);
    positionsClass.setLenght(length);
    return positionsClass;
  }

  /**
   * Mapea posiciones abiertas del DTO al formato interno
   */
  private mapOpenPositions(positions: any[]): OpenPosition[] {
    return positions.map(pos => {
      const openPosition = new OpenPosition();
      openPosition.OrderId = pos.OrderId || pos.orderId || '';
      openPosition.Symbol = pos.Symbol || pos.symbol || '';
      openPosition.TimeOpen = pos.TimeOpen || pos.timeOpen || '';
      openPosition.Type = pos.Type || pos.type || '';
      openPosition.Volume = pos.Volume || pos.volume || 0;
      openPosition.OpenPrice = pos.OpenPrice || pos.openPrice || 0;
      openPosition.SL = pos.SL || pos.sl || 0;
      openPosition.TP = pos.TP || pos.tp || 0;
      openPosition.ClosePrice = pos.ClosePrice || pos.closePrice || 0;
      openPosition.Swap = pos.Swap || pos.swap || 0;
      openPosition.Profit = pos.Profit || pos.profit || 0;
      openPosition.Commentary = pos.Commentary || pos.commentary || '';
      return openPosition;
    });
  }

  /**
   * Mapea posiciones cerradas del DTO al formato interno
   */
  private mapClosedPositions(positions: any[]): ClosedPosition[] {
    return positions.map(pos => {
      const closedPosition = new ClosedPosition();
      closedPosition.OrderId = pos.OrderId || pos.orderId || '';
      closedPosition.TimeOpen = pos.TimeOpen || pos.timeOpen || '';
      closedPosition.Type = pos.Type || pos.type || '';
      closedPosition.Volume = pos.Volume || pos.volume || 0;
      closedPosition.Symbol = pos.Symbol || pos.symbol || '';
      closedPosition.OpenPrice = pos.OpenPrice || pos.openPrice || 0;
      closedPosition.SL = pos.SL || pos.sl || 0;
      closedPosition.TP = pos.TP || pos.tp || 0;
      closedPosition.TimeClose = pos.TimeClose || pos.timeClose || '';
      closedPosition.ClosePrice = pos.ClosePrice || pos.closePrice || 0;
      closedPosition.Commission = pos.Commission || pos.commission || 0;
      closedPosition.Rate = pos.Rate || pos.rate || 0;
      closedPosition.Swap = pos.Swap || pos.swap || 0;
      closedPosition.Profit = pos.Profit || pos.profit || 0;
      closedPosition.Commentary = pos.Commentary || pos.commentary || '';
      return closedPosition;
    });
  }

  /**
   * Mapea el resume de posiciones abiertas del DTO al formato interno
   */
  private mapOpenResume(resume: any): ResumenPositionOpen {
    if (!resume) return new ResumenPositionOpen();

    const openResume = new ResumenPositionOpen();
    openResume.Balance = resume.Balance || 0;
    openResume.Commentary = resume.Commentary || '';
    openResume.Equity = resume.Equity || 0;
    openResume.Margin = resume.Margin || 0;
    openResume.FreeMargin = resume.FreeMargin || 0;
    openResume.Level = resume.Level || 0;
    openResume.Profit = resume.Profit || 0;
    return openResume;
  }

  /**
   * Mapea el resume de posiciones cerradas del DTO al formato interno
   */
  private mapCloseResume(resume: any): ResumePositionClose {
    if (!resume) return new ResumePositionClose();

    const closeResume = new ResumePositionClose();
    closeResume.Profit_Lose = resume.Profit_Lose || 0;
    closeResume.Credit = resume.Credit || 0;
    closeResume.Deposit = resume.Deposit || 0;
    closeResume.Withdrawal = resume.Withdrawal || 0;
    closeResume.Profit = resume.Profit || 0;
    closeResume.Swap = resume.Swap || 0;
    closeResume.Rate = resume.Rate || 0;
    closeResume.Commission = resume.Commission || 0;
    closeResume.Balance = resume.Balance || 0;
    return closeResume;
  }
}