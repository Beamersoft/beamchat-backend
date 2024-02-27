const messagesController = (upInstance) => {
	const {
		services,
		db,
	} = upInstance;

	upInstance.registerController('Messages.get', async (req, res) => {
		try {
			const { email } = req.userData;

			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('User not found');
			}

			const MessagesChat = req.swagger.params.modeldata.value;

			const {
				chatId,
				skip,
				limit,
			} = MessagesChat;

			const userBelongToChat = await services.findOne('/chats', { chatId }, {
				participants: { $elemMatch: { id: exists._id } },
			});

			if (!userBelongToChat) return res.status(401).send('User does not belong to chat');

			const messages = await db.messages.find({ chatId })
				.sort({ createdAt: -1 })
				.skip(Number(skip))
				.limit(Number(limit))
				.toArray();

			if (messages) {
				return res.json({ messages });
			}

			return res.status(401).send('Cannot find a chat');
		} catch (err) {
			return res.status(401).send(err.toString());
		}
	});
};

module.exports = messagesController;
