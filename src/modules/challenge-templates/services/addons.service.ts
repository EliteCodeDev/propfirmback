
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
        return this.addonsRepository.find();
    }

    async findOne(id: string){
        // return this.addonsRepository.findOne(id);
    }

    async create(addon: Addon){
        return this.addonsRepository.save(addon);
    }

    async update(id: number, addon: Addon){
        return this.addonsRepository.update(id, addon);
    }

    async remove(id: number){
        // return this.addonsRepository.remove();
    }

}
