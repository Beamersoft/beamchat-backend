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
	return true;
}

module.exports = Boot;
