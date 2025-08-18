import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Get('*')
  async serveFile(@Param() params: any, @Res() res: Response) {
    const filePath = params[0];
    
    const fullPath = this.storageService.getFullPath(filePath);
    
    try {
      res.sendFile(fullPath);
    } catch (error) {
      throw new NotFoundException('Archivo no encontrado');
    }
  }
}
