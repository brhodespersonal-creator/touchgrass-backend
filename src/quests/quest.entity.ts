/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Quest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  xpReward: number;

  @Column()
  type: string; // 'complete_habits' | 'streak' | 'add_friends'

  @Column()
  target: number; // numeric goal to hit
}
