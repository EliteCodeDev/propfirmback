import { Module, Global } from "@nestjs/common";
import { ContextBuffer } from "./buffer";

@Global()
@Module({
    providers: [ContextBuffer],
    exports: [ContextBuffer],
})
export class ContextsModule {}
