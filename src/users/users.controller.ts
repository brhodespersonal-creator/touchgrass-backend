/* eslint-disable prettier/prettier */
import { Controller, Post, Body, Get, UseGuards, Req, Param, Patch, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }

  // Full stats for the logged-in user (used by dashboard)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    const { password, ...safe } = user;
    return safe;
  }

  @Get('friend-requests')
  @UseGuards(JwtAuthGuard)
  getFriendRequests(@Req() req) {
    return this.usersService.getFriendRequests(req.user.userId);
  }

  @Get('friends')
  @UseGuards(JwtAuthGuard)
  getFriends(@Req() req) {
    return this.usersService.getFriends(req.user.userId);
  }

  @Post('friend-request')
  @UseGuards(JwtAuthGuard)
  sendFriendRequest(@Req() req, @Body() body: { receiverId: string }) {
    return this.usersService.sendFriendRequest(req.user.userId, body.receiverId);
  }

  @Post('friend-request/by-username')
  @UseGuards(JwtAuthGuard)
  sendFriendRequestByUsername(@Req() req, @Body() body: { username: string }) {
    return this.usersService.sendFriendRequestByUsername(req.user.userId, body.username);
  }

  @Patch('friend-request/:id/accept')
  @UseGuards(JwtAuthGuard)
  acceptFriendRequest(@Req() req, @Param('id') id: string) {
    return this.usersService.acceptFriendRequest(req.user.userId, id);
  }

  @Patch('friend-request/:id/reject')
  @UseGuards(JwtAuthGuard)
  rejectFriendRequest(@Req() req, @Param('id') id: string) {
    return this.usersService.rejectFriendRequest(req.user.userId, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
