
import { Controller,Get,Post,Body,Patch,Param,Delete,HttpCode,HttpStatus, Query } from '@nestjs/common';
import { AddonChallengService } from '../services/addon-challenge.service';
import { CreateChallegeAddonDto } from '../dto/create/create-challenge-addo.dto';

@Controller('addon-challeng')

export class AddonChallengController {
    constructor(
        private readonly addonChallengService: AddonChallengService
    ){}

    @Get()
    async findAll(){
        return await this.addonChallengService.findAll();
    }

    @Post()
    async create(@Body() addonChalleng: CreateChallegeAddonDto){
        return await this.addonChallengService.create(addonChalleng);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() addonChalleng: CreateChallegeAddonDto){
        return await this.addonChallengService.update(id, addonChalleng);
    }

    @Delete(':id')
    async remove(@Param('id') id: string){
        return await this.addonChallengService.remove(id);
    }

}