
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Addon } from '../entities/addons/addon.entity';

@Injectable()
export class AddonsService {

    constructor(
        @InjectRepository(Addon)
        private readonly addonsRepository: Repository<Addon>
    ){}

    async findAll(){
        return await this.addonsRepository.find();
    }

    async findOne(id: string){
        return await this.addonsRepository.findOne({ where: { addonID: id } });
    }

    async create(addon: Addon){
        return await this.addonsRepository.save(addon);
    }

    async update(id: string, addon: Addon){
        return await this.addonsRepository.update(id, addon);
    }

    async remove(id: string){
        return await this.addonsRepository.delete(id);
    }

}
