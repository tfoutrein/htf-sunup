import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Proofs (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserActionId: number;
  let testDailyBonusId: number;
  let uploadedProofIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Se connecter pour obtenir un token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'aurelia@htf.com',
        password: 'password',
      });

    authToken = loginResponse.body.access_token;

    // Créer des données de test si nécessaire
    // (pour simplifier, on assume qu'il existe des userActions et dailyBonus en base)
    // En production, on devrait créer des données de test dédiées
  });

  afterAll(async () => {
    // Nettoyer les preuves uploadées pendant les tests
    for (const proofId of uploadedProofIds) {
      try {
        await request(app.getHttpServer())
          .delete(`/proofs/${proofId}`)
          .set('Authorization', `Bearer ${authToken}`);
      } catch (error) {
        console.warn(`Failed to cleanup proof ${proofId}:`, error);
      }
    }

    await app.close();
  });

  describe('/proofs/user-action/:id (POST)', () => {
    it('should upload a proof for user action', async () => {
      // Créer un fichier de test temporaire
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      const testImageContent = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gNzAK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
        'base64',
      );

      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, testImageContent);
      }

      // Assumer qu'il existe une action utilisateur avec l'ID 1
      // En production, on devrait créer cette action dans le setup
      testUserActionId = 1;

      const response = await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('mimeType');
      expect(response.body.mimeType).toBe('image/jpeg');

      uploadedProofIds.push(response.body.id);

      // Nettoyer le fichier de test
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('should reject invalid file types', async () => {
      const testFilePath = path.join(__dirname, 'test-invalid.txt');
      fs.writeFileSync(testFilePath, 'Invalid file content');

      testUserActionId = 1;

      await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(400);

      // Nettoyer le fichier de test
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should reject files that are too large', async () => {
      const testImagePath = path.join(__dirname, 'test-large.jpg');
      // Créer un fichier > 10MB (limite)
      const largeContent = Buffer.alloc(11 * 1024 * 1024, 'a'); // 11MB
      fs.writeFileSync(testImagePath, largeContent);

      testUserActionId = 1;

      await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(400);

      // Nettoyer le fichier de test
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });
  });

  describe('/proofs/daily-bonus/:id (POST)', () => {
    it('should upload a proof for daily bonus', async () => {
      const testImagePath = path.join(__dirname, 'test-bonus-image.jpg');
      const testImageContent = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gNzAK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
        'base64',
      );

      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, testImageContent);
      }

      // Assumer qu'il existe un bonus quotidien avec l'ID 1
      testDailyBonusId = 1;

      const response = await request(app.getHttpServer())
        .post(`/proofs/daily-bonus/${testDailyBonusId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('mimeType');

      uploadedProofIds.push(response.body.id);

      // Nettoyer le fichier de test
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });
  });

  describe('/proofs/user-action/:id (GET)', () => {
    it('should get proofs for user action', async () => {
      testUserActionId = 1;

      const response = await request(app.getHttpServer())
        .get(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('url');
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('size');
        expect(response.body[0]).toHaveProperty('mimeType');
        expect(response.body[0]).toHaveProperty('createdAt');
      }
    });
  });

  describe('/proofs/daily-bonus/:id (GET)', () => {
    it('should get proofs for daily bonus', async () => {
      testDailyBonusId = 1;

      const response = await request(app.getHttpServer())
        .get(`/proofs/daily-bonus/${testDailyBonusId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/proofs/:id/signed-url (GET)', () => {
    it('should generate signed URL for proof', async () => {
      // Utiliser un ID de preuve uploadé précédemment
      if (uploadedProofIds.length > 0) {
        const proofId = uploadedProofIds[0];

        const response = await request(app.getHttpServer())
          .get(`/proofs/${proofId}/signed-url`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('url');
        expect(response.body).toHaveProperty('expiresAt');
        expect(typeof response.body.url).toBe('string');
        expect(response.body.url).toContain('http');
      }
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/proofs/1/signed-url')
        .expect(401);
    });
  });

  describe('/proofs/:id (DELETE)', () => {
    it('should delete a proof', async () => {
      // Créer une preuve d'abord
      const testImagePath = path.join(__dirname, 'test-delete-image.jpg');
      const testImageContent = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gNzAK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
        'base64',
      );

      if (!fs.existsSync(testImagePath)) {
        fs.writeFileSync(testImagePath, testImageContent);
      }

      testUserActionId = 1;

      const uploadResponse = await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath);

      const proofId = uploadResponse.body.id;

      // Maintenant supprimer la preuve
      const response = await request(app.getHttpServer())
        .delete(`/proofs/${proofId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Nettoyer le fichier de test
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('should reject unauthorized deletion', async () => {
      await request(app.getHttpServer()).delete('/proofs/999').expect(401);
    });
  });

  describe('Multiple proofs upload', () => {
    it('should handle multiple proofs for the same user action', async () => {
      testUserActionId = 1;

      // Upload première preuve
      const testImagePath1 = path.join(__dirname, 'test-multi-1.jpg');
      const testImageContent = Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gNzAK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
        'base64',
      );

      fs.writeFileSync(testImagePath1, testImageContent);

      const response1 = await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath1)
        .expect(201);

      uploadedProofIds.push(response1.body.id);

      // Upload deuxième preuve
      const testImagePath2 = path.join(__dirname, 'test-multi-2.jpg');
      fs.writeFileSync(testImagePath2, testImageContent);

      const response2 = await request(app.getHttpServer())
        .post(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath2)
        .expect(201);

      uploadedProofIds.push(response2.body.id);

      // Vérifier qu'on peut récupérer les deux preuves
      const getResponse = await request(app.getHttpServer())
        .get(`/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.length).toBeGreaterThanOrEqual(2);

      // Nettoyer les fichiers de test
      [testImagePath1, testImagePath2].forEach((path) => {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      });
    });
  });
});
