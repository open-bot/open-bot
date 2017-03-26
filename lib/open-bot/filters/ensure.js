const interpolate = require("../helpers/interpolate");
const findLast = require("../helpers/findLast");

class EnsureFilter {
	constructor(options) {
		this.value = options.value;
		this.matching = undefined;
		this.equals = undefined;
		if(typeof options.matching === "string")
			this.matching = new RegExp(options.matching, "i");
		if(typeof options.equals !== "undefined")
			this.equals = options.equals;
	}

	findLast(context, issue) {
		const value = interpolate(this.value, { context, issue });
		if(this.matching) {
			if(!this.matching.test(value)) return -1;
		}
		if(typeof this.equals !== "undefined") {
			if(this.equals !== value) return -1;
		}
		return 1;
	}
}

module.exports = EnsureFilter;
