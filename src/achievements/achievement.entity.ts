import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Achievement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    type: string; // 'xp' | 'streak' | 'habits_completed'

    @Column()
    requirement: number;

    @Column({ default: '' })
    icon: string;
}