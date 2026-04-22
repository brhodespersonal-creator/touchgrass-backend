/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './habit.entity';
import { User } from '../users/user.entity';
import { AchievementsModule } from '../achievements/achievements.module';
import { ActivityModule } from '../activity/activity.module';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habit, User]),
    AchievementsModule,
    ActivityModule,
    QuestsModule,
  ],
  providers: [HabitsService],
  controllers: [HabitsController],
})
export class HabitsModule {}
