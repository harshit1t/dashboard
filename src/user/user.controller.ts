// src/user/user.controller.ts
import { Controller, Get, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { User, UserService, Team } from './user.service';
import { Request } from 'express';
import { z } from 'zod';

export interface CreateUserDto {
  email: string;
  role: number;
  teamId: number; // teamId can be nullable
}

export interface CreateTeamDto {
  name: string;
}

export interface AddTeamMemberDto {
  email: string;
  role: number;
}

// Zod schemas for validation
export const CreateUserSchema = z.object({
  email: z.email(),
  role: z.number().int().min(1),
  teamId: z.number().int().min(1),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(1),
});

export const AddTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.number().int().min(1),
});

// Controller for user-related operations
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // endpoint to get all users
  @Get()
  async getAll(): Promise<{ success: boolean; message: string; response: User[]}> {
    try {
      const users = await this.userService.getAllUsers();
      return { success: true, message: 'Users fetched successfully', response: users };
    } catch (error) {
      throw new HttpException({ success: false, message: 'Failed to fetch users', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // endpoint to create a new user in both db and clerk if not exists
  @Post()
async create(@Body() body: CreateUserDto) {
  try {
    CreateUserSchema.parse(body);

    const existingUser = await this.userService.getUserByEmail(body.email);
    if (existingUser) {
      return { success: true, message: 'User already exists in database', response: existingUser };
    }

    // Add to Clerk via API
    const clerkUser = await this.userService.addUserToClerk(body.email);

    const user = await this.userService.createUser(body.email, body.role, body.teamId);
    return {
      success: true,
      message: 'User created and added to Clerk dashboard',
      response: user,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpException({ success: false, message: 'Validation error', response: error.issues }, HttpStatus.BAD_REQUEST);
    }
    throw new HttpException({ success: false, message: 'Failed to create user', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

 
  // endpoint to create a new team
  @Post('team')
  async createTeam(@Body() body: CreateTeamDto, @Req() req: Request): Promise<{ success: boolean; message: string; response: Team }> {
    try {
      // Validate input using Zod
      CreateTeamSchema.parse(body);

      const user = (req as any).clerkUser;
      if (!user) {
        throw new HttpException({ success: false, message: 'Unauthorized: User not found in request', response: null }, HttpStatus.UNAUTHORIZED);
      }

      const existingUser = await this.userService.getUserByEmail(user.email);
      if (!existingUser || (existingUser.role !== 1 && existingUser.role !== 2)) {
        throw new HttpException({ success: false, message: 'User does not exist or not authorized to create a team', response: null }, HttpStatus.FORBIDDEN);
      }

      const team = await this.userService.createTeam(body.name, existingUser.id);
      return { success: true, message: 'Team created successfully', response: team };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException({ success: false, message: 'Validation error', response: error.issues }, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({ success: false, message: 'Failed to create team', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // endpoint to add a team member
  @Post('addTeamMember')
  async addTeamMember(@Body() body: AddTeamMemberDto, @Req() req: Request): Promise<{ success: boolean; message: string; response: any }> {
    try {
      // Validate input using Zod
      AddTeamMemberSchema.parse(body);

      const user = (req as any).clerkUser;
      if (!user) {
        throw new HttpException({ success: false, message: 'Unauthorized: User not found in request', response: null }, HttpStatus.UNAUTHORIZED);
      }

      const existingUser = await this.userService.getUserByEmail(user.email as string);
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
      if (error instanceof z.ZodError) {
        throw new HttpException({ success: false, message: 'Validation error', response: error.issues }, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({ success: false, message: 'Failed to add team member', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 
  @Get("me")
  async getMe(@Req() req: Request): Promise<{ success: boolean; message: string; response: any }> {
    try {
      const email = (req as any).clerkUser?.email;
      if (!email) {
        throw new HttpException({ success: false, message: 'Unauthorized: User not found in request', response: null }, HttpStatus.UNAUTHORIZED);
      }

      // Fetch user from DB
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new HttpException({ success: false, message: 'User not found in database', response: null }, HttpStatus.NOT_FOUND);
      }

      // Use the new service to get teams and dashboards based on role
      const result = await this.userService.getUserAccessByRole(user.id, user.role);
      const { teams } = result;
      // Extract dashboards from the first team, or set to [] if no teams
      const dashboards = teams && teams.length > 0 ? teams[0].dashboards : [];
      return {
        success: true,
        message: 'User, teams, and dashboards fetched successfully',
        response: {
          user,
          teams,
          dashboards
        }
      };
    } catch (error) {
      throw new HttpException({ success: false, message: 'Failed to fetch user/teams/dashboards', response: null }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
