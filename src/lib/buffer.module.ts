import { Module, Global } from '@nestjs/common';
import { ContextBuffer } from './buffer';
import { MemoryBufferProvider } from './memory-buffer.provider';
import { BufferService } from './buffer.service';

@Global()
@Module({
  providers: [ContextBuffer, MemoryBufferProvider, BufferService],
  exports: [ContextBuffer, MemoryBufferProvider, BufferService],
})
export class ContextsModule {}
