// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { teams, users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  async getAllUsers() {
    const a = await db.select().from(users);
    console.log( a);
    return {
        message: 'Users fetched successfully',
        data: a,
    };
  }

  async createUser(name: string, email: string, role: any, teamId: number) {
    return await db.insert(users).values({ email, role, teamId });
  }

  async createTeam(name:string, ownerId:number){
     try {
      const team = await db.insert(teams).values({ name, ownerId });
      return team;
     } catch (error) {
      console.error('Error creating team:', error);
     }
  }

  async getUserByEmail(email: string) {
   try {
     const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
     return user.length > 0 ? user[0] : null;
   } catch (error) {
    console.error('Error fetching user by email:', error);
   }
  }

  async getTeamIdByUserId(userId: number) {
    try {
      const user = await db.select().from(teams).where(eq(teams.ownerId, userId)).limit(1);
      return user.length > 0 ? user[0].teamId : null;
    }catch (error) {
      console.error('Error fetching team ID by user ID:', error);
    }
  }

  async addTeamMember(email: string, role: any, teamId: number) {
    // Logic to add a team member
    // This might involve checking if the user exists, then adding them to a team
    return await db.insert(users).values({ email, role, teamId });
  }
}
