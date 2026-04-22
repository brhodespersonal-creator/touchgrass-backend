/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

    async register(email: string, password: string, username: string) {
        if (!username) {
            throw new Error('Username is required');
        }

        const existingEmail = await this.usersService.findByEmail(email);
        const existingUsername = await this.usersService.findByUsername(username);

        if (existingEmail || existingUsername) {
            throw new Error('Email or username already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return this.usersService.create({
            email,
            password: hashedPassword,
            username,
            xp: 0,
            level: 1,
            streak: 0,
            waterIntake: 0,
            proteinIntake: 0,
        });
    }


  // LOGIN
    async login(email: string, password: string) {
        // Step 1: Find user
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Step 2: Debug checks
        if (!password) {
            throw new UnauthorizedException('Password not provided');
        }

        if (!user.password) {
            throw new UnauthorizedException('User password not found');
        }

        // Step 3: Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Step 4: Generate token
        const payload = { userId: user.id, username: user.username };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                xp: user.xp,
                level: user.level,
            },
        };
    }
}