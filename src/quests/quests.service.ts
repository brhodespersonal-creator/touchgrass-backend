/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest } from './quest.entity';
import { UserQuest } from './user-quest.entity';
import { User } from '../users/user.entity';

@Injectable()
export class QuestsService implements OnModuleInit {
  constructor(
    @InjectRepository(Quest)
    private questRepo: Repository<Quest>,

    @InjectRepository(UserQuest)
    private userQuestRepo: Repository<UserQuest>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedQuests();
  }

  async seedQuests() {
    const existing = await this.questRepo.count();
    if (existing > 0) return;

    await this.questRepo.save([
      { name: 'First Steps',      description: 'Complete your first habit',        xpReward: 25,  type: 'complete_habits', target: 1   },
      { name: 'Habit Builder',    description: 'Complete 10 habits',               xpReward: 100, type: 'complete_habits', target: 10  },
      { name: 'Habit Master',     description: 'Complete 50 habits',               xpReward: 500, type: 'complete_habits', target: 50  },
      { name: 'On Fire',          description: 'Reach a 3-day streak',             xpReward: 75,  type: 'streak',          target: 3   },
      { name: 'Week Warrior',     description: 'Reach a 7-day streak',             xpReward: 200, type: 'streak',          target: 7   },
      { name: 'Unstoppable',      description: 'Reach a 30-day streak',            xpReward: 1000,type: 'streak',          target: 30  },
      { name: 'Social Butterfly', description: 'Add your first friend',            xpReward: 50,  type: 'add_friends',     target: 1   },
      { name: 'Squad Goals',      description: 'Have 3 friends',                   xpReward: 150, type: 'add_friends',     target: 3   },
    ]);
  }

  // Ensure UserQuest rows exist for all quests for this user, then return them
  async getUserQuests(userId: string) {
    const allQuests = await this.questRepo.find();
    const existing = await this.userQuestRepo.find({ where: { userId } });
    const existingQuestIds = existing.map(uq => uq.questId);

    const toCreate = allQuests
      .filter(q => !existingQuestIds.includes(q.id))
      .map(q => this.userQuestRepo.create({ userId, questId: q.id, progress: 0, completed: false, claimed: false }));

    if (toCreate.length > 0) await this.userQuestRepo.save(toCreate);

    return this.userQuestRepo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async updateQuestProgress(userId: string, type: string, amount: number, absoluteValue?: number) {
    const userQuests = await this.userQuestRepo.find({
      where: { userId, completed: false },
      relations: ['quest'],
    });

    const relevant = userQuests.filter(uq => uq.quest.type === type);

    for (const uq of relevant) {
      if (absoluteValue !== undefined) {
        uq.progress = Math.max(uq.progress, absoluteValue);
      } else {
        uq.progress += amount;
      }

      if (uq.progress >= uq.quest.target) {
        uq.progress = uq.quest.target;
        uq.completed = true;
      }

      await this.userQuestRepo.save(uq);
    }
  }

  async claimQuest(userId: string, userQuestId: string) {
    const uq = await this.userQuestRepo.findOne({
      where: { id: userQuestId, userId },
      relations: ['quest'],
    });

    if (!uq) throw new NotFoundException('Quest not found');
    if (!uq.completed) throw new BadRequestException('Quest not yet completed');
    if (uq.claimed) throw new BadRequestException('Quest already claimed');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.xp += uq.quest.xpReward;
    if (user.xp >= user.level * 100) user.level += 1;

    uq.claimed = true;
    await this.userRepo.save(user);
    await this.userQuestRepo.save(uq);

    return {
      message: `Claimed ${uq.quest.xpReward} XP for "${uq.quest.name}"!`,
      xpReward: uq.quest.xpReward,
      newXP: user.xp,
      level: user.level,
    };
  }
}
