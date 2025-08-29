import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';
import { Style } from './entities/style.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Style]),
  ],
  controllers: [StylesController],
  providers: [StylesService],
  exports: [StylesService],
})
export class StylesModule {}