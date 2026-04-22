/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { FriendRequest } from './friend-request.entity';

// QuestsService injected lazily to avoid circular deps
import { Inject, forwardRef } from '@nestjs/common';
import { QuestsService } from '../quests/quests.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(FriendRequest)
        private friendRequestRepository: Repository<FriendRequest>,
        @Inject(forwardRef(() => QuestsService))
        private questsService: QuestsService,
        @Inject(forwardRef(() => ActivityService))
        private activityService: ActivityService,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        if (!userData.username) throw new Error('Username is required but missing');
        const user = this.usersRepository.create({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            xp: userData.xp ?? 0,
            level: userData.level ?? 1,
            streak: userData.streak ?? 0,
            waterIntake: userData.waterIntake ?? 0,
            proteinIntake: userData.proteinIntake ?? 0,
        });
        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { username } });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async getPublicProfile(userId: string) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'username', 'xp', 'level', 'streak'],
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
        if (senderId === receiverId) throw new BadRequestException('Cannot send friend request to yourself');

        const receiver = await this.usersRepository.findOne({ where: { id: receiverId } });
        if (!receiver) throw new NotFoundException('User not found');

        const existing = await this.friendRequestRepository.findOne({
            where: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        });
        if (existing) throw new BadRequestException('Friend request already exists');

        const request = this.friendRequestRepository.create({ senderId, receiverId, status: 'pending' });
        return this.friendRequestRepository.save(request);
    }

    async sendFriendRequestByUsername(senderId: string, username: string): Promise<FriendRequest> {
        const receiver = await this.usersRepository.findOne({ where: { username } });
        if (!receiver) throw new NotFoundException(`User "${username}" not found`);
        return this.sendFriendRequest(senderId, receiver.id);
    }

    async getFriendRequests(userId: string) {
        const requests = await this.friendRequestRepository.find({
            where: { receiverId: userId, status: 'pending' },
            relations: ['sender'],
        });
        return requests.map(r => ({
            id: r.id,
            senderId: r.senderId,
            senderUsername: r.sender?.username,
            createdAt: r.createdAt,
        }));
    }

    async acceptFriendRequest(userId: string, requestId: string) {
        const request = await this.friendRequestRepository.findOne({
            where: { id: requestId },
            relations: ['sender', 'receiver'],
        });
        if (!request) throw new NotFoundException('Friend request not found');
        if (request.receiverId !== userId) throw new ForbiddenException('Not your request');
        if (request.status !== 'pending') throw new BadRequestException('Request already handled');

        request.status = 'accepted';
        await this.friendRequestRepository.save(request);

        // Count accepted friends for both users and update quests
        const countFriends = async (uid: string) => {
            const count = await this.friendRequestRepository.count({
                where: [
                    { senderId: uid, status: 'accepted' },
                    { receiverId: uid, status: 'accepted' },
                ],
            });
            await this.questsService.updateQuestProgress(uid, 'add_friends', 0, count);
        };

        await countFriends(userId);
        await countFriends(request.senderId);

        // Log activity for the receiver
        await this.activityService.log(
            userId,
            `is now friends with ${request.sender?.username}! 🤝`,
            'social',
        );

        return request;
    }

    async rejectFriendRequest(userId: string, requestId: string) {
        const request = await this.friendRequestRepository.findOne({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Friend request not found');
        if (request.receiverId !== userId) throw new ForbiddenException('Not your request');
        if (request.status !== 'pending') throw new BadRequestException('Request already handled');

        request.status = 'rejected';
        return this.friendRequestRepository.save(request);
    }

    async getFriends(userId: string) {
        const accepted = await this.friendRequestRepository.find({
            where: [
                { senderId: userId, status: 'accepted' },
                { receiverId: userId, status: 'accepted' },
            ],
            relations: ['sender', 'receiver'],
        });
        return accepted.map(r => {
            const friend = r.senderId === userId ? r.receiver : r.sender;
            return { id: friend?.id, username: friend?.username, xp: friend?.xp, level: friend?.level, streak: friend?.streak };
        });
    }
}
