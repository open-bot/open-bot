const seq = require("../helpers/seq");

class AnyFilter {
	constructor(options) {
		const filtersList = require("../filters");
		const Config = require("../Config");
		this.filters = Config.parseItems(options, filtersList);
	}

	findLast(context, issue) {
		return seq(this.filters, filter => filter.findLast(context, issue))
			.then(matchedItems => matchedItems.filter(i => i >= 0).length ?
				matchedItems.filter(i => i >= 0).reduce((a, b) => Math.min(a, b), Infinity) :
				matchedItems.reduce((a, b) => Math.min(a, b), -1)
			);
	}
}

module.exports = AnyFilter;
