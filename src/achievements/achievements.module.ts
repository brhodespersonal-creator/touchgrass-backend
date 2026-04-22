/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Habit } from '../habits/habit.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Achievement, UserAchievement, Habit])],
    providers: [AchievementsService],
    controllers: [AchievementsController],
    exports: [AchievementsService],
})
export class AchievementsModule { }
