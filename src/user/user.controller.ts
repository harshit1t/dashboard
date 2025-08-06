// src/user/user.controller.ts
import { Controller, Get, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { User, UserService, Team } from './user.service';
import { Request } from 'express';

export interface CreateUserDto {
  email: string;
  role: number;
  teamId: number;
}

export interface CreateTeamDto {
  name: string;
  ownerId: number;
}

export interface AddTeamMemberDto {
  email: string;
  role: number;
}

// Controller for user-related operations
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll(): Promise<{ success: boolean; message: string; response: User[]}> {
    try {
      const users = await this.userService.getAllUsers();
      return { success: true, message: 'Users fetched successfully', response: users };
    } catch (error) {
      throw new HttpException({ success: false, message: 'Failed to fetch users', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(@Body() body: CreateUserDto) {
    try {
      const user = await this.userService.createUser(body.email, body.role, body.teamId);
      return { success: true, message: 'User created successfully', response: user };
    } catch (error) {
      throw new HttpException({ success: false, message: 'Failed to create user', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('team')
  async createTeam(@Body() body: CreateTeamDto, @Req() req: Request): Promise<{ success: boolean; message: string; response: Team }> {
    try {
      const user = (req as any).clerkUser;
      if (!user) {
        throw new HttpException({ success: false, message: 'Unauthorized: User not found in request', response: null }, HttpStatus.UNAUTHORIZED);
      }

      const existingUser = await this.userService.getUserByEmail(user.email);
      if (!existingUser || (existingUser.role !== 1 && existingUser.role !== 2)) {
        throw new HttpException({ success: false, message: 'User does not exist or not authorized to create a team', response: null }, HttpStatus.FORBIDDEN);
      }

      const team = await this.userService.createTeam(body.name, body.ownerId);
      return { success: true, message: 'Team created successfully', response: team };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({ success: false, message: 'Failed to create team', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('addTeamMember')
  async addTeamMember(@Body() body: AddTeamMemberDto, @Req() req: Request): Promise<{ success: boolean; message: string; response: any }> {
    try {
      const user = (req as any).clerkUser;
      console.log("user",user);
      if (!user) {
        throw new HttpException({ success: false, message: 'Unauthorized: User not found in request', response: null }, HttpStatus.UNAUTHORIZED);
      }

      const existingUser = await this.userService.getUserByEmail(user.email);
      console.log("existingUser", existingUser);
      if (!existingUser || (existingUser.role !== 1 && existingUser.role !== 2)) {
        throw new HttpException({ success: false, message: 'User does not exist or not authorized to add team members', response: null }, HttpStatus.NOT_FOUND);
      }

      const team = await this.userService.getTeamIdByUserId(existingUser.id);
      if (!team) {
        throw new HttpException({ success: false, message: 'User is not authorized to add team members', response: null }, HttpStatus.FORBIDDEN);
      }

      const addedMember = await this.userService.addTeamMember(body.email, body.role, team.id);
      return { success: true, message: 'Team member added successfully', response: addedMember };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({ success: false, message: 'Failed to add team member', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
