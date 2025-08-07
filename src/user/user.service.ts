// src/user/user.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../db';
import { dashboards, teamDashboardAccess, teams, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/express';

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
      return allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addUserToClerk(email: string) {
    console.log('int the clerk service');
    try {
      // Check if user already exists
      const existingUsersResponse = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      console.log('Existing users in Clerk:', existingUsersResponse.data);
      const existingUsers = existingUsersResponse.data ?? [];
      if (existingUsers.length > 0) {
        console.log(`User with email ${email} already exists in Clerk`);
        return existingUsers[0];
      }

      // Create the user
      const user = await clerkClient.users.createUser({
        emailAddress: [email],
      });

      console.log(`Created Clerk user for email ${email}`);
      return user;
    } catch (error) {
      console.error('Failed to create user in Clerk:', error);
      throw error;
    }
  }

  async createUser(
    email: string,
    role: Number,
    teamId: Number | null,
  ): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({ email, role, teamId })
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTeam(name: string, ownerId: number): Promise<Team> {
    try {
      const [team] = await db
        .insert(teams)
        .values({ name, ownerId })
        .returning();
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new HttpException(
        'Failed to create team',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user.length > 0 ? (user[0] as User) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw new HttpException(
        'Failed to fetch user by email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTeamIdByUserId(userId: number): Promise<Team | null> {
    try {
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.ownerId, userId))
        .limit(1);
      return team.length > 0 ? (team[0] as Team) : null;
    } catch (error) {
      console.error('Error fetching team by user ID:', error);
      throw new HttpException(
        'Failed to fetch team by user ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addTeamMember(
    email: string,
    role: number,
    teamId: number,
  ): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({ email, role, teamId })
        .returning();
      return user;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw new HttpException(
        'Failed to add team member',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fetch user, their teams, and dashboards based on role
  async getUserAccessByRole(userId: number, role: number) {
    try {
      // Get user info with teamId
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          teamId: users.teamId,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) throw new Error('User not found');

      // Final output structure
      const response = {
        user,
        teams: [] as {
          id: number;
          name: string;
          ownerId: number;
          dashboards: { id: number; name: string; slug: string }[];
        }[],
      };

      if (role === 1) {
        // Role 1 → All teams + all dashboards per team
        const allTeams = await db.select({
          id: teams.id,
          name: teams.name,
          ownerId: teams.ownerId,
        }).from(teams);

        for (const team of allTeams) {
          const dashboardsForTeam = await db
            .select({
              id: dashboards.id,
              name: dashboards.name,
              slug: dashboards.slug,
            })
            .from(teamDashboardAccess)
            .innerJoin(
              dashboards,
              eq(teamDashboardAccess.dashboardId, dashboards.id),
            )
            .where(eq(teamDashboardAccess.teamId, team.id));

          response.teams.push({
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            dashboards: dashboardsForTeam,
          });
        }
      } else if (role === 2) {
        // Role 2 → User's own team + its dashboards
        if (!user.teamId) return response;

        const [team] = await db
          .select({
            id: teams.id,
            name: teams.name,
            ownerId: teams.ownerId,
          })
          .from(teams)
          .where(eq(teams.id, user.teamId));

        if (team) {
          const dashboardsForTeam = await db
            .select({
              id: dashboards.id,
              name: dashboards.name,
              slug: dashboards.slug,
            })
            .from(teamDashboardAccess)
            .innerJoin(
              dashboards,
              eq(teamDashboardAccess.dashboardId, dashboards.id),
            )
            .where(eq(teamDashboardAccess.teamId, team.id));

          response.teams.push({
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            dashboards: dashboardsForTeam,
          });
        }
      } else if (role === 3) {
        // Role 3 → Only dashboards of user’s team (no team metadata required)
        if (!user.teamId) return response;

        const dashboardsForTeam = await db
          .select({
            id: dashboards.id,
            name: dashboards.name,
            slug: dashboards.slug,
          })
          .from(teamDashboardAccess)
          .innerJoin(
            dashboards,
            eq(teamDashboardAccess.dashboardId, dashboards.id),
          )
          .where(eq(teamDashboardAccess.teamId, user.teamId));

        response.teams.push({
          id: user.teamId,
          name: '',
          ownerId: 0,
          dashboards: dashboardsForTeam,
        });
      } else {
        throw new Error('Invalid role');
      }

      return response;
    } catch (error) {
      console.error('Error fetching user access by role:', error);
      throw new HttpException(
        'Failed to fetch user access by role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
