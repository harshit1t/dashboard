// src/user/user.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../db';
import { teams, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface User {
  id: number;
  email: string;
  teamId: number | null;
  role: number;
}

export interface Team {
  id: number;
  name: string;
  ownerId: number;
}

@Injectable()
export class UserService {
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers.map(user => ({
        id: user.id,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createUser(email: string, role: number, teamId: number): Promise<User> {
    try {
      const [user] = await db.insert(users).values({ email, role, teamId }).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createTeam(name: string, ownerId: number): Promise<Team> {
    try {
      const [team] = await db.insert(teams).values({ name, ownerId }).returning();
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new HttpException('Failed to create team', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      console.log("user",user);
      return user.length > 0 ? (user[0] as User) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw new HttpException('Failed to fetch user by email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTeamIdByUserId(userId: number): Promise<Team | null> {
    try {
      const team = await db.select().from(teams).where(eq(teams.ownerId, userId)).limit(1);
      return team.length > 0 ? (team[0] as Team) : null;
    } catch (error) {
      console.error('Error fetching team by user ID:', error);
      throw new HttpException('Failed to fetch team by user ID', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addTeamMember(email: string, role: number, teamId: number): Promise<User> {
    try {
      const [user] = await db.insert(users).values({ email, role, teamId }).returning();
      return user;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw new HttpException('Failed to add team member', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
}
