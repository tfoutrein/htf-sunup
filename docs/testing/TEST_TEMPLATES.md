# 📝 Templates de Tests - HTF Sunup

Ce document fournit des templates prêts à l'emploi pour démarrer rapidement l'écriture des tests.

---

## 🧪 Backend - Tests Unitaires

### Template: Test de Service NestJS

```typescript
// apps/backend/src/[module]/[service-name].service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockDb: any;

  beforeEach(async () => {
    // Mock de la base de données
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of items', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      mockDb.returning.mockResolvedValue(mockItems);

      const result = await service.findAll();

      expect(result).toEqual(mockItems);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
    });

    it('should return empty array when no items found', async () => {
      mockDb.returning.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      const mockItem = { id: 1, name: 'Item 1' };

      mockDb.returning.mockResolvedValue([mockItem]);

      const result = await service.findOne(1);

      expect(result).toEqual(mockItem);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      mockDb.returning.mockResolvedValue([]);

      await expect(service.findOne(999)).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createDto = { name: 'New Item' };
      const createdItem = { id: 1, ...createDto };

      mockDb.returning.mockResolvedValue([createdItem]);

      const result = await service.create(createDto);

      expect(result).toEqual(createdItem);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(createDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto = { name: '' };

      mockDb.returning.mockRejectedValue(new Error('Validation error'));

      await expect(service.create(invalidDto)).rejects.toThrow(
        'Validation error',
      );
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const updateDto = { name: 'Updated Item' };
      const updatedItem = { id: 1, ...updateDto };

      mockDb.returning.mockResolvedValue([updatedItem]);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedItem);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      const deletedItem = { id: 1, name: 'Deleted Item' };

      mockDb.returning.mockResolvedValue([deletedItem]);

      const result = await service.remove(1);

      expect(result).toEqual(deletedItem);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
```

### Exemple Concret: CampaignValidationService

```typescript
// apps/backend/src/campaign-validation/campaign-validation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CampaignValidationService } from './campaign-validation.service';
import { UserActionsService } from '../user-actions/user-actions.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('CampaignValidationService', () => {
  let service: CampaignValidationService;
  let userActionsService: jest.Mocked<UserActionsService>;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    const mockUserActionsService = {
      findOne: jest.fn(),
      update: jest.fn(),
      calculateEarnings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignValidationService,
        {
          provide: UserActionsService,
          useValue: mockUserActionsService,
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<CampaignValidationService>(CampaignValidationService);
    userActionsService = module.get(UserActionsService);
  });

  describe('validateUserAction', () => {
    it('should validate a user action and calculate earnings', async () => {
      const userActionId = 1;
      const mockUserAction = {
        id: userActionId,
        userId: 1,
        actionId: 1,
        status: 'pending',
        proof: 'https://example.com/proof.jpg',
      };

      const mockEarnings = {
        basePoints: 10,
        bonusPoints: 5,
        totalPoints: 15,
        totalEuro: 0.75,
      };

      const validatedAction = {
        ...mockUserAction,
        status: 'validated',
        validatedAt: new Date(),
        validatedBy: 1,
        ...mockEarnings,
      };

      userActionsService.findOne.mockResolvedValue(mockUserAction);
      userActionsService.calculateEarnings.mockResolvedValue(mockEarnings);
      userActionsService.update.mockResolvedValue(validatedAction);

      const result = await service.validateUserAction(userActionId, 1);

      expect(result).toEqual(validatedAction);
      expect(userActionsService.findOne).toHaveBeenCalledWith(userActionId);
      expect(userActionsService.calculateEarnings).toHaveBeenCalled();
      expect(userActionsService.update).toHaveBeenCalledWith(
        userActionId,
        expect.objectContaining({
          status: 'validated',
          validatedBy: 1,
        }),
      );
    });

    it('should throw error if user action not found', async () => {
      userActionsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(service.validateUserAction(999, 1)).rejects.toThrow(
        'Not found',
      );
    });

    it('should not validate already validated action', async () => {
      const mockUserAction = {
        id: 1,
        status: 'validated',
      };

      userActionsService.findOne.mockResolvedValue(mockUserAction);

      await expect(service.validateUserAction(1, 1)).rejects.toThrow(
        'Action already validated',
      );
    });
  });

  describe('rejectUserAction', () => {
    it('should reject a user action with reason', async () => {
      const userActionId = 1;
      const rejectionReason = 'Preuve insuffisante';

      const mockUserAction = {
        id: userActionId,
        status: 'pending',
      };

      const rejectedAction = {
        ...mockUserAction,
        status: 'rejected',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedBy: 1,
      };

      userActionsService.findOne.mockResolvedValue(mockUserAction);
      userActionsService.update.mockResolvedValue(rejectedAction);

      const result = await service.rejectUserAction(
        userActionId,
        1,
        rejectionReason,
      );

      expect(result).toEqual(rejectedAction);
      expect(userActionsService.update).toHaveBeenCalledWith(
        userActionId,
        expect.objectContaining({
          status: 'rejected',
          rejectionReason,
          rejectedBy: 1,
        }),
      );
    });
  });

  describe('getPendingActions', () => {
    it('should return list of pending actions for FBO', async () => {
      const fboId = 1;
      const mockPendingActions = [
        { id: 1, status: 'pending', userId: 2 },
        { id: 2, status: 'pending', userId: 3 },
      ];

      mockDb.returning.mockResolvedValue(mockPendingActions);

      const result = await service.getPendingActions(fboId);

      expect(result).toEqual(mockPendingActions);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when no pending actions', async () => {
      mockDb.returning.mockResolvedValue([]);

      const result = await service.getPendingActions(1);

      expect(result).toEqual([]);
    });
  });
});
```

