import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileUtil {
  static generateFileName(originalName: string): string {
    const extension = extname(originalName);
    return `${uuidv4()}${extension}`;
  }

  static isValidImageExtension(filename: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = extname(filename).toLowerCase();
    return validExtensions.includes(extension);
  }

  static isValidDocumentExtension(filename: string): boolean {
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const extension = extname(filename).toLowerCase();
    return validExtensions.includes(extension);
  }

  static getFileSizeInMB(sizeInBytes: number): number {
    return sizeInBytes / (1024 * 1024);
  }
}