/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  difficulty: number; // 1 = easy, 2 = medium, 3 = hard

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastCompletedAt: Date;

  // 'daily' | 'custom'
  @Column({ default: 'daily' })
  schedule: string;

  // Comma-separated short day names for custom schedule e.g. "Mon,Wed,Fri"
  // Empty string means all days (daily)
  @Column({ default: '' })
  scheduleDays: string;

  // JSON array of ISO date strings (yyyy-mm-dd) for completion history
  @Column({ type: 'text', default: '[]' })
  completionDates: string;

  @ManyToOne(() => User, (user) => user.habits)
  user: User;
}
