import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  async create(
    userID: string,
    createChallengeDto: CreateChallengeDto,
  ): Promise<Challenge> {
    const challenge = this.challengeRepository.create({
      ...createChallengeDto,
      userID,
    });

    return this.challengeRepository.save(challenge);
  }

  async findAll(query: ChallengeQueryDto) {
    const { page = 1, limit = 10, status, userID } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (userID) {
      whereConditions.userID = userID;
    }

    const [challenges, total] = await this.challengeRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { startDate: 'DESC' },
      relations: ['user', 'relation', 'parent', 'brokerAccount', 'details'],
    });

    return {
      data: challenges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userID: string, query: ChallengeQueryDto) {
    return this.findAll({ ...query, userID });
  }

  async findOne(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: { challengeID: id },
      relations: ['user', 'relation', 'parent', 'brokerAccount', 'details'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async update(
    id: string,
    updateChallengeDto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.findOne(id);

    Object.assign(challenge, updateChallengeDto);

    return this.challengeRepository.save(challenge);
  }

  async remove(id: string): Promise<void> {
    const challenge = await this.findOne(id);
    await this.challengeRepository.remove(challenge);
  }
}
