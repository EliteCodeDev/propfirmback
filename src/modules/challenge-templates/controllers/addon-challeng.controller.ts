
import { Controller,Get,Post,Body,Patch,Param,Delete } from '@nestjs/common';
import { AddonChallengService } from '../services/addon-challenge.service';
import { CreateChallegeAddonDto } from '../dto/create/create-challenge-addo.dto';
import { UpdateChallengeAddonDto } from '../dto/update/update-challenge-addon.dto';

@Controller('addon-challeng')

export class AddonChallengController {
    constructor(
        private readonly addonChallengService: AddonChallengService
    ){}

    @Get()
    async findAll(){
        return await this.addonChallengService.findAll();
    }

    @Get(':id')
    async findByIdChallenge(@Param('id') id: string){
        return await this.addonChallengService.findByChallengeId(id);
    }

    @Post()
    async create(@Body() addonChalleng: CreateChallegeAddonDto){
        return await this.addonChallengService.create(addonChalleng);
    }

    @Patch(':addonID/:challengeID')
    async update(
        @Param('addonID') addonID: string, 
        @Param('challengeID') challengeID: string, 
        @Body() addonChalleng: UpdateChallengeAddonDto
    ){
        return await this.addonChallengService.update(addonID, challengeID, addonChalleng);
    }

    @Delete(':addonID/:challengeID')
    async remove(
        @Param('addonID') addonID: string, 
        @Param('challengeID') challengeID: string
    ){
        return await this.addonChallengService.remove(addonID, challengeID);
    }

}