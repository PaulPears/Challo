import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from './driver-profile.entity';
import { User } from '../users/user.entity';
import { StorageService } from '../common/storage/storage.service';
import * as path from 'path';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverProfile)
    private driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private storageService: StorageService,
  ) {}

  async registerDriver(
    userId: string,
    body: {
      phoneNumber: string;
      name: string;
      licenseNumber: string;
      vehicleModel: string;
      vehiclePlateNumber: string;
      vehicleColor: string;
    },
    files: any,

  ) {
    // Check if driver profile already exists
    const existing = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (existing) {
      throw new BadRequestException('Driver profile already exists. Please wait for approval.');
    }

    // Save uploaded files to Bunny.net
    const saveFile = async (file: any, name: string): Promise<string | null> => {
      if (!file) return null;
      const fileName = `${name}${path.extname(file.originalname) || '.jpg'}`;
      return await this.storageService.upload(fileName, file.buffer, `drivers/${userId}`);
    };

    const [profileImagePath, licenseFrontPath, licenseBackPath, aadhaarPath, panPath] = await Promise.all([
      saveFile(files.profilePhoto?.[0], 'profile'),
      saveFile(files.licenseFrontPhoto?.[0], 'license_front'),
      saveFile(files.licenseBackPhoto?.[0], 'license_back'),
      saveFile(files.aadhaarPhoto?.[0], 'aadhaar'),
      saveFile(files.panPhoto?.[0], 'pan'),
    ]);

    // Update user name and profile image
    if (body.name || profileImagePath) {
      await this.usersRepository.update(userId, {
        ...(body.name ? { name: body.name } : {}),
        ...(profileImagePath ? { profile_image: profileImagePath } : {}),
      });
    }

    // Create DriverProfile record
    const driverProfile = this.driverProfileRepository.create({
      user_id: userId,
      license_number: body.licenseNumber,
      license_image: licenseFrontPath,
      license_back_image: licenseBackPath,
      aadhar_image: aadhaarPath,
      pan_image: panPath,
      vehicle_model: body.vehicleModel,
      vehicle_plate_number: body.vehiclePlateNumber,
      vehicle_color: body.vehicleColor,
      vehicle_type: 'auto' as any,
    } as any);

    await this.driverProfileRepository.save(driverProfile);

    return { message: 'Registration submitted successfully. Pending approval.' };
  }
}
