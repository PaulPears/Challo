import { Controller, Post, UseGuards, UseInterceptors, UploadedFiles, Body, Request } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriversService } from './drivers.service';

@Controller()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile/register-driver')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'licenseFrontPhoto', maxCount: 1 },
    { name: 'licenseBackPhoto', maxCount: 1 },
    { name: 'aadhaarPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
  ]))
  async registerDriver(
    @Request() req,
    @Body() body: any,
    @UploadedFiles() files: any,
  ) {
    return this.driversService.registerDriver(req.user.id, body, files || {});
  }
}
