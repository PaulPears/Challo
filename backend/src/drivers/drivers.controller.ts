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
    { name: 'rcPhoto', maxCount: 1 },
    { name: 'rcBackPhoto', maxCount: 1 },
    { name: 'insurancePhoto', maxCount: 1 },
  ], {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      fieldSize: 10 * 1024 * 1024, // 10MB for text fields
    }
  }))
  async registerDriver(
    @Request() req,
    @Body() body: any,
    @UploadedFiles() files: any,
  ) {
    return this.driversService.registerDriver(req.user.id, body, files || {});
  }
}
