import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessRequirement } from "./entities/business-requirement.entity";
import { BusinessRequirementController } from "./business-requirement.controller";
import { BusinessRequirementService } from "./business-requirement.service";

@Module({
    imports: [TypeOrmModule.forFeature([BusinessRequirement])],
    controllers: [BusinessRequirementController],
    providers: [BusinessRequirementService],
    exports: [BusinessRequirementService],
})

export class BusinessRequirementModule {}