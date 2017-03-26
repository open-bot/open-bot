const seq = require("../helpers/seq");

class InOrderFilter {
	constructor(options) {
		const filtersList = require("../filters");
		const Config = require("../Config");
		this.filters = Config.parseItems(options, filtersList);
	}

	findLast(context, issue) {
		return seq(this.filters, filter => filter.findLast(context, issue))
			.then(matchedItems => {
				if(matchedItems.some(item => item < 0)) {
					return matchedItems.filter(item => item < 0)[0];
				}
				for(let i = 1; i < matchedItems.length; i++) {
					if(matchedItems[i - 1] > matchedItems[i])
						return -matchedItems[i - 1];
				}
				return matchedItems[matchedItems.length - 1];
			});
	}
}

module.exports = InOrderFilter;