/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { UserAchievement } from '../achievements/user-achievement.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ type: 'float', default: 0 })
  waterIntake: number;

  @Column({ default: 0 })
  proteinIntake: number;

  @Column({ type: 'date', nullable: true })
  lastDailyReset: Date;

  // Tracks the last calendar day a streak increment was applied
  @Column({ type: 'date', nullable: true })
  lastStreakDate: Date | null;

  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Habit[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  achievements: UserAchievement[];
}
