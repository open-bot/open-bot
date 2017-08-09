const schedule = require("../../open-bot-scheduler").schedule;
const Duration = require("duration-js");
const interpolate = require("../helpers/interpolate");

class ScheduleAction {
	constructor(options) {
		if(typeof options === "object")
			this.in = options.in;
		else
			this.in = options;
	}

	findLast() {
		return -1;
	}

	run(context, issue) {
		const { owner, repo, item, simulate, reporter } = context;
		const { number } = issue;
		const inDuration = new Duration(interpolate(this.in, { context, issue })).valueOf();
		reporter({ item, action: "schedule", message: `in ${Math.round(inDuration/1000)} seconds` });
		if(simulate) return Promise.resolve();
		return schedule(owner, repo, number, inDuration);
	}
}

module.exports = ScheduleAction;
