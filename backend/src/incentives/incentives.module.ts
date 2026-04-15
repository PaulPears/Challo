import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incentive } from './incentive.entity';
import { IncentivesService } from './incentives.service';
import { IncentivesController } from './incentives.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Incentive])],
    controllers: [IncentivesController],
    providers: [IncentivesService],
    exports: [IncentivesService],
})
export class IncentivesModule { }
