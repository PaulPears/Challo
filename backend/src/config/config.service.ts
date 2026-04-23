import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../common/entities/system-setting.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly configRepository: Repository<SystemSetting>,
  ) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.configRepository.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async getAppConfig() {
    const settings = await this.configRepository.find();
    const config: Record<string, any> = {};
    
    settings.forEach(s => {
      try {
        config[s.key] = s.type === 'json' ? JSON.parse(s.value) : s.value;
      } catch (e) {
        config[s.key] = s.value;
      }
    });

    return config;
  }
}
