/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from './activity.entity';
import { FriendRequest } from '../users/friend-request.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,

    @InjectRepository(FriendRequest)
    private friendRequestRepo: Repository<FriendRequest>,
  ) {}

  async log(userId: string, message: string, type = 'general') {
    const activity = this.activityRepo.create({ userId, message, type });
    return this.activityRepo.save(activity);
  }

  async getFeed(userId: string) {
    // Get accepted friends
    const friendships = await this.friendRequestRepo.find({
      where: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map(f =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    const feedUserIds = [userId, ...friendIds];

    const activities = await this.activityRepo.find({
      where: { userId: In(feedUserIds) },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return activities.map(a => ({
      id: a.id,
      username: a.user?.username ?? 'Unknown',
      isYou: a.userId === userId,
      message: a.message,
      type: a.type,
      createdAt: a.createdAt,
    }));
  }
}
