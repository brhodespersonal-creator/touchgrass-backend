/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('habits')
export class HabitsController {
    constructor(private habitsService: HabitsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    createHabit(
        @Req() req,
        @Body() body: { name: string; difficulty: number },
    ) {
        return this.habitsService.createHabit(
            req.user.userId,
            body.name,
            body.difficulty,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    getHabits(@Req() req) {
        return this.habitsService.getUserHabits(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('complete')
    completeHabit(
        @Req() req,
        @Body() body: { habitId: string },
    ) {
        return this.habitsService.completeHabit(
            req.user.userId,
            body.habitId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('leaderboard')
    getLeaderboard() {
        return this.habitsService.getLeaderboard();
    }

    @UseGuards(JwtAuthGuard)
    @Post('update-daily')
    updateDaily(
        @Req() req,
        @Body() body: { water?: number; protein?: number },
    ) {
        return this.habitsService.updateDaily(
            req.user.userId,
            body.water,
            body.protein,
        );
    }
}