import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '@root/auth/auth.service';
import { $AccessPayload } from '@root/auth/interfaces/auth.interface';
import { IUser } from '@root/users/interfaces/user.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('token.access.secret'),
    });
  }

  async validate(accessPayload: $AccessPayload): Promise<IUser> {
    const user = await firstValueFrom(
      this.authService.validateJwt(accessPayload.sub),
    );
    return user;
  }
}
