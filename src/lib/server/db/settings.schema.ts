import { relations } from 'drizzle-orm';
import { customType, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { decrypt, encrypt } from '../utils/encryption';

export const setting = pgTable('setting', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	torboxApiKey: customType<{ data: string }>({
		dataType() {
			return 'text';
		},
		toDriver(value) {
			return encrypt(value);
		},
		fromDriver(value) {
			return decrypt(value as string);
		}
	})('api_key')
});

export const settingRelations = relations(setting, ({ one }) => ({
	user: one(user, {
		fields: [setting.userId],
		references: [user.id]
	})
}));
