const findLast = require("../helpers/findLast");

class ReopenAction {
	constructor(options) { }

	findLast({ botUsername }, { state, timeline }) {
		if(state === "open")
			return Infinity;
		return timeline.then(timeline => findLast(timeline, event => {
			return event.event === "reopened" &&
				event.actor.login === botUsername;
		}));
	}

	run({ owner, repo, item, github, reporter }, { number }) {
		reporter({ item, action: "reopen" });
		return github.editIssue(owner, repo, number, { state: "open" });
	}
}

module.exports = ReopenAction;
