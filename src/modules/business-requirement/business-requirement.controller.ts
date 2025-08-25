import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard } from "src/common/guards";
import { BusinessRequirementService } from "./business-requirement.service";
import { CreateBusinessRequirementDto } from "./dto/create-business-requirement.dto";



@ApiTags("business-requirements")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard,RolesGuard)
@Controller("business-requirements")// 
export class BusinessRequirementController {

    constructor(private readonly businessRequirementService: BusinessRequirementService) {}

    @Post("create")
    @ApiOperation({ summary: "Create a new business requirement" })
    create(@Request() req, @Body() createBusinessRequirementDto: CreateBusinessRequirementDto){
        return this.businessRequirementService.create(createBusinessRequirementDto);
    }

    @Get("all")
    @ApiOperation({ summary: "Get all business requirements" })
    findAll(@Query() query: any) {
        return this.businessRequirementService.findAll(query);
    }

}