import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class StorageService {
    private readonly storageBasePath = path.join(process.cwd(), 'storage', 'public');
    private readonly verificationsPath = path.join(this.storageBasePath, 'verifications');

    constructor() {
        this.createDirectories();
    }

    private async createDirectories() {
        try {
            await fs.mkdir(this.verificationsPath, { recursive: true });
        } catch (error) {
            console.error('Error creating storage directories:', error);
        }
    }

    async saveFile(userId: string, verificationId: string, file: UploadedFile): Promise<string> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const verificationDir = path.join(this.verificationsPath, userId, verificationId);
        
        await fs.mkdir(verificationDir, { recursive: true });
        const fileName = `${uuidv4()}_${file.originalname}`;
        const filePath = path.join(verificationDir, fileName);
        await fs.writeFile(filePath, file.buffer);
        
        return `verifications/${userId}/${verificationId}/${fileName}`;
    }

    async deleteFile(filePath: string): Promise<void> {
        const fullPath = path.join(this.storageBasePath, filePath);
        await fs.unlink(fullPath).catch(() => {});
    }

    getFileUrl(filePath: string): string {
        return `/api/files/${filePath}`;
    }

    getFullPath(filePath: string): string {
        return path.join(this.storageBasePath, filePath);
    }
}
