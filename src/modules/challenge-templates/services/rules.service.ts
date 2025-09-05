import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rules } from '../entities/rules/rules.entity';
import { Repository } from 'typeorm';
import { RuleDto } from '../dto/create/create-rule.dto';

@Injectable()
export class RulesService {

    constructor(
        @InjectRepository(Rules)
        private readonly rulesRepository: Repository<Rules>
    ){}

    async findAll(){
        return await this.rulesRepository.find();
    }

    async findById(id: string){
        return await this.rulesRepository.findOne({ where: { idRule: id } });
    }

    async create(rules: RuleDto){
        return await this.rulesRepository.save(rules);
    }

    async update(id: string, rules: RuleDto){
        return await this.rulesRepository.update(id, rules);
    }    

    async remove(id: string){
        return await this.rulesRepository.delete(id);
    }

}