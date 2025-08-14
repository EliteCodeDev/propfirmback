import { Module, Global } from '@nestjs/common';
import { ClassBuffer } from './buffer';
import { BufferService } from './buffer.service';

@Global()
@Module({
  providers: [ClassBuffer, BufferService],
  exports: [ClassBuffer, BufferService],
})
export class ContextsModule {}
