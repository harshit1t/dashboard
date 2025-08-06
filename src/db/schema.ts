import { varchar } from 'drizzle-orm/mysql-core';
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

// USERS
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  teamId: integer('team_id') // Nullable to avoid circular FK issues
    .references(() => teams.id),
  role: integer('role').references(()=>roles.id).notNull(),
});

// TEAMS
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g. Ops1, Ops2
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id), // Depends on users
});

// DASHBOARDS
export const dashboards = pgTable('dashboards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  order: integer('order').notNull(),
});

// TEAM → DASHBOARD ACCESS
export const teamDashboardAccess = pgTable('team_dashboard_access', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  dashboardId: integer('dashboard_id')
    .notNull()
    .references(() => dashboards.id),
});

// USER → DASHBOARD ACCESS (fine-grained)
export const dashboardUserAccess = pgTable('dashboard_user_access', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  dashboardId: integer('dashboard_id')
    .notNull()
    .references(() => dashboards.id),
  role: text('role').notNull(), // e.g. M, D, S
  tech: text('tech').notNull(), // e.g. tech1, tech2
});


export const roles = pgTable('roles',{
  id : serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. admin, ops1, owner
})