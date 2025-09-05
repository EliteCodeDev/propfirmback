import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RulesService } from '../services/rules.service';
import { RuleDto } from '../dto/create/create-rule.dto';

@Controller('rules')
export class RulesController {

    constructor(
        private readonly rulesService: RulesService
    ) {}

    @Get()
    async findAll(){
        return await this.rulesService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string){
        return await this.rulesService.findById(id);
    }

    @Post()
    async create(@Body() rules: RuleDto){
        return await this.rulesService.create(rules);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() rules: RuleDto){
        return await this.rulesService.update(id, rules);
    }

    @Delete(':id')
    async remove(@Param('id') id: string){
        return await this.rulesService.remove(id);
    }

}