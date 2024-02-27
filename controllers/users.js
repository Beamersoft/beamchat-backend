const encrypt = require('../helpers/encrypt');

const { getSalt } = require('../helpers/salt');
const { signJWT } = require('../helpers/jwt');

const usersController = (upInstance) => {
	const {
		services,
	} = upInstance;

	upInstance.registerController('Users.login', async (req, res) => {
		const Credentials = req.swagger.params.modeldata.value;
		const email = Credentials.email.toLowerCase().trim();
		const { password } = Credentials;

		try {
			const exists = await services.findOne('/users', {
				email,
			});

			if (!exists) {
				return res.status(401).end('Invalid user or password');
			}

			if (exists.password !== encrypt(password, getSalt(exists.salt))) {
				return res.status(401).end('Invalid user or password');
			}

			const jwt = signJWT(exists);

			const user = { ...exists };

			delete user.password;
			delete user._instanceId;
			delete user.active;
			delete user.level;
			delete user.salt;
			delete user._v;
			delete user._n;
			delete user._retry;
			delete user.added;

			return res.json({
				...user,
				jwt,
			});
		} catch (err) {
			console.error('Error login: ', err);
			return res.status(500).end(err.toString());
		}
	});
};

module.exports = usersController;
