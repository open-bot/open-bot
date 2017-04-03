const interpolate = require("../helpers/interpolate");
const findLast = require("../helpers/findLast");
const matchRange = require("../helpers/matchRange");

class EnsureFilter {
	constructor(options) {
		this.value = options.value;
		this.matching = undefined;
		this.notMatching = undefined;
		this.equals = undefined;
		this.notEquals = undefined;
		this.range = undefined;
		if(typeof options.matching === "string")
			this.matching = new RegExp(options.matching, "i");
		if(typeof options.notMatching === "string")
			this.notMatching = new RegExp(options.notMatching, "i");
		if(typeof options.equals !== "undefined")
			this.equals = options.equals;
		if(typeof options.notEquals !== "undefined")
			this.notEquals = options.notEquals;
		if(typeof options.range !== "undefined")
			this.range = options.range;
	}

	findLast(context, issue) {
		const value = interpolate(this.value, { context, issue });
		if(this.matching) {
			if(!this.matching.test(value)) return -1;
		}
		if(this.notMatching) {
			if(this.notMatching.test(value)) return -1;
		}
		if(typeof this.equals !== "undefined") {
			const equ = typeof this.equals === "string" ? interpolate(this.equals, { context, issue }) : this.equals;
			if(equ !== value) return -1;
		}
		if(typeof this.notEquals !== "undefined") {
			const neq = typeof this.notEquals === "string" ? interpolate(this.notEquals, { context, issue }) : this.notEquals;
			if(neq === value) return -1;
		}
		if(typeof this.range !== "undefined") {
			if(!matchRange(this.range, +value)) return -1;
		}
		return 1;
	}
}

module.exports = EnsureFilter;
