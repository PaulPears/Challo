import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('make-admin')
  async makeAdmin(@Body('phoneNumber') phoneNumber: string) {
    return this.adminService.makeAdmin(phoneNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('drivers/pending')
  async getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('drivers/search')
  async searchDrivers(
    @Query('q') query: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.searchDrivers(
      query, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('riders/search')
  async searchRiders(
    @Query('q') query: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.searchRiders(
      query, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('drivers/:userId/suspend')
  async suspendDriver(@Param('userId') userId: string) {
    return this.adminService.suspendDriver(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('drivers/:userId/activate')
  async activateDriver(@Param('userId') userId: string) {
    return this.adminService.activateDriver(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('drivers/:userId/reviews')
  async getDriverReviews(@Param('userId') userId: string) {
    return this.adminService.getDriverReviews(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('drivers/:userId/approve')
  async approveDriver(@Param('userId') userId: string, @Request() req) {
    return this.adminService.approveDriver(userId, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('drivers/:userId/reject')
  async rejectDriver(@Param('userId') userId: string) {
    return this.adminService.rejectDriver(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('finance/reports')
  async getFinancialReports(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    return this.adminService.getFinancialReports(parsedPage, parsedLimit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('drivers/:userId/grant-access')
  async grantManualAccess(
    @Param('userId') userId: string,
    @Body('days') days: number
  ) {
    return this.adminService.grantManualSubscription(userId, days || 30);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('drivers/special-access')
  async getSpecialAccessDrivers() {
    return this.adminService.getSpecialAccessDrivers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('drivers/grace-period')
  async getGracePeriodDrivers() {
    return this.adminService.getGracePeriodDrivers();
  }
}

