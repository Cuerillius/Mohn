import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const profile = pgTable('profile', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	isChild: boolean('is_child').default(false).notNull(),
	language_preference: text('language_preference').default('us_en').notNull(),
	pin: text('pin'),
	lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const profileRelations = relations(profile, ({ one }) => ({
	user: one(user, {
		fields: [profile.userId],
		references: [user.id]
	})
}));
