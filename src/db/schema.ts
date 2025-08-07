import { varchar } from 'drizzle-orm/mysql-core';
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  ownerId: integer ('owner_id')
    .notNull()
    .references(() => users.id), // Depends on users
});

// DASHBOARDS
export const dashboards = pgTable('dashboards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
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
});


export const roles = pgTable('roles',{
  id : serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. admin, ops1, owner
});

// Define relationships using drizzle-orm relations API

// User ↔ Team (one-to-many)
export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  dashboardUserAccess: many(dashboardUserAccess),
  ownedTeams: many(teams),
  role: one(roles, {
    fields: [users.role],
    references: [roles.id],
  })
}));

// Team ↔ User (owner)
export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(users),
}));
// Dashboard ↔ TeamDashboardAccess
export const dashboardsRelations = relations(dashboards, ({ many }) => ({
  teamDashboardAccess: many(teamDashboardAccess),
  dashboardUserAccess: many(dashboardUserAccess),
}));

// TeamDashboardAccess ↔ Team & Dashboard
export const teamDashboardAccessRelations = relations(teamDashboardAccess, ({ one }) => ({
  team: one(teams, {
    fields: [teamDashboardAccess.teamId],
    references: [teams.id],
  }),
  dashboard: one(dashboards, {
    fields: [teamDashboardAccess.dashboardId],
    references: [dashboards.id],
  }),
}));

// DashboardUserAccess ↔ User & Dashboard
export const dashboardUserAccessRelations = relations(dashboardUserAccess, ({ one }) => ({
  user: one(users, {
    fields: [dashboardUserAccess.userId],
    references: [users.id],
  }),
  dashboard: one(dashboards, {
    fields: [dashboardUserAccess.dashboardId],
    references: [dashboards.id],
  }),
}));

// Roles ↔ Users
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));