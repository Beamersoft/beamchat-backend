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

			const participantIds = chats.reduce((acc, chat) => {
				chat.participants.forEach((participant) => {
					if (acc.indexOf(participant.id) === -1) acc.push(participant.id.toString());
				});
				return acc;
			}, []);

			const participantObjectId = participantIds.map((id) => new ObjectId(id));

			const userDetails = await services.find('/users', {
				_id: { $in: participantObjectId },
			}, {
				projection: { firstName: 1, lastName: 1 },
			});

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
