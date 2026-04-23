import { Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('app')
  async getAppConfig() {
    return this.configService.getAppConfig();
  }
}
