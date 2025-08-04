import { Injectable } from '@nestjs/common';
import { users } from './drizzle/schema';
import { eq } from 'drizzle-orm';
import { db } from './drizzle';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Dashboard API is running!';
  }
  async getAllUser(email: string): Promise<object> {
    const a = await db.select().from(users).where(eq(users.email, email));
    console.log(a);
    const role = a[0]?.role;
    return {
      email,
      role,
      permissions: role === 'admin' ? ['/dashboard', '/admin'] : ['/dashboard'],
    };
  }
}
