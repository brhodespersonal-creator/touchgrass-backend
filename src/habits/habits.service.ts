/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Habit } from './habit.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { ActivityService } from '../activity/activity.service';
import { QuestsService } from '../quests/quests.service';

@Injectable()
export class HabitsService {
    constructor(
        @InjectRepository(Habit)
        private habitsRepository: Repository<Habit>,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        private achievementsService: AchievementsService,
        private activityService: ActivityService,
        private questsService: QuestsService,
    ) { }

    async createHabit(userId: string, name: string, difficulty: number) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const habit = this.habitsRepository.create({ name, difficulty, user, completed: false });
        const savedHabit = await this.habitsRepository.save(habit);

        if (savedHabit.user) {
            const { password, ...safeUser } = savedHabit.user;
            savedHabit.user = safeUser as any;
        }

        return savedHabit;
    }

    async getUserHabits(userId: string) {
        const habits = await this.habitsRepository.find({
            where: { user: { id: userId } },
            relations: ['user'],
        });

        const today = new Date().toDateString();

        for (const habit of habits) {
            if (habit.lastCompletedAt && new Date(habit.lastCompletedAt).toDateString() !== today) {
                habit.completed = false;
                await this.habitsRepository.save(habit);
            }
        }

        // Check if streak should be reset due to inactivity
        if (habits.length > 0) {
            const user = habits[0].user;
            await this.checkAndResetStreak(user);
        } else {
            // No habits yet — still need to check streak for this user
            const user = await this.usersRepository.findOne({ where: { id: userId } });
            if (user) await this.checkAndResetStreak(user);
        }

        if (habits.length === 0) return [];

        const freshUser = await this.usersRepository.findOne({ where: { id: userId } });
        return habits.map(habit => {
            const { password, ...safeUser } = freshUser ?? habit.user;
            return { ...habit, user: safeUser };
        });
    }

    // Resets streak to 0 if the user missed yesterday
    private async checkAndResetStreak(user: User) {
        if (!user.lastStreakDate) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastStreak = new Date(user.lastStreakDate);
        lastStreak.setHours(0, 0, 0, 0);

        if (lastStreak < yesterday) {
            user.streak = 0;
            user.lastStreakDate = null;
            await this.usersRepository.save(user);
        }
    }

    async completeHabit(userId: string, habitId: string) {
        const habit = await this.habitsRepository.findOne({
            where: { id: habitId },
            relations: ['user'],
        });

        if (!habit || !habit.user) throw new Error('Habit or user not found');
        if (habit.user.id !== userId) throw new Error('Unauthorized');

        const today = new Date().toDateString();
        if (habit.lastCompletedAt && new Date(habit.lastCompletedAt).toDateString() === today) {
            return { message: 'Habit already completed today' };
        }

        habit.completed = true;
        habit.lastCompletedAt = new Date();

        // XP calculation
        const baseXP = 5;
        const difficultyBonus = habit.difficulty * 5;
        const streakMultiplier = 1 + Math.min(habit.user.streak, 4) * 0.05;
        const xpEarned = Math.floor((baseXP + difficultyBonus) * streakMultiplier);

        habit.user.xp += xpEarned;

        // Streak: only increment once per calendar day
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const lastStreak = habit.user.lastStreakDate
            ? new Date(habit.user.lastStreakDate)
            : null;
        if (lastStreak) lastStreak.setHours(0, 0, 0, 0);

        const alreadyStreakToday = lastStreak?.getTime() === todayDate.getTime();

        if (!alreadyStreakToday) {
            const yesterday = new Date(todayDate);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastStreak && lastStreak.getTime() === yesterday.getTime()) {
                // Continuing the streak
                habit.user.streak += 1;
            } else {
                // Missed a day or first ever — start fresh
                habit.user.streak = 1;
            }
            habit.user.lastStreakDate = todayDate;
        }

        // Level up
        const leveledUp = habit.user.xp >= habit.user.level * 100;
        if (leveledUp) habit.user.level += 1;

        await this.usersRepository.save(habit.user);
        await this.achievementsService.checkAchievements(habit.user);
        await this.habitsRepository.save(habit);

        // Log activity
        await this.activityService.log(
            userId,
            `completed the habit "${habit.name}"! (+${xpEarned} XP)`,
            'habit',
        );

        if (leveledUp) {
            await this.activityService.log(
                userId,
                `reached Level ${habit.user.level}! 🎉`,
                'level_up',
            );
        }

        // Advance quests
        await this.questsService.updateQuestProgress(userId, 'complete_habits', 1);
        await this.questsService.updateQuestProgress(userId, 'streak', 0, habit.user.streak);

        return {
            message: 'Habit completed',
            xpEarned,
            newXP: habit.user.xp,
            streak: habit.user.streak,
            level: habit.user.level,
        };
    }

    async getLeaderboard() {
        const users = await this.usersRepository.find({
            select: ['id', 'username', 'xp'],
            order: { xp: 'DESC' },
        });
        return users.map(user => ({ id: user.id, username: user.username, xp: user.xp }));
    }

    async updateDaily(userId: string, water?: number, protein?: number) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const today = new Date().toDateString();
        if (!user.lastDailyReset || new Date(user.lastDailyReset).toDateString() !== today) {
            user.waterIntake = 0;
            user.proteinIntake = 0;
            user.lastDailyReset = new Date();
        }

        if (water !== undefined) user.waterIntake = Math.max(0, user.waterIntake + water);
        if (protein !== undefined) user.proteinIntake = Math.max(0, user.proteinIntake + protein);

        await this.usersRepository.save(user);
        return { water: user.waterIntake, protein: user.proteinIntake };
    }
}
