import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const addons = pgTable('addons', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	manifest: text('manifest').notNull()
});

export const addonsRelations = relations(addons, ({ one }) => ({
	user: one(user, {
		fields: [addons.userId],
		references: [user.id]
	})
}));
