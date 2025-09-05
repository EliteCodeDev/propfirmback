import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeAddon } from 'src/modules/challenge-templates/entities/addons/challenge-addon.entity';
import { CreateChallegeAddonDto } from 'src/modules/challenge-templates/dto/create/create-challenge-addo.dto';

@Injectable()
export class AddonChallengService {

    constructor(
        @InjectRepository(ChallengeAddon)
        private readonly addonChallengRepository: Repository<ChallengeAddon>
    ){}

    async findAll(){
        return await this.addonChallengRepository.find();
    }

    async findByChallengeId(id: string){
        return await this.addonChallengRepository.find({where: {challengeID: id}});
    }

    async create(addonChalleng: CreateChallegeAddonDto){
        return await this.addonChallengRepository.save(addonChalleng);
    }

    async update(id: string, addonChalleng: CreateChallegeAddonDto){
        return await this.addonChallengRepository.update(id, addonChalleng);
    }

    async remove(id: string){
        return await this.addonChallengRepository.delete(id);
    }

}