const interpolate = require("../helpers/interpolate");

class MatchFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.value = options.value;
		this.matching = new RegExp(options.matching, "i");
	}

	findLast(context, issue) {
		const value = interpolate(this.value, { context, issue });
		const match = this.matching.exec(value);
		if(!match) return -1;
		if(this.id) {
			context.data[this.id] = match;
		}
		return 1;
	}
}

module.exports = MatchFilter;
