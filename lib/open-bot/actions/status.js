const interpolate = require("../helpers/interpolate");
const findLast = require("../helpers/findLast");

class StatusAction {
	constructor(options, key) {
		this.description = options.description;
		this.state = options.state || "success";
		this.target_url = options.target_url;
		this.context = options.context;
	}

	findLast(context, issue) {
		const { botUsername } = context;
		const { pull_request_statuses } = issue;
		const myContext = this.context || botUsername;
		const myDescription = interpolate(this.description, { context, issue });
		const myTargetUrl = this.target_url && interpolate(this.target_url, { context, issue });
		return pull_request_statuses.then(pull_request_statuses => {
			return findLast(pull_request_statuses, ({ state, context, target_url, description }) => {
				return state === this.state &&
					context === myContext &&
					(!myTargetUrl || target_url === myTargetUrl) &&
					description === myDescription;
			});
		});
	}

	run(context, issue) {
		const { owner, repo, item, github, reporter, botUsername } = context;
		const { pull_request_info } = issue;
		const description = interpolate(this.description, { context, issue });
		const target_url = this.target_url && interpolate(this.target_url, { context, issue });
		reporter({ item, action: "report pull request status", message: description });
		return pull_request_info.then(pull_request_info => {
			return github.createStatus(owner, repo, pull_request_info.head.sha, this.context || botUsername, this.state, { description, target_url });
		});
	}
}

module.exports = StatusAction;