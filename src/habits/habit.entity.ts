import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({type: 'int'})
  difficulty: number; // 1 = easy, 2 = medium, 3 = hard

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastCompletedAt: Date;

  @ManyToOne(() => User, (user) => user.habits)
  user: User;
}