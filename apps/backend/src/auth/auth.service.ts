import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (
      user &&
      user.authProvider === 'local' &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      managerId: user.managerId,
      profilePicture: user.profilePicture,
      authProvider: user.authProvider,
      facebookId: user.facebookId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        managerId: user.managerId,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
        facebookId: user.facebookId,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async register(registerDto: {
    name: string;
    email: string;
    password: string;
    role: string;
    managerId?: number;
  }) {
    const hashedPassword = await this.hashPassword(registerDto.password);

    const userData = {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
      authProvider: 'local',
      ...(registerDto.managerId && { managerId: registerDto.managerId }),
    };

    const user = await this.usersService.create(userData);
    return this.login(user);
  }

  async createUser(registerDto: {
    name: string;
    email: string;
    password: string;
    role: string;
    managerId?: number;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(registerDto.password);

    const userData = {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
      authProvider: 'local',
      ...(registerDto.managerId && { managerId: registerDto.managerId }),
    };

    return this.usersService.create(userData);
  }

  async findOrCreateFacebookUser(facebookData: {
    facebookId: string;
    email: string;
    name: string;
    profilePicture?: string;
    facebookAccessToken: string;
  }): Promise<User> {
    // Vérifier si l'utilisateur existe déjà par Facebook ID
    let user = await this.usersService.findByFacebookId(
      facebookData.facebookId,
    );

    if (user) {
      // Mettre à jour toutes les informations Facebook lors de la reconnexion
      user = await this.usersService.updateFacebookInfo(user.id, {
        facebookAccessToken: facebookData.facebookAccessToken,
        profilePicture: facebookData.profilePicture,
        name: facebookData.name,
      });
      return user;
    }

    // Vérifier si l'utilisateur existe déjà par email
    user = await this.usersService.findByEmail(facebookData.email);

    if (user) {
      // Lier le compte Facebook à l'utilisateur existant
      user = await this.usersService.linkFacebookAccount(user.id, {
        facebookId: facebookData.facebookId,
        facebookAccessToken: facebookData.facebookAccessToken,
        profilePicture: facebookData.profilePicture,
        authProvider: 'facebook',
      });
      return user;
    }

    // Créer un nouvel utilisateur Facebook
    const newUser = await this.usersService.create({
      name: facebookData.name,
      email: facebookData.email,
      facebookId: facebookData.facebookId,
      facebookAccessToken: facebookData.facebookAccessToken,
      profilePicture: facebookData.profilePicture,
      authProvider: 'facebook',
      role: 'fbo', // Role par défaut
      // Pas de managerId assigné - l'utilisateur devra choisir son manager
    });

    return newUser;
  }

  // Nouvelle méthode pour assigner un manager à un utilisateur
  async assignManagerToUser(userId: number, managerId: number): Promise<User> {
    return this.usersService.assignManager(userId, managerId);
  }

  // Méthode pour récupérer un utilisateur par son ID
  async findUserById(userId: number): Promise<User> {
    return this.usersService.findOne(userId);
  }

  // Méthode pour vérifier si l'utilisateur a besoin d'un manager
  async checkUserNeedsManager(user: User): Promise<boolean> {
    return !user.managerId && user.role === 'fbo';
  }

  // Nouvelle méthode pour lier un compte Facebook à un compte existant
  async linkFacebookToExistingUser(
    userId: number,
    facebookData: {
      facebookId: string;
      facebookAccessToken: string;
      profilePicture?: string;
    },
  ): Promise<User> {
    // Vérifier d'abord si ce Facebook ID n'est pas déjà utilisé
    const existingFacebookUser = await this.usersService.findByFacebookId(
      facebookData.facebookId,
    );

    if (existingFacebookUser && existingFacebookUser.id !== userId) {
      throw new Error('Ce compte Facebook est déjà lié à un autre utilisateur');
    }

    return this.usersService.linkFacebookAccount(userId, {
      facebookId: facebookData.facebookId,
      facebookAccessToken: facebookData.facebookAccessToken,
      profilePicture: facebookData.profilePicture,
      authProvider: 'facebook',
    });
  }
}
