import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('achievements')
export class AchievementsController {
    constructor(private achievementsService: AchievementsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    getMyAchievements(@Req() req) {
        return this.achievementsService.getUserAchievements(req.user.userId);
    }
}