// src/db/schema.ts
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

// export const userRoleEnum = pgEnum('userRole', ['superadmin', 'member', 'hod']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  // name: varchar('name', { length: 100 }),
  email: text('email').notNull(),
  role: text('role').notNull(),
});
