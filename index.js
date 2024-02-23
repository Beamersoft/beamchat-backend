const path = require('node:path');
const helmet = require('helmet');
const up = require('universal-pattern');

const hooks = require('./hooks');
const controllers = require('./controllers');
const boot = require('./boot');
const headers = require('./mws/headers');
const decodejwt = require('./mws/decodejwt');

const swaggerFolder = path.join(process.cwd(), 'swagger');
const routes = require('./routes');

const preMWS = [];
preMWS.push(
	helmet({
		noSniff: false,
	}),
);

preMWS.push(headers);
preMWS.push(decodejwt);

const params = {
	swagger: {
		baseDoc: process.env.BASEPATH,
		host: `${process.env.HOST}:${process.env.PORT}`,
		folder: swaggerFolder,
		info: {
			version: 2.0,
			title: 'Beamchat backend',
			termsOfService: 'www.domain.com/terms',
			contact: {
				email: 'cmartin@beamersoft.com',
			},
			license: {
				name: 'Apache',
				url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
			},
		},
	},
	preMWS,
	postMWS: [],
	bodyParser: {
		json: { limit: '2mb' },
		urlencoded: { limit: '500mb', extended: false },
	},
	compress: true,
	express: {
		json: { limit: 10485760 },
		static: 'public',
	},
	cors: true,
	production: false,
	routeController: (req, res, next, props) => {
		req.endpoint = {
			protected: props['x-swagger-protected'],
			protectedLevel: props['x-swagger-protected-level'],
			publicFields: props['x-swagger-protected-public-fields'],
			skipFields: props['x-swagger-skip-fields'],
		};
		console.info('req.userData ', req?.userData);
		if (props['x-swagger-protected']) {
			if (!req.userData) {
				return res.end('Invalid access token');
			}

			if (req.userData.level < parseInt(props['x-swagger-protected-level'], 10)) {
				return res.end('Invalid userLevel');
			}
		}

		if (props['x-swagger-update-protected-level']) {
			let dale = true;
			const protectedProps = props['x-swagger-update-protected-level'];
			if (req.swagger.params?.modeldata?.value) {
				Object.keys(req.swagger.params.modeldata.value).forEach((key) => {
					if (protectedProps[key]) {
						if (req.userData.level < protectedProps[key]) {
							dale = false;
						}
					}
				});
			}
			if (!dale) return res.status(500).end('Invalid user level');
		}

		return next();
	},
	port: process.env.PORT,
	database: {
		uri: process.env.MONGODB_URL,
		name: process.env.MONGODB_NAME,
	},
	routes,
	enabledStats: true, // enabled stats http://localhost:3500/stats
	cache: true, // active cache
};

async function init() {
	try {
		const upInstance = await up(params);
		controllers(upInstance);
		hooks(upInstance);
		boot(upInstance);
		console.info(`UP InstanceId: ${upInstance.instanceId}`);
	} catch (err) {
		console.error('Error initializing ', err);
	}
}

init();
