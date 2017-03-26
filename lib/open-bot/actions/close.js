const findLast = require("../helpers/findLast");

class CloseAction {
	constructor(options) { }

	findLast({ botUsername }, { state, timeline }) {
		if(state === "closed")
			return Infinity;
		return timeline.then(timeline => findLast(timeline, event => {
			return event.event === "closed" &&
				event.actor &&
				event.actor.login === botUsername;
		}));
	}

	run({ owner, repo, item, github, reporter }, { number }) {
		reporter({ item, action: "close" });
		return github.editIssue(owner, repo, number, { state: "closed" });
	}
}

module.exports = CloseAction;
