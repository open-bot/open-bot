const findLast = require("../helpers/findLast");
const parseDate = require("../helpers/parseDate");

class OpenFilter {
	constructor(options) {
		this.state = options ? "open" : "closed";
	}

	findLast({ botUsername }, { created_at, timeline, state }) {
		const isTrue = this.state === state;
		const lookFor = state === "open" ? "reopened" : "closed";
		return timeline.then(timeline => {
			let lastChange = findLast(timeline, ({ event, actor: { login } = {} }) => {
				return event === lookFor &&
					login !== botUsername;
			})
			if(lastChange < 0) lastChange = parseDate(created_at);
			return isTrue ? lastChange : -lastChange;
		});
	}
}

module.exports = OpenFilter;
