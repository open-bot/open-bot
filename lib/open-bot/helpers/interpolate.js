const handlebars = require("handlebars");

handlebars.registerHelper("quote", function(value) {
	return new handlebars.SafeString(value.split("\n").map(line => `> ${line}`).join("\n"));
});

handlebars.registerHelper("stringify", function(value) {
	return JSON.stringify(value, 0, 2);
});

module.exports = function interpolate(message, { context, issue, identifier }) {
	const data = Object.assign({
		owner: context.owner,
		repo: context.repo,
		item: context.item,
		botUsername: context.botUsername,
		data: context.data,
		issue: issue
	}, context.data);
	const template = handlebars.compile(message);
	let result = template(data);
	if(identifier) {
		result = `<!-- identifier: ${identifier} -->\n\n` + result;
	}
	return result;
};
