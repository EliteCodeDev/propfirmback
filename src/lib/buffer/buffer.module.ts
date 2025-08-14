import { Module, Global } from '@nestjs/common';
import { MemoryBufferProvider } from './memory-buffer.provider';
import { BufferService } from './buffer.service';

@Global()
@Module({
  providers: [MemoryBufferProvider, BufferService],
  exports: [MemoryBufferProvider, BufferService],
})
export class ContextsModule {}
