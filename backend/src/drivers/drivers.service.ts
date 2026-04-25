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
      vehicleType: string;
    },
    files: any,

  ) {
    // Check if driver profile already exists
    console.log(`[Drivers] Starting registration for user ${userId}`);
    const existing = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (existing) {
      console.warn(`[Drivers] Registration rejected: Profile already exists for ${userId}`);
      throw new BadRequestException('Driver profile already exists. Please wait for approval.');
    }

    // Save uploaded files to Bunny.net
    const saveFile = async (file: any, name: string): Promise<string | null> => {
      if (!file) return null;
      console.log(`[Drivers] Uploading ${name} to Bunny.net...`);
      const fileName = `${name}${path.extname(file.originalname) || '.jpg'}`;
      const pathUrl = await this.storageService.upload(fileName, file.buffer, `drivers/${userId}`);
      console.log(`[Drivers] ${name} uploaded: ${pathUrl}`);
      return pathUrl;
    };

    // Save uploaded files to Bunny.net sequentially to reduce memory spikes and ensure reliable logging
    const profileImagePath = await saveFile(files.profilePhoto?.[0], 'profile');
    const licenseFrontPath = await saveFile(files.licenseFrontPhoto?.[0], 'license_front');
    const licenseBackPath = await saveFile(files.licenseBackPhoto?.[0], 'license_back');
    const aadhaarPath = await saveFile(files.aadhaarPhoto?.[0], 'aadhaar');
    const panPath = await saveFile(files.panPhoto?.[0], 'pan');
    const rcFrontPath = await saveFile(files.rcPhoto?.[0], 'rc_front');
    const rcBackPath = await saveFile(files.rcBackPhoto?.[0], 'rc_back');
    const insurancePath = await saveFile(files.insurancePhoto?.[0], 'insurance_document');

    console.log(`[Drivers] All files processed for user ${userId}`);

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
      rc_document: rcFrontPath,
      rc_back_document: rcBackPath,
      insurance_document: insurancePath,
      vehicle_model: body.vehicleModel,
      vehicle_plate_number: body.vehiclePlateNumber,
      vehicle_color: body.vehicleColor,
      vehicle_type: (body.vehicleType || 'bike').toLowerCase().replace('car', 'cab') as any,
    } as any);

    await this.driverProfileRepository.save(driverProfile);
    console.log(`[Drivers] Registration saved successfully for user ${userId}`);

    return { message: 'Registration submitted successfully. Pending approval.' };
  }
}
