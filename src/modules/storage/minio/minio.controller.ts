import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { MinioService, FileUpload, UploadResult } from './minio.service';

@ApiTags('MinIO Storage')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Subir archivo a MinIO' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        originalName: { type: 'string' },
        url: { type: 'string' },
        size: { type: 'number' },
        mimeType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo no válido' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const fileUpload: FileUpload = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    };

    return await this.minioService.uploadFile(fileUpload, folder);
  }

  @Get('download/:fileName')
  @ApiOperation({ summary: 'Descargar archivo de MinIO' })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo a descargar' })
  @ApiResponse({ status: 200, description: 'Archivo descargado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async downloadFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const fileBuffer = await this.minioService.downloadFile(fileName);
      
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      });
      
      res.send(fileBuffer);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Archivo no encontrado: ${fileName}`,
      });
    }
  }

  @Get('url/:fileName')
  @ApiOperation({ summary: 'Obtener URL pública del archivo' })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo' })
  @ApiResponse({
    status: 200,
    description: 'URL obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        fileName: { type: 'string' },
      },
    },
  })
  async getFileUrl(@Param('fileName') fileName: string) {
    const url = await this.minioService.getFileUrl(fileName);
    return {
      fileName,
      url,
    };
  }

  @Delete(':fileName')
  @ApiOperation({ summary: 'Eliminar archivo de MinIO' })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo a eliminar' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al eliminar archivo' })
  async deleteFile(@Param('fileName') fileName: string) {
    await this.minioService.deleteFile(fileName);
    return {
      message: `Archivo ${fileName} eliminado exitosamente`,
      fileName,
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'Listar archivos en MinIO' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Prefijo para filtrar archivos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
        },
        count: { type: 'number' },
      },
    },
  })
  async listFiles(@Query('prefix') prefix?: string) {
    const files = await this.minioService.listFiles(prefix);
    return {
      files,
      count: files.length,
    };
  }

  @Get('exists/:fileName')
  @ApiOperation({ summary: 'Verificar si un archivo existe' })
  @ApiParam({ name: 'fileName', description: 'Nombre del archivo a verificar' })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        fileName: { type: 'string' },
      },
    },
  })
  async fileExists(@Param('fileName') fileName: string) {
    const exists = await this.minioService.fileExists(fileName);
    return {
      fileName,
      exists,
    };
  }
}
