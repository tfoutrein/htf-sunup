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
      // Mettre à jour le token d'accès Facebook
      user = await this.usersService.updateFacebookToken(
        user.id,
        facebookData.facebookAccessToken,
      );
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
    });

    return newUser;
  }
}
