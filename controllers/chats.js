const { ObjectId } = require('mongodb');

const chatsController = (upInstance) => {
	const {
		services,
	} = upInstance;

	upInstance.registerController('Chats.all', async (req, res) => {
		try {
			const { email } = req.userData;

			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('Invalid user or password');
			}

			const chats = await services.find('/chats', {
				participants: { $elemMatch: { id: exists._id, pubKey: { $ne: null } } },
			});

			console.info('chats ', chats);

			if (chats.length === 0) {
				return res.json({ chats, users: [] });
			}

			const participantIds = chats.reduce((acc, chat) => {
				chat.participants.forEach((participant) => {
					if (acc.indexOf(participant.id) === -1) acc.push(participant.id.toString());
				});
				return acc;
			}, []);

			console.info('participantIds ', participantIds);

			const participantObjectId = participantIds.map((id) => new ObjectId(id));

			console.info('participantObjectId ', participantObjectId);

			const userDetails = await services.find('/users', {
				_id: { $in: participantObjectId },
			}, {
				projection: { firstName: 1, lastName: 1 },
			});

			console.info('userDetails ', userDetails);

			const users = {};

			// eslint-disable-next-line no-restricted-syntax
			for (const u of userDetails) {
				if (exists._id.toString() !== u._id.toString()) users[u._id] = u;
			}

			return res.json({ chats, users });
		} catch (err) {
			return res.status(400).send(err.toString());
		}
	});
};

module.exports = chatsController;