---

## 🔄 Backend - Tests E2E

### Template: Test E2E d'un Module

```typescript
// apps/backend/test/[module-name].e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('[ModuleName] (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // S'authentifier pour obtenir un token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/resources', () => {
    it('should return array of resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/api/resources').expect(401);
    });

    it('should filter resources by query params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/resources?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((r) => r.status === 'active')).toBe(true);
    });
  });

  describe('POST /api/resources', () => {
    it('should create a new resource', async () => {
      const createDto = {
        name: 'Test Resource',
        description: 'A test resource',
      };

      const response = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createDto.name);
      expect(response.body.description).toBe(createDto.description);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should enforce role-based access', async () => {
      // Login avec un utilisateur sans permissions
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password',
        });

      await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${userResponse.body.access_token}`)
        .send({ name: 'Test' })
        .expect(403);
    });
  });

  describe('PATCH /api/resources/:id', () => {
    let resourceId: number;

    beforeEach(async () => {
      // Créer une ressource pour les tests de modification
      const createResponse = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Resource to Update' });

      resourceId = createResponse.body.id;
    });

    it('should update an existing resource', async () => {
      const updateDto = { name: 'Updated Resource' };

      const response = await request(app.getHttpServer())
        .patch(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });

    it('should return 404 for non-existent resource', async () => {
      await request(app.getHttpServer())
        .patch('/api/resources/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('should delete a resource', async () => {
      // Créer une ressource à supprimer
      const createResponse = await request(app.getHttpServer())
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Resource to Delete' });

      const resourceId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que la ressource n'existe plus
      await request(app.getHttpServer())
        .get(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### Exemple Concret: Campaign Validation E2E

```typescript
// apps/backend/test/campaign-validation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Campaign Validation (e2e)', () => {
  let app: INestApplication;
  let fboToken: string;
  let userToken: string;
  let testUserActionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login FBO
    const fboResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'fbo1@htf.com',
        password: 'password',
      });
    fboToken = fboResponse.body.access_token;

    // Login User (filleule)
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'aurelia@htf.com',
        password: 'password',
      });
    userToken = userResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Workflow complet de validation', () => {
    it('should complete full validation workflow', async () => {
      // 1. Utilisateur crée une action
      const createActionResponse = await request(app.getHttpServer())
        .post('/api/user-actions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          actionId: 1,
          challengeId: 1,
        })
        .expect(201);

      testUserActionId = createActionResponse.body.id;
      expect(createActionResponse.body.status).toBe('pending');

      // 2. Utilisateur upload une preuve
      const testImagePath = path.join(__dirname, 'test-proof.jpg');
      const testImage = Buffer.from('fake-image-data', 'utf-8');
      fs.writeFileSync(testImagePath, testImage);

      const uploadResponse = await request(app.getHttpServer())
        .post(`/api/proofs/user-action/${testUserActionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', testImagePath)
        .expect(201);

      expect(uploadResponse.body).toHaveProperty('url');

      // 3. FBO récupère les actions en attente
      const pendingResponse = await request(app.getHttpServer())
        .get('/api/campaign-validation/pending')
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      expect(Array.isArray(pendingResponse.body)).toBe(true);
      expect(pendingResponse.body.some((a) => a.id === testUserActionId)).toBe(
        true,
      );

      // 4. FBO valide l'action
      const validateResponse = await request(app.getHttpServer())
        .patch(`/api/campaign-validation/${testUserActionId}/validate`)
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      expect(validateResponse.body.status).toBe('validated');
      expect(validateResponse.body).toHaveProperty('validatedAt');
      expect(validateResponse.body).toHaveProperty('totalPoints');
      expect(validateResponse.body).toHaveProperty('totalEuro');
      expect(validateResponse.body.totalPoints).toBeGreaterThan(0);

      // 5. Vérifier que l'action n'est plus dans les actions en attente
      const pendingAfterResponse = await request(app.getHttpServer())
        .get('/api/campaign-validation/pending')
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      expect(
        pendingAfterResponse.body.every((a) => a.id !== testUserActionId),
      ).toBe(true);

      // Cleanup
      fs.unlinkSync(testImagePath);
    });

    it('should handle rejection workflow', async () => {
      // Créer une action à rejeter
      const createResponse = await request(app.getHttpServer())
        .post('/api/user-actions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          actionId: 1,
          challengeId: 1,
        })
        .expect(201);

      const actionId = createResponse.body.id;

      // FBO rejette l'action
      const rejectResponse = await request(app.getHttpServer())
        .patch(`/api/campaign-validation/${actionId}/reject`)
        .set('Authorization', `Bearer ${fboToken}`)
        .send({
          reason: 'Preuve insuffisante',
        })
        .expect(200);

      expect(rejectResponse.body.status).toBe('rejected');
      expect(rejectResponse.body.rejectionReason).toBe('Preuve insuffisante');
      expect(rejectResponse.body).toHaveProperty('rejectedAt');
    });
  });

  describe('GET /api/campaign-validation/pending', () => {
    it('should return pending actions for FBO', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/campaign-validation/pending')
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Toutes les actions doivent être en attente
      expect(response.body.every((a) => a.status === 'pending')).toBe(true);
    });

    it('should not allow non-FBO users to access', async () => {
      await request(app.getHttpServer())
        .get('/api/campaign-validation/pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should filter by campaign', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/campaign-validation/pending?campaignId=1')
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      expect(response.body.every((a) => a.campaignId === 1)).toBe(true);
    });
  });

  describe('PATCH /api/campaign-validation/:id/validate', () => {
    it('should calculate correct earnings with bonus', async () => {
      // Créer une action qui devrait bénéficier d'un bonus
      // (implémenter selon la logique métier)

      const validateResponse = await request(app.getHttpServer())
        .patch(`/api/campaign-validation/${testUserActionId}/validate`)
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(200);

      const { basePoints, bonusPoints, totalPoints, totalEuro } =
        validateResponse.body;

      expect(basePoints).toBeGreaterThan(0);
      expect(totalPoints).toBe(basePoints + bonusPoints);
      expect(totalEuro).toBe(totalPoints * 0.05); // 1 point = 0.05€
    });

    it('should not allow validating already validated action', async () => {
      // Tenter de valider deux fois
      await request(app.getHttpServer())
        .patch(`/api/campaign-validation/${testUserActionId}/validate`)
        .set('Authorization', `Bearer ${fboToken}`)
        .expect(400);
    });
  });
});
```

---

## ⚛️ Frontend - Tests de Composants

### Configuration Jest (à créer)

```javascript
// apps/frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// apps/frontend/jest.setup.js
import '@testing-library/jest-dom';

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Template: Test de Composant React

```typescript
// apps/frontend/src/components/[ComponentName].test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(<ComponentName onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should display props correctly', () => {
    const props = {
      title: 'Test Title',
      description: 'Test Description',
    };

    render(<ComponentName {...props} />);

    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.description)).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<ComponentName isLoading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Something went wrong';

    render(<ComponentName error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

### Exemple Concret: ActionCard

```typescript
// apps/frontend/src/components/ActionCard.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionCard } from './ActionCard';

describe('ActionCard', () => {
  const mockAction = {
    id: 1,
    title: 'Vente de produit',
    description: 'Vendre un produit Forever',
    type: 'vente' as const,
    points: 10,
    completed: false,
  };

  it('should display action details', () => {
    render(<ActionCard action={mockAction} />);

    expect(screen.getByText(mockAction.title)).toBeInTheDocument();
    expect(screen.getByText(mockAction.description)).toBeInTheDocument();
    expect(screen.getByText(/10 points/i)).toBeInTheDocument();
  });

  it('should show correct icon for action type', () => {
    render(<ActionCard action={mockAction} />);

    const card = screen.getByTestId('action-card');
    expect(card).toHaveClass('type-vente');
  });

  it('should call onUploadProof when button clicked', async () => {
    const user = userEvent.setup();
    const mockOnUploadProof = jest.fn();

    render(<ActionCard action={mockAction} onUploadProof={mockOnUploadProof} />);

    const uploadButton = screen.getByRole('button', { name: /ajouter une preuve/i });
    await user.click(uploadButton);

    expect(mockOnUploadProof).toHaveBeenCalledWith(mockAction.id);
  });

  it('should display completed state', () => {
    const completedAction = { ...mockAction, completed: true };

    render(<ActionCard action={completedAction} />);

    expect(screen.getByTestId('completed-badge')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ajouter une preuve/i })).not.toBeInTheDocument();
  });

  it('should show proof count when proofs exist', () => {
    const actionWithProofs = { ...mockAction, proofCount: 3 };

    render(<ActionCard action={actionWithProofs} />);

    expect(screen.getByText('3 preuves')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ActionCard action={mockAction} disabled />);

    const uploadButton = screen.getByRole('button', { name: /ajouter une preuve/i });
    expect(uploadButton).toBeDisabled();
  });
});
```

### Test avec React Query

```typescript
// apps/frontend/src/hooks/useActions.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActions } from './useActions';
import * as api from '@/services/api';

