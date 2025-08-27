import { Module, Global } from '@nestjs/common';
import { ClassBuffer } from './buffer';
import { BufferService } from './buffer.service';
import { BufferMutexService } from './buffer-mutex.service';
import { BufferController } from './buffer.controller';
import { BufferApiService } from './buffer-api.service';

@Global()
@Module({
  controllers: [BufferController],
  providers: [
    ClassBuffer,
    BufferMutexService,
    BufferService,
    BufferApiService,
  ],
  exports: [ClassBuffer, BufferMutexService, BufferService, BufferApiService],
})
export class BufferModule {}
