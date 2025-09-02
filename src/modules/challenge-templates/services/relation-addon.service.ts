import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelationAddon } from '../entities/addons/relation-addon.entity';
import { Addon } from '../entities/addons/addon.entity';
import { ChallengeRelation } from '../entities/challenge-relation.entity';
import { CreateRelationAddonDto } from '../dto/create/create-relation-addon.dto';
import { UpdateRelationAddonDto } from '../dto/update/update-relation-addon.dto';
import { RelationAddonResponseDto } from '../dto/response/relation-addon-response.dto';

@Injectable()
export class RelationAddonService {
  constructor(
    @InjectRepository(RelationAddon)
    private readonly relationAddonRepository: Repository<RelationAddon>,
    @InjectRepository(Addon)
    private readonly addonRepository: Repository<Addon>,
    @InjectRepository(ChallengeRelation)
    private readonly challengeRelationRepository: Repository<ChallengeRelation>,
  ) {}

  async findAll(): Promise<RelationAddonResponseDto[]> {
    const relationAddons = await this.relationAddonRepository.find({
      relations: ['addon', 'relation'],
    });
    return relationAddons.map(this.mapToResponseDto);
  }

  async findOne(addonID: string, relationID: string): Promise<RelationAddonResponseDto> {
    const relationAddon = await this.relationAddonRepository.findOne({
      where: { addonID, relationID },
      relations: ['addon', 'relation'],
    });

    if (!relationAddon) {
      throw new NotFoundException(
        `RelationAddon with addonID ${addonID} and relationID ${relationID} not found`,
      );
    }

    return this.mapToResponseDto(relationAddon);
  }

  async findByAddonId(addonID: string): Promise<RelationAddonResponseDto[]> {
    const relationAddons = await this.relationAddonRepository.find({
      where: { addonID },
      relations: ['addon', 'relation'],
    });
    return relationAddons.map(this.mapToResponseDto);
  }

  async findByRelationId(relationID: string): Promise<RelationAddonResponseDto[]> {
    const relationAddons = await this.relationAddonRepository.find({
      where: { relationID },
      relations: ['addon', 'relation'],
    });
    return relationAddons.map(this.mapToResponseDto);
  }

  async create(createRelationAddonDto: CreateRelationAddonDto): Promise<RelationAddonResponseDto> {
    // Validate that addon exists
    const addon = await this.addonRepository.findOne({
      where: { addonID: createRelationAddonDto.addonID },
    });
    if (!addon) {
      throw new BadRequestException(
        `Addon with ID ${createRelationAddonDto.addonID} does not exist`,
      );
    }

    // Validate that challenge relation exists
    const challengeRelation = await this.challengeRelationRepository.findOne({
      where: { relationID: createRelationAddonDto.relationID },
    });
    if (!challengeRelation) {
      throw new BadRequestException(
        `Challenge relation with ID ${createRelationAddonDto.relationID} does not exist`,
      );
    }

    // Check if relation already exists
    const existingRelation = await this.relationAddonRepository.findOne({
      where: {
        addonID: createRelationAddonDto.addonID,
        relationID: createRelationAddonDto.relationID,
      },
    });
    if (existingRelation) {
      throw new BadRequestException(
        `RelationAddon with addonID ${createRelationAddonDto.addonID} and relationID ${createRelationAddonDto.relationID} already exists`,
      );
    }

    // Set default values
    const relationAddonData = {
      ...createRelationAddonDto,
      price: createRelationAddonDto.price ?? 0,
      isActive: createRelationAddonDto.isActive ?? true,
      hasDiscount: createRelationAddonDto.hasDiscount ?? false,
      discount: createRelationAddonDto.discount ?? 0,
    };

    const relationAddon = this.relationAddonRepository.create(relationAddonData);
    const savedRelationAddon = await this.relationAddonRepository.save(relationAddon);

    return this.findOne(savedRelationAddon.addonID, savedRelationAddon.relationID);
  }

  async update(
    addonID: string,
    relationID: string,
    updateRelationAddonDto: UpdateRelationAddonDto,
  ): Promise<RelationAddonResponseDto> {
    const relationAddon = await this.relationAddonRepository.findOne({
      where: { addonID, relationID },
    });

    if (!relationAddon) {
      throw new NotFoundException(
        `RelationAddon with addonID ${addonID} and relationID ${relationID} not found`,
      );
    }

    await this.relationAddonRepository.update(
      { addonID, relationID },
      updateRelationAddonDto,
    );

    return this.findOne(addonID, relationID);
  }

  async remove(addonID: string, relationID: string): Promise<void> {
    const relationAddon = await this.relationAddonRepository.findOne({
      where: { addonID, relationID },
    });

    if (!relationAddon) {
      throw new NotFoundException(
        `RelationAddon with addonID ${addonID} and relationID ${relationID} not found`,
      );
    }

    await this.relationAddonRepository.delete({ addonID, relationID });
  }

  private mapToResponseDto(relationAddon: RelationAddon): RelationAddonResponseDto {
    return {
      addonID: relationAddon.addonID,
      relationID: relationAddon.relationID,
      price: relationAddon.price,
      isActive: relationAddon.isActive,
      hasDiscount: relationAddon.hasDiscount,
      discount: relationAddon.discount,
      wooID: relationAddon.wooID,
      addon: relationAddon.addon,
      relation: relationAddon.relation,
    };
  }
}