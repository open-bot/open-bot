const findLast = require("../helpers/findLast");
const TimeFilter = require("./TimeFilter");

const USER_ACTIONS = [
	"assigned",
	"closed",
	"commented",
	"committed",
	"cross-referenced",
	"head_ref_restored",
	"labeled",
	"milestoned",
	"renamed",
	"reopened",
	"review_requested",
	"reviewed",
	"line-commented"
];

class LastActionAgeFilter extends TimeFilter {
	constructor(options) {
		super(options);
		if(typeof options === "object") {
			this.includeBotActions = !!options.includeBotActions;
		}
	}

	getDate({ botUsername }, { created_at, timeline }) {
		return timeline.then(timeline => {
			const maxCommentDate = findLast(timeline, event =>
				USER_ACTIONS.includes(event.event) &&
				(!event.actor || this.includeBotActions || event.actor.login !== botUsername)
			);
			const issueDate = new Date(created_at).getTime();
			return Math.max(issueDate, maxCommentDate);
		});
	}
}

module.exports = LastActionAgeFilter;
