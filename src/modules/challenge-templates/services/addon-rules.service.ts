import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { ChallengeAddon } from '../entities/addons/challenge-addon.entity';
import { RelationAddon } from '../entities/addons/relation-addon.entity';
import { Addon } from '../entities/addons/addon.entity';
import { RiskParams } from 'src/common/utils';

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
      addon => addon.isActive && addon.addon
    );

    // Aplicar modificaciones de cada addon activo
    for (const challengeAddon of activeAddons) {
      modifiedParams = await this.applyAddonModifications(
        challengeAddon.addon,
        modifiedParams
      );
    }

    return modifiedParams;
  }

  /**
   * Aplica modificaciones específicas de un addon a los parámetros de riesgo
   * @param addon - El addon a aplicar
   * @param riskParams - Parámetros de riesgo actuales
   * @returns Parámetros de riesgo modificados
   */
  private async applyAddonModifications(
    addon: Addon,
    riskParams: RiskParams,
  ): Promise<RiskParams> {
    const modifiedParams = { ...riskParams };
    const addonName = addon.name.toLowerCase();

    // Aplicar modificaciones basadas en el tipo de addon
    switch (true) {
      case addonName.includes('news trading'):
        // News trading addon - permite trading durante noticias
        // Aquí se pueden agregar propiedades específicas si es necesario
        // modifiedParams.newsTrading = true;
        break;

      case addonName.includes('weekend holding'):
        // Weekend holding addon - permite mantener posiciones el fin de semana
        // modifiedParams.weekendHolding = true;
        break;

      case addonName.includes('extended hours'):
        // Extended hours addon - permite trading fuera del horario normal
        // modifiedParams.extendedHours = true;
        break;

      case addonName.includes('increased leverage'):
        // Increased leverage addon - podría modificar el leverage máximo
        // modifiedParams.maxLeverage = modifiedParams.maxLeverage * 1.5;
        break;

      case addonName.includes('reduced drawdown'):
        // Reduced drawdown addon - podría reducir el drawdown permitido
        if (modifiedParams.dailyDrawdown) {
          modifiedParams.dailyDrawdown = modifiedParams.dailyDrawdown * 0.8;
        }
        if (modifiedParams.maxDrawdown) {
          modifiedParams.maxDrawdown = modifiedParams.maxDrawdown * 0.8;
        }
        break;

      case addonName.includes('profit boost'):
        // Profit boost addon - podría reducir el profit target requerido
        if (modifiedParams.profitTarget) {
          modifiedParams.profitTarget = modifiedParams.profitTarget * 0.9;
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
  async getActiveChallengeAddons(challengeId: string): Promise<ChallengeAddon[]> {
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
    const relationAddons = await this.getActiveRelationAddons(relation.relationID);
    
    // Convertir RelationAddon a formato compatible con ChallengeAddon
    return relationAddons.map(relationAddon => ({
      ...relationAddon,
      challengeId: null, // No aplica para addons de relación
      relationId: relationAddon.relationID,
      isActive: relationAddon.isActive,
      addon: relationAddon.addon
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