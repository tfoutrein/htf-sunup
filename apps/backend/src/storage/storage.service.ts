import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    // Ensure URL has protocol
    const url = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`;
    return `${url}/${this.bucketName}/${key}`;
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucketName?: string,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName || this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Extract key from S3 URL
  // Supports URLs in format: https://endpoint/bucket-name/key/path
  extractKeyFromUrl(url: string): string | null {
    try {
      // Parse the URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname; // e.g., /happy-team-factory/campaign-videos/2/1760297427841.mov

      // Remove leading slash and split by /
      const parts = pathname.substring(1).split('/');

      // First part is bucket name, rest is the key
      if (parts.length < 2) {
        console.error('Invalid S3 URL format:', url);
        return null;
      }

      // Join all parts after the bucket name
      const key = parts.slice(1).join('/');
      return key;
    } catch (error) {
      console.error('Error extracting key from URL:', error);
      return null;
    }
  }

  // Extract bucket name from S3 URL
  // Supports URLs in format: https://endpoint/bucket-name/key/path
  extractBucketFromUrl(url: string): string | null {
    try {
      // Parse the URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname; // e.g., /happy-team-factory/campaign-videos/2/1760297427841.mov

      // Remove leading slash and split by /
      const parts = pathname.substring(1).split('/');

      // First part is bucket name
      if (parts.length < 1) {
        console.error('Invalid S3 URL format:', url);
        return null;
      }

      return parts[0];
    } catch (error) {
      console.error('Error extracting bucket from URL:', error);
      return null;
    }
  }
}
