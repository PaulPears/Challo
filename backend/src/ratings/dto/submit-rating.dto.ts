import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, IsArray, Min, Max } from 'class-validator';
import { RatingRole } from '../rating.entity';

export class SubmitRatingDto {
    @IsUUID()
    ride_id: string;

    @IsOptional()
    @IsUUID()
    rated_user_id?: string;

    @IsOptional()
    @IsEnum(RatingRole)
    rated_user_role?: RatingRole;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    stars?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
