import { Injectable, Inject, Logger, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { Client } from 'minio';
import { Readable } from 'stream';

export interface UploadResult {
  fileName: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private bucketName: string;

  constructor(
    @Inject(MINIO_CONNECTION) private readonly minioClient: Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('minio.bucketName');
  }

  async onModuleInit() {
    await this.createBucketIfNotExists();
    await this.setBucketPolicy();
  }

  /**
   * Crea el bucket si no existe
   */
  private async createBucketIfNotExists(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.error(`Error creating bucket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Establece la política del bucket para acceso público de lectura
   */
  private async setBucketPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      this.logger.log(`Bucket policy set for '${this.bucketName}'`);
    } catch (error) {
      this.logger.warn(`Could not set bucket policy: ${error.message}`);
    }
  }

  /**
   * Sube un archivo a MinIO
   */
  async uploadFile(file: FileUpload, folder?: string): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    const fileName = this.generateFileName(file.originalname, folder);
    const stream = Readable.from(file.buffer);

    try {
      const uploadInfo = await this.minioClient.putObject(
        this.bucketName,
        fileName,
        stream,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      const url = await this.getFileUrl(fileName);

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        fileName,
        originalName: file.originalname,
        url,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Obtiene la URL pública de un archivo
   */
  async getFileUrl(fileName: string): Promise<string> {
    const endPoint = this.configService.get('minio.endPoint');
    const port = this.configService.get('minio.port');
    const useSSL = this.configService.get('minio.useSSL');
    
    const protocol = useSSL ? 'https' : 'http';
    const portSuffix = (port && port !== 80 && port !== 443) ? `:${port}` : '';
    
    return `${protocol}://${endPoint}${portSuffix}/${this.bucketName}/${fileName}`;
    
  }

  /**
   * Descarga un archivo de MinIO
   */
  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(this.bucketName, fileName);
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`);
      throw new NotFoundException(`File not found: ${fileName}`);
    }
  }

  /**
   * Elimina un archivo de MinIO
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Lista archivos en el bucket
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const objectsStream = this.minioClient.listObjects(this.bucketName, prefix, true);
      const files: string[] = [];
      
      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });
        objectsStream.on('end', () => resolve(files));
        objectsStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateFileName(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const baseName = `${timestamp}-${randomString}`;
    const fileName = extension ? `${baseName}.${extension}` : baseName;
    
    return folder ? `${folder}/${fileName}` : fileName;
  }
}
