import { InjectRepository } from "@nestjs/typeorm";
import { BusinessRequirement } from "./entities/business-requirement.entity";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { CreateBusinessRequirementDto } from "./dto/create-business-requirement.dto";
import { BusinessRequirementQueryDto } from "./dto/business-requirement-query.dto";

@Injectable()
export class BusinessRequirementService {

    constructor(
        @InjectRepository(BusinessRequirement)
        private businessRequirementRepository: Repository<BusinessRequirement>,
        private configService: ConfigService,
    ) {}

    async create(BusinessRequirement: CreateBusinessRequirementDto): Promise<BusinessRequirement>{
        const business = this.businessRequirementRepository.create(BusinessRequirement);
        return this.businessRequirementRepository.save(business);
    }

    async findAll(query: BusinessRequirementQueryDto){
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const data = await this.businessRequirementRepository.find({
            skip,
            take: limit,
        });

       const total = data.length;

       return {
           data,
           total,
           page,
           limit,
           totalPages: Math.ceil(total / limit),
       };
    }

}   