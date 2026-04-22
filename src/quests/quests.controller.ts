/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quests')
export class QuestsController {
  constructor(private questsService: QuestsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserQuests(@Req() req) {
    return this.questsService.getUserQuests(req.user.userId);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  claimQuest(@Req() req, @Param('id') id: string) {
    return this.questsService.claimQuest(req.user.userId, id);
  }
}
