const findCount = require("../helpers/findCount");
const parseDate = require("../helpers/parseDate");

class NumberOfCommentsFilter {
	constructor(options) {
		this.minimum = undefined;
		this.maximum = undefined;
		if(typeof options === "number") {
			this.minimum = options;
		} else {
			if(typeof options.minimum === "number")
				this.minimum = options.minimum;
			if(typeof options.maximum === "number")
				this.maximum = options.maximum;
		}
	}

	findLast({ }, { timeline }) {
		return timeline.then(timeline => findCount(timeline, this.minimum, this.maximum, parseDate(created_at), ({ event }) => {
			return event === "commented";
		}));
	}
}

module.exports = NumberOfCommentsFilter;
