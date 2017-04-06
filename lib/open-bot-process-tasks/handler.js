const OpenBot = require("../open-bot/open-bot");
const config = require("../../config.json");
config.cache = "/tmp/.cache";

function mergeEvents(events) {
	const reducedEvents = [];
	const processedEvents = Object.create(null);
	events.forEach(event => {
		const key = event.item;
		if(processedEvents[key]) return;
		processedEvents[key] = true;
		reducedEvents.push(event);
	});
	return reducedEvents;
}

module.exports = (event, context, callback) => {
	const openBot = new OpenBot(config);
	console.log(`Received ${event.Records.length} events`);
	const rawEvents = event.Records
		.map(record => record.dynamodb.NewImage)
		.filter(Boolean)
		.map(data => ({
			item: data.item.S,
			owner: data.owner.S,
			repo: data.repo.S,
			number: +data.number.N
		}));
	console.log(`${rawEvents.length} events with items`);
	const events = mergeEvents(rawEvents);
	console.log(`Process ${events.length} events: `, events.map(e => e.item).join(" "));
	Promise.all(events.map(event => openBot.getIssue(event.owner, event.repo, event.number)))
		.then(issues => openBot.process({
			workItems: issues,
			reporter: ({ item, debug, action, change, message, error, stack }) => {
				if(debug) return;
				if(error) {
					console.error(`${item} ${error}`);
					console.error(stack);
					return;
				}
				console.log(`${item} ${action} ${change || ""} ${message || ""}`);
			},
			simulate: config.simulate
		}))
		.then(result => {
			callback(null, result);
		}, err => {
			console.error(err.stack);
			callback(err);
		});
};
