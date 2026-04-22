/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';

@Injectable()
export class AchievementsService implements OnModuleInit {
    constructor(
        @InjectRepository(Achievement)
        private achievementRepo: Repository<Achievement>,

        @InjectRepository(UserAchievement)
        private userAchievementRepo: Repository<UserAchievement>,

        @InjectRepository(Habit)
        private habitRepo: Repository<Habit>,
    ) { }

    // RUNS ON SERVER START
    async onModuleInit() {
        await this.seedAchievements();
    }

    // CORE LOGIC
    async checkAchievements(user: User) {
        const all = await this.achievementRepo.find();

        const unlocked = await this.userAchievementRepo.find({
            where: { user: { id: user.id } },
            relations: ['achievement'],
        });

        const unlockedIds = unlocked.map((ua) => ua.achievement.id);

        // Get total completed habits
        const completedHabits = await this.habitRepo.count({
            where: {
                user: { id: user.id },
                completed: true,
            },
        });

        for (const achievement of all) {
            if (unlockedIds.includes(achievement.id)) continue;

            let unlock = false;

            switch (achievement.type) {
                case 'xp':
                    if (user.xp >= achievement.requirement) {
                        unlock = true;
                    }
                    break;

                case 'streak':
                    if (user.streak >= achievement.requirement) {
                        unlock = true;
                    }
                    break;

                case 'habits_completed':
                    if (completedHabits >= achievement.requirement) {
                        unlock = true;
                    }
                    break;
            }

            if (unlock) {
                await this.userAchievementRepo.save({
                    user,
                    achievement,
                });
            }
        }
    }

    // GET USER ACHIEVEMENTS
    async getUserAchievements(userId: string) {
        return this.userAchievementRepo.find({
            where: { user: { id: userId } },
            relations: ['achievement'],
        });
    }

    // DEFAULT ACHIEVEMENTS
    async seedAchievements() {
        const existing = await this.achievementRepo.count();

        if (existing > 0) return;

        const achievements = [
            {
                name: 'First Habit',
                description: 'Complete your first habit',
                type: 'habits_completed',
                requirement: 1,
                icon: '🎯',
            },
            {
                name: 'Getting Started',
                description: 'Reach 50 XP',
                type: 'xp',
                requirement: 50,
                icon: '🔥',
            },
            {
                name: 'Grinder',
                description: 'Reach 200 XP',
                type: 'xp',
                requirement: 200,
                icon: '💪',
            },
            {
                name: 'Unstoppable',
                description: 'Reach a 5-day streak',
                type: 'streak',
                requirement: 5,
                icon: '⚡',
            },
        ];

        await this.achievementRepo.save(achievements);
    }
}