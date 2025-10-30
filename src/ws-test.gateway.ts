import { OnModuleInit } from '@nestjs/common';
import { WebSocket } from 'ws';

export interface WebSocketData {
  lastMessage?: any;
  status: 'Conectado' | 'Desconectado' | 'Error';
}

export class WSTestGateway implements OnModuleInit {
  private urls = [
    'ws://69.30.199.194:6704/ws?type=pos',
    'ws://69.30.199.194:6704/ws?type=account',
    'ws://69.30.199.194:6704/ws?type=deal',
  ];

  private connections: Record<string, WebSocketData> = {};

  onModuleInit() {
    console.log('Iniciando pruebas de WebSockets...');
    this.urls.forEach((url) => this.connectToServer(url));
  }

  private connectToServer(url: string) {
    const type = url.split('?type=')[1];
    const ws = new WebSocket(url);

    this.connections[type] = { status: 'Desconectado' };

    ws.on('open', () => {
      this.connections[type].status = 'Conectado';
      console.log(`Conectado a: ${url}`);
    });

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        this.connections[type].lastMessage = parsed;
        console.log(`[${type}]`, parsed);
      } catch {
        this.connections[type].lastMessage = msg.toString();
        console.log(`[${type}]`, msg.toString());
      }
    });

    ws.on('error', (err) => {
      this.connections[type].status = 'Error';
      console.error(`Error en ${url}:`, err.message);
    });

    ws.on('close', () => {
      this.connections[type].status = 'Desconectado';
      console.log(`🔌 Conexión cerrada con ${url}, reintentando en 5s...`);
      setTimeout(() => this.connectToServer(url), 5000);
    });
  }

  // 🔹 Endpoint para ver todos los datos
  getStatus() {
    return this.connections;
  }
}
