const users = require('./users');
const chats = require('./chats');

const controllers = (upInstance) => {
	users(upInstance);
	chats(upInstance);
};

module.exports = controllers;