jest.mock('@/services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch actions successfully', async () => {
    const mockActions = [
      { id: 1, title: 'Action 1' },
      { id: 2, title: 'Action 2' },
    ];

    (api.getActions as jest.Mock).mockResolvedValue(mockActions);

    const { result } = renderHook(() => useActions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockActions);
    expect(api.getActions).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    (api.getActions as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useActions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('should show loading state', () => {
    (api.getActions as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useActions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
```

---

## 🎭 Frontend - Tests E2E (Playwright)

### Configuration Playwright (à créer)

```typescript
// apps/frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Template: Test E2E Playwright

```typescript
// apps/frontend/e2e/user-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'aurelia@htf.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete action and upload proof', async ({ page }) => {
    // Naviguer vers les actions
    await page.click('text=Mes Actions');
    await expect(page).toHaveURL('/actions');

    // Sélectionner une action
    const firstAction = page.locator('[data-testid="action-card"]').first();
    await firstAction.click();

    // Upload une preuve
    await page.setInputFiles(
      'input[type="file"]',
      'e2e/fixtures/test-proof.jpg',
    );

    // Attendre le succès de l'upload
    await expect(page.locator('text=Preuve ajoutée avec succès')).toBeVisible();

    // Vérifier que l'action est marquée comme complétée
    await expect(
      firstAction.locator('[data-testid="completed-badge"]'),
    ).toBeVisible();
  });

  test('should display daily challenges', async ({ page }) => {
    // Vérifier la présence des challenges du jour
    const challenges = page.locator('[data-testid="daily-challenge"]');
    await expect(challenges).toHaveCount(3); // 3 challenges par jour

    // Vérifier le contenu d'un challenge
    const firstChallenge = challenges.first();
    await expect(
      firstChallenge.locator('[data-testid="challenge-title"]'),
    ).toBeVisible();
    await expect(
      firstChallenge.locator('[data-testid="challenge-progress"]'),
    ).toBeVisible();
  });

  test('should show user statistics', async ({ page }) => {
    // Naviguer vers les statistiques
    await page.click('text=Statistiques');
    await expect(page).toHaveURL('/statistics');

    // Vérifier les métriques affichées
    await expect(page.locator('text=Total de points')).toBeVisible();
    await expect(page.locator('text=Actions complétées')).toBeVisible();
    await expect(page.locator('text=Taux de complétion')).toBeVisible();

    // Vérifier la présence du graphique
    await expect(
      page.locator('[data-testid="statistics-chart"]'),
    ).toBeVisible();
  });
});

test.describe('FBO Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login en tant que FBO
    await page.goto('/login');
    await page.fill('input[name="email"]', 'fbo1@htf.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/fbo/dashboard');
  });

  test('should validate pending actions', async ({ page }) => {
    // Naviguer vers la file de validation
    await page.click('text=Validations');
    await expect(page).toHaveURL('/fbo/validations');

    // Sélectionner une action en attente
    const firstPendingAction = page
      .locator('[data-testid="pending-action"]')
      .first();
    await firstPendingAction.click();

    // Visualiser la preuve
    await expect(page.locator('[data-testid="proof-viewer"]')).toBeVisible();

    // Valider l'action
    await page.click('button:has-text("Valider")');

    // Confirmer la validation
    await page.click('button:has-text("Confirmer")');

    // Vérifier le message de succès
    await expect(page.locator('text=Action validée avec succès')).toBeVisible();

    // Vérifier que l'action n'est plus dans la file
    await expect(firstPendingAction).not.toBeVisible();
  });

  test('should reject action with reason', async ({ page }) => {
    await page.goto('/fbo/validations');

    const firstAction = page.locator('[data-testid="pending-action"]').first();
    await firstAction.click();

    // Rejeter l'action
    await page.click('button:has-text("Rejeter")');

    // Saisir la raison du rejet
    await page.fill('textarea[name="rejectionReason"]', 'Preuve insuffisante');
    await page.click('button:has-text("Confirmer le rejet")');

    // Vérifier le message de succès
    await expect(page.locator('text=Action rejetée')).toBeVisible();
  });
});
```

---

## 🚀 Scripts et Commandes

### Package.json - Frontend

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Package.json - Backend

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch"
  }
}
```

### CI/CD - GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run backend unit tests
        run: cd apps/backend && pnpm test:cov

      - name: Run backend e2e tests
        run: cd apps/backend && pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run frontend unit tests
        run: cd apps/frontend && pnpm test:coverage

      - name: Install Playwright
        run: cd apps/frontend && pnpm exec playwright install

      - name: Run frontend e2e tests
        run: cd apps/frontend && pnpm test:e2e
```

---

## 📚 Ressources

- **Jest**: https://jestjs.io/docs/getting-started
- **Testing Library**: https://testing-library.com/
- **Playwright**: https://playwright.dev/
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing

---

**Dernière mise à jour**: 4 octobre 2025
