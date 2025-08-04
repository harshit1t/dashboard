// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { users } from '../db/schema';

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

  async createUser(name: string, email: string, role: any) {
    return await db.insert(users).values({ email, role });
  }
}
