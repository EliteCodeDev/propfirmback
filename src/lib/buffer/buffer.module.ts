import { Module, Global } from '@nestjs/common';
import { ClassBuffer } from './buffer';
import { BufferService } from './buffer.service';
import { BufferMutexService } from './buffer-mutex.service';

@Global()
@Module({
  providers: [ClassBuffer, BufferMutexService, BufferService],
  exports: [ClassBuffer, BufferMutexService, BufferService],
})
export class BufferModule {}
