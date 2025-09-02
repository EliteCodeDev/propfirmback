import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete
} from '@nestjs/common';
import { AddonsService } from '../services/addons.service';
import { CreateAddonsDto } from '../dto/create/create-addons.dto';

@Controller('addons')
export class AddonsController {

    constructor(
        private readonly addonsService: AddonsService
    ){}

    @Get()
    async findAll(){
        return await this.addonsService.findAll();
    }

    @Get(":id")
    async findOne(@Param('id') id: string){
        return await this.addonsService.findOne(id);
    }

    @Post()
    async create(@Body() addon: CreateAddonsDto){
        return await this.addonsService.create(addon);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() addon: CreateAddonsDto){
        return await this.addonsService.update(id, addon);
    }

    @Delete(':id')
    async remove(@Param('id') id: string){
        return await this.addonsService.remove(id);
    }

}