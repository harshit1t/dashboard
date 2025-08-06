// src/user/user.controller.ts
import { Controller, Get, Post, Body,Req } from '@nestjs/common';
import { UserService } from './user.service';
import e from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Post()
  create(@Body() body: { name: string; email: string; role: any, teamId:number }) {
    return this.userService.createUser(body.name, body.email, body.role, body.teamId);
  }

  @Post('team')
  createTeam(@Body() body: { name: string; ownerId: number }) {
    return this.userService.createTeam(body.name, body.ownerId);
  }

  @Post('addTeamMember')
  async addTeamMember(@Body() body: {  email: string; role: any  }, @Req() req: Request) {
    const user = (req as any).clerkUser;
    if(!user){
      throw new Error('Unauthorized: User not found in request');
    }
    const existingUser = await this.userService.getUserByEmail(user.email);
    if(!existingUser){
      throw new Error('User does not exist');
    }
    // add check for owner or admin role
    const getTeamId = await this.userService.getTeamIdByUserId(existingUser.id as number);
    return this.userService.addTeamMember( body.email, body.role, getTeamId.id as number);
  }
}
