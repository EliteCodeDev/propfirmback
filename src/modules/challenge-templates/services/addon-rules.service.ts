import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { ChallengeAddon } from '../entities/addons/challenge-addon.entity';
import { RelationAddon } from '../entities/addons/relation-addon.entity';
import { Addon } from '../entities/addons/addon.entity';
import { RiskParams } from 'src/common/utils';
import { getNumericAddonValue } from 'src/common/utils/addon-value-parser';

/**
 * Interfaz para definir modificaciones específicas de addons
 */
export interface AddonModification {
  addonName: string;
  modifyRiskParams: (params: RiskParams) => RiskParams;
}

/**
 * Servicio para calcular parámetros de reglas modificados por addons
 */
@Injectable()
export class AddonRulesService {
  constructor(
    @InjectRepository(ChallengeAddon)
    private readonly challengeAddonRepository: Repository<ChallengeAddon>,
    @InjectRepository(RelationAddon)
    private readonly relationAddonRepository: Repository<RelationAddon>,
    @InjectRepository(Addon)
    private readonly addonRepository: Repository<Addon>,
  ) {}

  /**
   * Calcula los parámetros de reglas considerando modificaciones por addons
   * @param challenge - El challenge con addons cargados
   * @param baseRiskParams - Parámetros base extraídos de las reglas de fase
   * @returns RiskParams modificados por addons
   */
  async calculateRiskParamsWithAddons(
    challenge: Challenge,
    baseRiskParams: RiskParams,
  ): Promise<RiskParams> {
    if (!challenge.addons || challenge.addons.length === 0) {
      return baseRiskParams;
    }

    let modifiedParams = { ...baseRiskParams };

    // Obtener addons activos del challenge
    const activeAddons = challenge.addons.filter(
      (addon) => addon.isActive && addon.addon,
    );

    // Aplicar modificaciones de cada addon activo
    for (const challengeAddon of activeAddons) {
      modifiedParams = await this.applyAddonModifications(
        challengeAddon,
        modifiedParams,
      );
    }

    return modifiedParams;
  }

  /**
   * Aplica modificaciones específicas de un addon a los parámetros de riesgo
   * @param challengeAddon - El challengeAddon que contiene el addon y el valor
   * @param riskParams - Parámetros de riesgo actuales
   * @returns Parámetros de riesgo modificados
   */
  private async applyAddonModifications(
    challengeAddon: ChallengeAddon,
    riskParams: RiskParams,
  ): Promise<RiskParams> {
    const modifiedParams = { ...riskParams };
    const addon = challengeAddon.addon;
    const slugRule = addon.slugRule;

    if (!slugRule) {
      return modifiedParams; // Si no tiene slugRule, no aplicar modificaciones
    }

    // Obtener el valor de modificación desde ChallengeAddon
    const modificationValue = getNumericAddonValue(
      challengeAddon.value,
      addon.valueType
    );

    // Aplicar modificaciones basadas en el slugRule del addon
    switch (slugRule) {
      case 'news-trading':
        // News Trading — Allows trading ±2 min around red-folder events; profits count
        // No modifica RiskParams directamente, solo permite ciertas acciones durante noticias
        break;

      case 'extra-drawdown':
        // Extra Drawdown — Adds specified value to max overall drawdown
        if (modifiedParams.maxDrawdown && modificationValue !== null) {
          modifiedParams.maxDrawdown = modifiedParams.maxDrawdown + modificationValue;
        }
        break;

      case 'profit-share-90':
        // Profit Share 90% — Raises split from 80/20 to 90/10 on funded payouts
        // No modifica RiskParams directamente, afecta reglas de retiro
        break;

      case 'faster-payouts-7':
        // Faster Payouts 7 — Payouts every 7 days (vs 21) on funded
        // No modifica RiskParams directamente, afecta reglas de retiro
        break;

      case 'weekend-holding':
        // Weekend holding addon - permite mantener posiciones el fin de semana
        // No modifica RiskParams directamente
        break;

      case 'extended-hours':
        // Extended hours addon - permite trading fuera del horario normal
        // No modifica RiskParams directamente
        break;

      case 'increased-leverage':
        // Increased leverage addon - podría modificar el leverage máximo
        // if (modificationValue) {
        //   modifiedParams.maxLeverage = modifiedParams.maxLeverage * (1 + modificationValue / 100);
        // }
        break;

      case 'reduced-drawdown':
        // Reduced drawdown addon - reduce el drawdown permitido por el valor especificado
        if (modificationValue !== null) {
          const reductionFactor = modificationValue / 100; // Convertir porcentaje a decimal
          if (modifiedParams.dailyDrawdown) {
            modifiedParams.dailyDrawdown = modifiedParams.dailyDrawdown * (1 - reductionFactor);
          }
          if (modifiedParams.maxDrawdown) {
            modifiedParams.maxDrawdown = modifiedParams.maxDrawdown * (1 - reductionFactor);
          }
        }
        break;

      case 'profit-boost':
        // Profit boost addon - reduce el profit target requerido por el valor especificado
        if (modificationValue !== null && modifiedParams.profitTarget) {
          const reductionFactor = modificationValue / 100; // Convertir porcentaje a decimal
          modifiedParams.profitTarget = modifiedParams.profitTarget * (1 - reductionFactor);
        }
        break;

      default:
        // Para addons no reconocidos, no aplicar modificaciones
        break;
    }

    return modifiedParams;
  }

  /**
   * Obtiene todos los addons activos para un challenge específico
   * @param challengeId - ID del challenge
   * @returns Lista de addons activos
   */
  async getActiveChallengeAddons(
    challengeId: string,
  ): Promise<ChallengeAddon[]> {
    return this.challengeAddonRepository.find({
      where: {
        challengeID: challengeId,
        isActive: true,
      },
      relations: ['addon'],
    });
  }

  /**
   * Obtiene todos los addons activos para una relación de challenge
   * @param relation - La relación del challenge
   * @returns Lista de addons activos combinados de challenge y relación
   */
  
  async getActiveAddonsFromRelation(relation: any): Promise<any[]> {
    const relationAddons = await this.getActiveRelationAddons(
      relation.relationID,
    );

    // Convertir RelationAddon a formato compatible con ChallengeAddon
    return relationAddons.map((relationAddon) => ({
      ...relationAddon,
      challengeId: null, // No aplica para addons de relación
      relationId: relationAddon.relationID,
      isActive: relationAddon.isActive,
      addon: relationAddon.addon,
    }));
  }

  /**
   * Obtiene todos los addons activos para una relación específica
   * @param relationId - ID de la relación
   * @returns Lista de addons activos de la relación
   */
  async getActiveRelationAddons(relationId: string): Promise<RelationAddon[]> {
    return this.relationAddonRepository.find({
      where: {
        relationID: relationId,
        isActive: true,
      },
      relations: ['addon'],
    });
  }

  /**
   * Registra una nueva modificación de addon personalizada
   * @param modification - Definición de la modificación del addon
   */
  registerAddonModification(modification: AddonModification): void {
    // Esta función podría usarse para registrar modificaciones dinámicas
    // Por ahora, las modificaciones están hardcodeadas en applyAddonModifications
    // En el futuro, se podría implementar un sistema de plugins más flexible
  }
}
