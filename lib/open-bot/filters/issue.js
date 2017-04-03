const parseDate = require("../helpers/parseDate");
const IssuePullRequestBaseFilter = require("./IssuePullRequestBaseFilter");

class IssueFilter extends IssuePullRequestBaseFilter {
	constructor(options) {
		super(options);
	}

	findLast(context, issue) {
		const { pull_request, created_at } = issue;
		const cd = parseDate(created_at);
		if(pull_request) return -cd;
		return super.findLast(context, issue);
	}
}

module.exports = IssueFilter;
