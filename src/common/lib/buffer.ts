import { Injectable } from "@nestjs/common";

@Injectable() //una sola instancia del buffer estara en toda la aplicacion
export class ContextBuffer{

    private buffer: Map <string, object> = new Map() //login, objeto con infromacion

    public setBuffer(login:string, data:object): void{
        this.buffer.set(login, data)
    }

    public getBuffer(login:string): object | undefined {
        return this.buffer.get(login)
    }

    public has(login:string): boolean {
        return this.buffer.has(login)
    }

    public delete(login:string): void {
        this.buffer.delete(login)
    }

    public clear(): void{
        this.buffer.clear()
    }

    public getAllBuffers(): Record<string, object> {
        const obj: Record<string, object> = {};
        for (const [key, value] of this.buffer.entries()) {
            obj[key] = value;
        }
        return obj;
    }

    public getLength(): number {
        return this.buffer.size;
    }

}