const interpolate = require("../helpers/interpolate");

class NewIssueAction {
	constructor(options) {
		this.target = options.target;
		this.title = options.title || "{{{issue.title}}}";
		this.body = options.body || "";
		if(typeof this.target !== "string" || !this.target)
			throw new Error("new_issue: target missing");
	}

	findLast() {
		return -1;
	}

	run(context, issue) {
		const { reporter, item, github } = context;
		const target = interpolate(this.target, { context, issue });
		const title = interpolate(this.title, { context, issue });
		const body = interpolate(this.body, { context, issue });
		const targetSplit = target.split("/");
		if(targetSplit.length !== 2)
			throw new Error("")
		reporter({ item, action: "new issue", message: `${target}: ${title}\n${body}` });
		const [owner, repo] = targetSplit;
		return github.createIssue(owner, repo, title, body);
	}
}

module.exports = NewIssueAction;
