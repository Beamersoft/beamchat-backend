const users = require('./users');
const chats = require('./chats');
const notifications = require('./notifications');
const messages = require('./messages');

const controllers = (upInstance) => {
	users(upInstance);
	chats(upInstance);
	notifications(upInstance);
	messages(upInstance);
};

module.exports = controllers;
