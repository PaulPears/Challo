jest.mock('expo-server-sdk');
jest.mock('../notifications/notifications.service');
import { Test, TestingModule } from '@nestjs/testing';
import { PricingService, FareBreakdown } from './pricing.service';
import { RidesService } from './rides.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FareSetting } from './fare-setting.entity';
import { SurgeEvent } from './surge-event.entity';
import { Ride, RideStatus, VehicleType } from './ride.entity';
import { RiderProfile } from '../users/rider-profile.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { MatchingService } from '../matching.service';
import { IncentivesService } from '../incentives/incentives.service';
import { RidePolicyService } from './ride-policy.service';
import { DataSource } from 'typeorm';
import { RideRejection } from './ride-rejection.entity';

describe('Super Kilometer System Logic', () => {
  let pricingService: PricingService;
  let ridesService: RidesService;

  const mockFareSetting = {
    vehicle_type: VehicleType.AUTO,
    base_fare: 50,
    per_km_rate: 15,
    per_minute_rate: 2,
    minimum_fare: 50,
    max_surge_cap: 2.0,
    is_active: true,
    tiers: []
  };

  const mockFareSettingsRepository = {
    findOne: jest.fn().mockResolvedValue(mockFareSetting),
  };

  const mockSurgeEventRepository = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  const mockRidesRepository = {
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(ride => Promise.resolve({ id: 'ride-123', ...ride })),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    deductSuperKm: jest.fn().mockResolvedValue(true),
    awardSuperCoins: jest.fn().mockResolvedValue(true),
    getFavoriteDrivers: jest.fn().mockResolvedValue([]),
    getProfile: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === RiderProfile) return { findOne: jest.fn().mockResolvedValue({ super_km_balance: 10 }) };
        if (entity === Ride) return mockRidesRepository;
        if (entity === DriverProfile) return { findOne: jest.fn().mockResolvedValue({ user_id: 'driver-123', total_rides: 10 }) };
        return {};
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(cb => cb(mockManager)),
    getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === DriverProfile) return { findOne: jest.fn().mockResolvedValue({ user_id: 'driver-123' }) };
        return {};
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        RidesService,
        { provide: getRepositoryToken(FareSetting), useValue: mockFareSettingsRepository },
        { provide: getRepositoryToken(SurgeEvent), useValue: mockSurgeEventRepository },
        { provide: getRepositoryToken(Ride), useValue: mockRidesRepository },
        { provide: getRepositoryToken(RideRejection), useValue: {} },
        { provide: getRepositoryToken(DriverProfile), useValue: { findOne: jest.fn() } },
        { provide: NotificationsService, useValue: { sendNewRideToDriver: jest.fn(), sendRideUpdate: jest.fn() } },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PaymentsService, useValue: { applyServiceCharge: jest.fn() } },
        { provide: MatchingService, useValue: { getNearbyDriverUserIds: jest.fn().mockResolvedValue([]) } },
        { provide: IncentivesService, useValue: { onRideCompleted: jest.fn() } },
        { provide: RidePolicyService, useValue: { validate: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    pricingService = module.get<PricingService>(PricingService);
    ridesService = module.get<RidesService>(RidesService);
  });

  describe('Pricing Calculations (FareBreakdown)', () => {
    it('should cover full distance when Super KM balance is sufficient', async () => {
      // 5 KM Ride, 10 KM Balance
      const distance = 5000; // 5km
      const duration = 600; // 10 mins
      const skBalance = 10;

      const estimate = await pricingService.getFareEstimate(distance, duration, VehicleType.AUTO, 0, 0, skBalance);

      // Dist cost = 5km * 15 = 75
      // Base = 50
      // Time = 10 * 2 = 20
      // Total (before surge/gst) = 50 + 75 + 20 = 145
      // GST (5%) = 145 * 0.05 = 7.25
      // TotalWithGst = 152.25

      // Super KM discount = appliedKm * basePerKmRate = 5 * 15 = 75
      
      expect(estimate.superKmApplied).toBe(5);
      expect(estimate.superKmDiscount).toBe(75);
      expect(estimate.riderPayable).toBe(parseFloat((152.25 - 75).toFixed(2)));
      expect(estimate.companyPayable).toBe(75);
    });

    it('should cover partial distance when Super KM balance is insufficient', async () => {
      // 5 KM Ride, 2 KM Balance
      const distance = 5000; // 5km
      const duration = 600; // 10 mins
      const skBalance = 2;

      const estimate = await pricingService.getFareEstimate(distance, duration, VehicleType.AUTO, 0, 0, skBalance);

      // Super KM discount = 2 * 15 = 30
      expect(estimate.superKmApplied).toBe(2);
      expect(estimate.superKmDiscount).toBe(30);
      expect(estimate.riderPayable).toBe(parseFloat((152.25 - 30).toFixed(2)));
    });
  });

  describe('Ride Completion (Financial Breakdown)', () => {
    it('should calculate driver earnings based on full fare (Rider + Company)', async () => {
      const mockRide = {
        id: 'ride-123',
        rider_id: 'rider-456',
        driver_id: 'driver-789',
        estimated_fare: 77.25, // Taf (Rider portion)
        rider_payable: 77.25,
        company_payable: 75,
        status: RideStatus.ACCEPTED,
        final_fare: 77.25
      };

      mockRidesRepository.findOne.mockResolvedValue(mockRide);

      const completedRide = await ridesService.completeRide('ride-123', 'driver-789');

      // Full Value = 77.25 + 75 = 152.25
      // GST (5%) = 152.25 * 0.05 = 7.61
      // Driver Earnings = 152.25 - 7.61 = 144.64

      expect(completedRide?.gst_amount).toBeCloseTo(7.61, 2);
      expect(completedRide?.driver_earnings).toBeCloseTo(144.64, 2);
    });
  });
});
