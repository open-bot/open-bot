const handlers = [
	"process-tasks",
	"handle-github-event"
];

handlers.forEach(name => {
	const camelCasedName = name.replace(/-(.)/g, match => match[1].toUpperCase());
	Object.defineProperty(exports, camelCasedName, {
		get: () => require(`./lib/open-bot-${name}/handler.js`)
	});
});
