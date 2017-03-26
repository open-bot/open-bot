const seq = require("../helpers/seq");
const parseDate = require("../helpers/parseDate");
const findCount = require("../helpers/findCount");

class ThresholdFilter {
	constructor(options) {
		const filtersList = require("../filters");
		const Config = require("../Config");
		this.filters = Config.parseItems(options.filters, filtersList);
		this.minimum = typeof options.minimum === "number" && options.minimum;
		this.maximum = typeof options.maximum === "number" && options.maximum;
		if(typeof this.minimum !== "number" && typeof this.maximum !== "number")
			throw new Error("Must specify minimum and/or maximum of threshold");
	}

	findLast(context, issue) {
		return seq(this.filters, filter => filter.findLast(context, issue))
			.then(matchedItems => matchedItems.sort((a, b) => Math.abs(a) - Math.abs(b)))
			.then(matchedItems => findCount(matchedItems, this.minimum, this.maximum, parseDate(issue.created_at), time => time >= 0));
	}
}

module.exports = ThresholdFilter;
