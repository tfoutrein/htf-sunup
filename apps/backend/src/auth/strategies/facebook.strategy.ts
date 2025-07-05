import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        'http://localhost:3000/auth/facebook/callback',
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;

    const email = emails?.[0]?.value;
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const profilePicture = photos?.[0]?.value;

    if (!email) {
      done(new Error('Email not provided by Facebook'), null);
      return;
    }

    try {
      const user = await this.authService.findOrCreateFacebookUser({
        facebookId: id,
        email,
        name: fullName,
        profilePicture,
        facebookAccessToken: accessToken,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
