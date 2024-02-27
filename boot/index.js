const encrypt = require('../helpers/encrypt');
const { generateSalt } = require('../helpers/salt');

async function Boot(upInstance) {
	const {
		services,
		db,
	} = upInstance;

	const hasSuperAdminUser = await services.findOne('/users', { level: 50 });
	if (!hasSuperAdminUser) {
		const salt = generateSalt();
		await services.insert('/users', {
			firstName: 'Universal',
			lastName: 'Pattern',
			email: 'test@beamersoft.com',
			criterial: 'universal pattern example',
			password: encrypt('SET_PASSWORD', salt),
			active: true,
			level: 50,
			salt,
		});
	}

	await db.users.createIndex({ email: -1 });

	// Chats collection
	await db.chats.createIndex({ chatId: 1 });
	await db.chats.createIndex({ participantsId: 1 });

	// Messages collection
	await db.messages.createIndex({ chatId: 1 });
	await db.messages.createIndex({ senderId: 1 });
	await db.messages.createIndex({ createdAt: 1 });
	await db.messages.createIndex({ messageId: 1 });

	// Notifications collection
	await db.notifications.createIndex({ senderId: 1 });
	await db.notifications.createIndex({ receiverId: 1 });
	await db.notifications.createIndex({ sentAt: 1 });
	await db.notifications.createIndex({ type: 1 });

	return true;
}

module.exports = Boot;
