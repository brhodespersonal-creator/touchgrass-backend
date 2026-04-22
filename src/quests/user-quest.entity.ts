/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Quest } from './quest.entity';
import { User } from '../users/user.entity';

@Entity()
export class UserQuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  questId: string;

  @ManyToOne(() => Quest, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questId' })
  quest: Quest;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  claimed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
