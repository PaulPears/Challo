import { Controller, Patch, Param, Body, Get, Post, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rating')
  async getRating(@Request() req) {
    const userId = req.user.id;
    const rating = await this.usersService.getUserRating(userId);
    return { rating };
  }

  @UseGuards(JwtAuthGuard)
  @Post('favorites')
  async addFavorite(@Request() req, @Body('driver_id') driverId: number) {
    return this.usersService.addFavoriteDriver(req.user.id, driverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getFavorites(@Request() req) {
    return this.usersService.getFavoriteDrivers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:driverId')
  async removeFavorite(@Request() req, @Param('driverId') driverId: number) {
    await this.usersService.removeFavoriteDriver(req.user.id, driverId);
    return { success: true };
  }
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('push-token')
  async updatePushToken(@Request() req, @Body('token') token: string) {
    await this.usersService.updatePushToken(req.user.id, token);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Put('driver/status')
  async updateDriverStatus(@Request() req, @Body() statusData: any) {
    await this.usersService.updateDriverStatus(req.user.id, statusData);
    return { success: true };
  }
}
