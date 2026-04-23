import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '../ride.entity';

export class CreateRideDto {
  @IsNumber()
  @IsNotEmpty()
  pickup_latitude: number;

  @IsNumber()
  @IsNotEmpty()
  pickup_longitude: number;

  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @IsNumber()
  @IsNotEmpty()
  dropoff_latitude: number;

  @IsNumber()
  @IsNotEmpty()
  dropoff_longitude: number;

  @IsString()
  @IsNotEmpty()
  dropoff_address: string;

  @IsNumber()
  @IsNotEmpty()
  fare: number;

  @IsNumber()
  @IsNotEmpty()
  distance: number;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsNotEmpty()
  vehicle_type: string;

  @IsOptional()
  @IsNumber()
  apply_super_coins?: number;

  @IsOptional()
  apply_super_km?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;
}
