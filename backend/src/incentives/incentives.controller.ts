import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IncentivesService } from './incentives.service';

@UseGuards(JwtAuthGuard)
@Controller('incentives')
export class IncentivesController {
    constructor(private readonly incentivesService: IncentivesService) { }

    @Get('mine')
    async getMyIncentives(@Request() req: any) {
        return this.incentivesService.getMyIncentives(req.user.id);
    }

    @Get('active')
    async getActiveIncentives(@Request() req: any) {
        return this.incentivesService.getActiveIncentives(req.user.id);
    }
}
