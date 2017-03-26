const OpenBot = require("../open-bot/open-bot");
const config = require("../../config.json");
config.cache = "/tmp/.cache";

module.exports = (event, context, callback) => {
	const openBot = new OpenBot(config);
	const data = JSON.parse(event.Records[0].Sns.Message);
	console.log("Process", data);
	openBot.processIssue({
		owner: data.owner,
		repo: data.repo,
		number: data.number,
		reporter: ({ item, action, change, message, error, stack }) => {
			if(error) {
				console.error(error);
				console.error(stack);
				return;
			}
			console.log(`${item} ${action} ${change || ""} ${message || ""}`);
		},
		simulate: config.simulate
	}).then(result => {
		callback(null, result);
	}, err => {
		console.error(err.stack);
		callback(err);
	});
};
