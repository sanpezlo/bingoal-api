import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcrypt';

import {
  IAuth,
  $RefreshPayload,
  $AccessPayload,
} from '@root/auth/interfaces/auth.interface';
import { TokensRepository } from '@root/auth/tokens.repository';
import { UsersRepository } from '@root/users/users.repository';
import { IUser, $User } from '@root/users/interfaces/user.interface';
import { RefreshDto, UpdatePasswordDto } from '@root/auth/dto/auth.dto';
import { Observable, from, switchMap } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private tokensRepository: TokensRepository,
    @Inject(forwardRef(() => UsersRepository))
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async login(user: IUser): Promise<IAuth> {
    const $accessPayload: $AccessPayload = {
      sub: user._id,
    };
    const accessToken = this.createAccessToken($accessPayload);

    const $token = this.tokensRepository.toJSON(
      await this.tokensRepository.create({
        user: $accessPayload.sub,
      }),
    );
    const $refreshPayload: $RefreshPayload = {
      sub: $accessPayload.sub,
      jti: $token._id,
    };
    const $refreshToken = this.createRefreshToken($refreshPayload);

    return {
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: this.configService.get<number>('token.access.expires_in'),
      refresh_token: $refreshToken,
      refresh_token_expires_in: this.configService.get<number>(
        'token.refresh.expires_in',
      ),
    };
  }

  async refresh(refreshDto: RefreshDto): Promise<IAuth> {
    try {
      const $refreshPayload = this.jwtService.verify<$RefreshPayload>(
        refreshDto.refresh,
        {
          secret: this.configService.get<string>('token.refresh.secret'),
          ignoreExpiration: false,
        },
      );
      const [tokenDocument] = await this.tokensRepository.find({
        _id: $refreshPayload.jti,
        user: $refreshPayload.sub,
      });
      if (!tokenDocument) throw new UnauthorizedException();

      const $newRefreshPayload: $RefreshPayload = {
        sub: $refreshPayload.sub,
        jti: $refreshPayload.jti,
      };
      const $accessPayload: $AccessPayload = { sub: $newRefreshPayload.sub };

      const accessToken = this.createAccessToken($accessPayload);
      const $refreshToken = this.createRefreshToken($newRefreshPayload);

      return {
        token_type: 'Bearer',
        access_token: accessToken,
        expires_in: this.configService.get<number>('token.access.expires_in'),
        refresh_token: $refreshToken,
        refresh_token_expires_in: this.configService.get<number>(
          'token.refresh.expires_in',
        ),
      };
    } catch (error) {
      const $refreshPayload = this.jwtService.decode(
        refreshDto.refresh,
      ) as $RefreshPayload;
      await this.tokensRepository.delete({ _id: $refreshPayload.jti });
      throw new BadRequestException(['refresh must be a valid jwt string']);
    }
  }

  async validateLocal(email: string, password: string): Promise<IUser> {
    const [userDocument] = await this.usersRepository.find({ email });
    if (!userDocument) return null;
    const $user: $User = this.usersRepository.toJSON(userDocument);
    if (await this.validatePassword($user, password))
      return this.usersRepository.format($user);
    return null;
  }

  async validateJwt(sub: string): Promise<IUser> {
    const [userDocument] = await this.usersRepository.find({ _id: sub });
    if (!userDocument) return null;
    const $user: $User = this.usersRepository.toJSON(userDocument);
    return this.usersRepository.format($user);
  }

  async validatePassword(user: $User, password: string): Promise<boolean> {
    return await compare(password, user.password);
  }

  rxValidatePassword(user: $User, password: string): Observable<boolean> {
    return from(compare(password, user.password));
  }

  async hash(password: string): Promise<string> {
    const salt = await genSalt(10);
    return await hash(password, salt);
  }

  rxHash(password: string): Observable<string> {
    return from(genSalt(10)).pipe(
      switchMap((salt) => from(hash(password, salt))),
    );
  }

  createAccessToken(accessPayload: $AccessPayload): string {
    return this.jwtService.sign(accessPayload);
  }

  createRefreshToken($refreshPayload: $RefreshPayload): string {
    return this.jwtService.sign($refreshPayload, {
      secret: this.configService.get<string>('token.refresh.secret'),
      expiresIn: this.configService.get<number>('token.refresh.expires_in'),
    });
  }

  async updatePassword(
    user: IUser,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<IAuth> {
    const [userDocument] = await this.usersRepository.find({
      _id: user._id,
    });
    const $user: $User = this.usersRepository.toJSON(userDocument);
    if (!(await this.validatePassword($user, updatePasswordDto.password)))
      throw new ForbiddenException();

    const newPassword = await this.hash(updatePasswordDto.newPassword);

    await this.usersRepository.update(
      { _id: user._id },
      { password: newPassword },
    );

    await this.tokensRepository.delete({ user: user._id });

    return await this.login(user);
  }
}
