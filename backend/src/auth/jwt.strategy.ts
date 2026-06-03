import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', JSON.stringify(payload));
    const phoneNumber = payload.phoneNumber || payload.phone_number;
    
    if (!phoneNumber) {
      console.log('JWT Validation Error: No phone number in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!user) {
      console.log(`JWT Validation Error: User not found for phone number ${phoneNumber}`);
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokenVersion = payload.tokenVersion !== undefined ? payload.tokenVersion : 1;
    const dbTokenVersion = user.token_version !== undefined && user.token_version !== null ? user.token_version : 1;

    if (tokenVersion !== dbTokenVersion) {
      console.log(`JWT Validation Error: Token version mismatch for user ${user.id}. DB: ${dbTokenVersion}, Token: ${tokenVersion}`);
      throw new UnauthorizedException('Session expired. Logged in from another device.');
    }

    console.log(`JWT Validation Success for user ${user.id} (${phoneNumber})`);
    return {
      id: user.id,
      phoneNumber: user.phone_number,
      roles: user.roles || [],
    };
  }
}
