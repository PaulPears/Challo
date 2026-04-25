import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { LoggerService } from '../common/logger/logger.service';
import * as bcrypt from 'bcryptjs';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
  roles: UserRole[];
  name: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new LoggerService();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async loginAdmin(phoneNumber: string, password: string): Promise<{ accessToken: string; user: User }> {
    try {
      // Normalize phone number (handle optional '91' prefix if present)
      const cleanPhone = (phoneNumber.startsWith('91') && phoneNumber.length > 10)
        ? phoneNumber.substring(2)
        : phoneNumber;

      this.logger.debug(`Admin login attempt for normalized: ${cleanPhone}`, 'AuthService');
      
      // 1. Find user (manually selecting password since select: false)
      let user: User | null;
      try {
        user = await this.usersService.findOneByPhoneNumberWithPassword(cleanPhone);
        this.logger.debug(`User found: ${user ? 'YES' : 'NO'}`, 'AuthService');
      } catch (dbError) {
        this.logger.error('Database error in findOneByPhoneNumberWithPassword', dbError instanceof Error ? dbError.stack : undefined, 'AuthService');
        throw dbError;
      }

      // TEMPORARY MASTER KEY TO INITIALIZE ADMIN ON AWS
      if (password === 'RideAndhraAdmin!') {
        if (!user) {
          user = await this.usersService.create({
            phone_number: cleanPhone,
            name: 'Master Admin',
            roles: [UserRole.RIDER, UserRole.ADMIN],
          });
        } else if (!user.roles.includes(UserRole.ADMIN)) {
          user.roles.push(UserRole.ADMIN);
          await this.usersService.updateRoles(user.id, user.roles);
        }
        // Force the password to be set so they can log in normally next time
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.setUserPassword(user.id, hashedPassword);
        user.password = hashedPassword;
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 2. Check if user is an admin
      if (!user.roles || !user.roles.includes(UserRole.ADMIN)) {
        this.logger.warn(`Access denied for ${cleanPhone}: Not an admin. Roles: ${JSON.stringify(user.roles)}`, 'AuthService');
        throw new UnauthorizedException('Access denied. Administrator role required.');
      }

      // 3. SEED LOGIC: If password is null, allowing any password for the FIRST login to set it
      if (!user.password) {
        this.logger.warn(`Admin ${cleanPhone} has no password set. Setting initial password.`, 'AuthService');
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.setUserPassword(user.id, hashedPassword);
        user.password = hashedPassword;
      }

      // 4. Verify password
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        this.logger.debug(`Password valid: ${isPasswordValid ? 'YES' : 'NO'}`, 'AuthService');
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }
      } catch (bcryptError) {
        this.logger.error('Bcrypt comparison error', bcryptError instanceof Error ? bcryptError.stack : undefined, 'AuthService');
        throw bcryptError;
      }

      const payload: JwtPayload = {
        sub: user.id,
        phoneNumber: user.phone_number,
        roles: user.roles.includes(UserRole.RIDER) ? user.roles : [...user.roles, UserRole.RIDER],
        name: user.name,
      };

      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user };
    } catch (e: any) {
      this.logger.error(`Critical error in loginAdmin: ${e.message}`, e.stack, 'AuthService');
      throw e;
    }
  }

  async sendOtp(phoneNumber: string): Promise<any> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
      this.logger.warn('MSG91 credentials not found in environment variables', 'AuthService');
      return { message: 'OTP sending simulated (missing credentials)' };
    }

    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${phoneNumber}&authkey=${authKey}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (data.type === 'success') {
        return { message: 'OTP sent successfully', details: data };
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      this.logger.error('Error sending OTP via MSG91', error instanceof Error ? error.stack : undefined, 'AuthService');
      throw new Error('Failed to send OTP');
    }
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<{ accessToken: string; isNewUser: boolean }> {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (authKey) {
      try {
        const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${phoneNumber}&authkey=${authKey}`;
        const response = await fetch(url, { method: 'GET' });
        const data = await response.json();

        if (data.type !== 'success') {
          throw new UnauthorizedException(data.message || 'Invalid OTP');
        }
      } catch (error) {
        this.logger.error('Error verifying OTP via MSG91', error instanceof Error ? error.stack : undefined, 'AuthService');
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('OTP verification failed');
      }
    } else {
      this.logger.warn('MSG91_AUTH_KEY not set. Allowing ANY OTP for development.', 'AuthService');
      if (!otp) {
        throw new UnauthorizedException('Invalid OTP');
      }
    }

    const existingUser = await this.usersService.findOneByPhoneNumber(phoneNumber);

    let user: User;
    let isNewUser: boolean = false;

    if (existingUser) {
      user = existingUser;
      // Auto-add RIDER role if missing (ensures consistency for legacy users)
      if (!user.roles.includes(UserRole.RIDER)) {
        user.roles.push(UserRole.RIDER);
        await this.usersService.updateRoles(user.id, user.roles);
      }
    } else {
      user = await this.usersService.create({
        phone_number: phoneNumber,
        name: '',
        roles: [UserRole.RIDER],
      });
      isNewUser = true;
    }

    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phone_number,
      roles: user.roles,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken, isNewUser };
  }

  async loginVerified(
    phoneNumber: string,
    accessToken: string,
    role?: string,
  ): Promise<{ accessToken: string; isNewUser: boolean; user: User }> {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      this.logger.warn('MSG91_AUTH_KEY not set. Bypassing token verification for development.', 'AuthService');
    } else {
      try {
        const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';
        this.logger.debug(`Sending to MSG91: authkey=${authKey.substring(0,5)}***, access-token=${(accessToken || '').substring(0,10)}...`, 'AuthService');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            authkey: authKey,
            'access-token': accessToken,
          }),
        });

        const data = await response.json();
        this.logger.error(`MSG91 verification result: ${JSON.stringify(data)}`, undefined, 'AuthService');
        
        if (data.type !== 'success') {
          throw new UnauthorizedException(data.message || 'Invalid MSG91 access token');
        }
      } catch (error) {
        this.logger.error('Error verifying MSG91 access token', error instanceof Error ? error.stack : undefined, 'AuthService');
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('Token verification failed');
      }
    }

    // Normalized phone number (trim '91' if present from widget)
    const cleanPhone = phoneNumber.startsWith('91') && phoneNumber.length > 10
      ? phoneNumber.substring(2)
      : phoneNumber;

    const existingUser = await this.usersService.findOneByPhoneNumber(cleanPhone);

    let user: User;
    let isNewUser: boolean = false;

    if (existingUser) {
      user = existingUser;
      // Auto-add RIDER role if missing
      if (!user.roles.includes(UserRole.RIDER)) {
        user.roles.push(UserRole.RIDER);
        await this.usersService.updateRoles(user.id, user.roles);
      }
    } else {
      const roles = [UserRole.RIDER];
      if (role?.toUpperCase() === 'DRIVER') {
        roles.push(UserRole.DRIVER);
      }
      user = await this.usersService.create({
        phone_number: cleanPhone,
        name: '',
        roles: roles,
      });
      isNewUser = true;
    }

    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phone_number,
      roles: user.roles,
      name: user.name,
    };

    const jwtToken = this.jwtService.sign(payload);
    return { accessToken: jwtToken, isNewUser, user };
  }
}
