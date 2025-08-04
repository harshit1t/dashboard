import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

// TEAMS
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),      // e.g. Ops1, Ops2
  ownerId: integer('owner_id'),      // user.id
});

// USERS
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  role: text('role').notNull(), // e.g. 'admin', 'ops1'
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
  teamId: integer('team_id').references(() => teams.id).notNull(),
  dashboardId: integer('dashboard_id').references(() => dashboards.id).notNull(),
});

// USER → DASHBOARD ACCESS (fine-grained)
export const dashboardUserAccess = pgTable('dashboard_user_access', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  dashboardId: integer('dashboard_id').references(() => dashboards.id).notNull(),
  role: text('role').notNull(), // e.g. M, D, S
  tech: text('tech').notNull(), // e.g. tech1, tech2
});
