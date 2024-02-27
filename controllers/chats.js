const { v4 } = require('uuid');

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

			if (chats.length === 0) {
				return res.json({ chats, users: [] });
			}

			const participantIds = chats.reduce((acc, chat) => {
				chat.participants.forEach((participant) => {
					if (acc.indexOf(participant.id) === -1 &&
					participant.id.toString() !== exists._id.toString()) {
						acc.push(participant.id.toString());
					}
				});
				return acc;
			}, []);

			const promises = [];
			// eslint-disable-next-line no-restricted-syntax
			for (const participant of participantIds) {
				promises.push(services.findOne('/users', {
					_id: participant,
				}, {
					projection: { firstName: 1, lastName: 1 },
				}));
			}

			const promisesRes = await Promise.all(promises);

			const users = {};

			// eslint-disable-next-line no-restricted-syntax
			for (const u of promisesRes) {
				users[u._id.toString()] = u;
			}

			return res.json({ chats, users });
		} catch (err) {
			return res.status(401).send(err.toString());
		}
	});

	upInstance.registerController('Chats.accept', async (req, res) => {
		try {
			const { email } = req.userData;

			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('User not found');
			}

			const AcceptChat = req.swagger.params.modeldata.value;

			const {
				chatId,
				pubKey,
			} = AcceptChat;

			console.info('AcceptChat ', AcceptChat);

			const chat = await services.findOne('/chats', {
				participants: {
					$elemMatch: {
						id: exists._id,
					},
				},
			});

			console.info('chat ', chat);

			if (!chat) return res.status(400).send('Chat not found');

			await services.updateByFilter(
				'chats',
				{
					chatId,
					'participants.id': exists._id,
				},
				{
					'participants.$[elem].pubKey': pubKey,
				},
				{
					updated: false,
					set: true,
				},
				{
					arrayFilters: [{ 'elem.id': exists._id, 'elem.pubKey': null }],
				},
			);

			console.info('updated');

			await services.updateByFilter('/notifications', {
				chatId,
			}, {
				$set: {
					status: 'accepted',
					answeredAt: new Date(),
				},
			});

			return res.json({ chatId });
		} catch (err) {
			return res.status(401).send(err.toString());
		}
	});

	upInstance.registerController('Chats.create', async (req, res) => {
		try {
			const { email } = req.userData;

			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('User not found');
			}

			const CreateChat = req.swagger.params.modeldata.value;

			const {
				isPrivate,
				pubKey,
				invitedEmail,
			} = CreateChat;

			if (email === invitedEmail) return res.status(400).send('Cannot invite yourself to a chat');

			const invitedUser = await services.findOne('/users', { email: invitedEmail });

			if (!invitedUser) return res.status(400).send('Invited user not found');

			const chatId = v4();

			const newChat = {
				chatId,
				participants: [{
					id: exists._id,
					pubKey,
				}, {
					id: invitedUser._id,
					pubKey: null,
				}],
				isPrivate: isPrivate || true,
				createdAt: new Date(),
			};

			await services.insert('/chats', newChat);

			const newNotification = {
				senderId: exists._id,
				receiverId: invitedUser._id,
				chatId,
				status: 'pending',
				type: 'NOTIFICATION_CHAT_INVITE',
				sentAt: new Date(),
				answeredAt: null,
			};

			await services.insert('/notifications', newNotification);

			// TODO: Send push notification to invitedUser

			return res.json({ chatId });
		} catch (err) {
			return res.status(401).send(err.toString());
		}
	});
};

module.exports = chatsController;
