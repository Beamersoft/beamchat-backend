const notificationsController = (upInstance) => {
	const {
		services,
	} = upInstance;

	upInstance.registerController('Notifications.all', async (req, res) => {
		try {
			const { email } = req.userData;

			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('User not found');
			}

			const notifications = await services.find('/notifications', { receiverId: exists._id });

			return res.json({ notifications });
		} catch (err) {
			return res.status(401).send(err.toString());
		}
	});
};

module.exports = notificationsController;
