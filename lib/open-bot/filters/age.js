const TimeFilter = require("./TimeFilter");
const interpolate = require("../helpers/interpolate");

class AgeFilter extends TimeFilter {
	constructor(options) {
		super(options);
		this.value = "{{issue.created_at}}";
		if(options && typeof options === "object") {
			if(typeof options.value === "string")
				this.value = options.value;
		}
	}

	getDate(context, issue) {
		return interpolate(this.value, { context, issue });
	}
}

module.exports = AgeFilter;
