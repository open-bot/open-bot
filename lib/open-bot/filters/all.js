const seq = require("../helpers/seq");

class AllFilter {
	constructor(options) {
		const filtersList = require("../filters");
		const Config = require("../Config");
		this.filters = Config.parseItems(options, filtersList);
	}

	findLast(context, issue) {
		return seq(this.filters, filter => filter.findLast(context, issue))
			.then(matchedItems => matchedItems.filter(i => i < 0).length ?
				matchedItems.reduce((a, b) => Math.min(a, b), -1) :
				matchedItems.reduce((a, b) => Math.max(a, b), 0)
			);
	}
}

module.exports = AllFilter;
