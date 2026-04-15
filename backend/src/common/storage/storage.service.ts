import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageZoneName: string;
  private readonly accessKey: string;
  private readonly cdnUrl: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.storageZoneName = this.configService.get<string>('BUNNY_STORAGE_ZONE') || 'rideandhra-storage';
    this.accessKey = this.configService.get<string>('BUNNY_ACCESS_KEY') || 'placeholder_access_key';
    this.cdnUrl = this.configService.get<string>('BUNNY_CDN_URL') || 'https://rideandhra.b-cdn.net';
    this.region = this.configService.get<string>('BUNNY_REGION') || ''; // 'ny', 'sg', etc.
  }

  private getStorageHost(): string {
    return this.region ? `${this.region}.storage.bunnycdn.com` : 'storage.bunnycdn.com';
  }

  /**
   * Uploads a file to Bunny.net Storage
   * @param fileName Name of the file (e.g. profile.jpg)
   * @param buffer File buffer
   * @param folder Optional subfolder (e.g. users/123)
   * @returns The full CDN URL of the uploaded asset
   */
  async upload(fileName: string, buffer: Buffer, folder: string = ''): Promise<string> {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const path = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
    const url = `https://${this.getStorageHost()}/${this.storageZoneName}/${path}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          AccessKey: this.accessKey,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(buffer),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bunny.net Upload Failed: ${response.statusText} - ${errorText}`);
      }

      this.logger.log(`Successfully uploaded ${path} to Bunny.net`);
      return `${this.cdnUrl}/${path}`;
    } catch (error) {
      this.logger.error(`Error uploading to Bunny.net: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a file from Bunny.net Storage
   */
  async delete(path: string): Promise<void> {
    const relativePath = path.replace(`${this.cdnUrl}/`, '');
    const url = `https://${this.getStorageHost()}/${this.storageZoneName}/${relativePath}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          AccessKey: this.accessKey,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Bunny.net Delete Failed: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting from Bunny.net: ${error.message}`);
    }
  }
}
