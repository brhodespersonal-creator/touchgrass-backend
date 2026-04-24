/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('habits')
export class HabitsController {
    constructor(private habitsService: HabitsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    createHabit(
        @Req() req,
        @Body() body: { name: string; difficulty: number; schedule: string; scheduleDays: string },
    ) {
        return this.habitsService.createHabit(
            req.user.userId,
            body.name,
            body.difficulty,
            body.schedule,
            body.scheduleDays,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    getHabits(@Req() req) {
        return this.habitsService.getUserHabits(req.user.userId);
    }

    // Returns ALL habits (not filtered by today) with full completion history — used by calendar
    @UseGuards(JwtAuthGuard)
    @Get('all')
    getAllHabits(@Req() req) {
        return this.habitsService.getAllHabits(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('complete')
    completeHabit(
        @Req() req,
        @Body() body: { habitId: string },
    ) {
        return this.habitsService.completeHabit(req.user.userId, body.habitId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deleteHabit(@Req() req, @Param('id') id: string) {
        return this.habitsService.deleteHabit(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('all')
    deleteAllHabits(@Req() req) {
        return this.habitsService.deleteAllHabits(req.user.userId);
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
        return this.habitsService.updateDaily(req.user.userId, body.water, body.protein);
    }
}
