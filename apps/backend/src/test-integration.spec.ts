import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { ActionsService } from './actions/actions.service';
import { JwtService } from '@nestjs/jwt';
import { DATABASE_CONNECTION } from './db/database.module';

describe('Integration Tests', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let actionsService: ActionsService;

  beforeEach(async () => {
    const mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        ActionsService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    actionsService = module.get<ActionsService>(ActionsService);
  });

  describe('Services instantiation', () => {
    it('should create AuthService', () => {
      expect(authService).toBeDefined();
    });

    it('should create UsersService', () => {
      expect(usersService).toBeDefined();
    });

    it('should create ActionsService', () => {
      expect(actionsService).toBeDefined();
    });
  });

  describe('AuthService', () => {
    it('should hash password', async () => {
      const password = 'testPassword';
      const hashedPassword = await authService.hashPassword(password);
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
    });
  });
});
