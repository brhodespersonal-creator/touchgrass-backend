/* eslint-disable prettier/prettier */
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(@Req() req) {
    return this.activityService.getFeed(req.user.userId);
  }
}
