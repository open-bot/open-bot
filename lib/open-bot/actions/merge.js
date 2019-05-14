const interpolate = require("../helpers/interpolate");

class MergeAction {
	constructor(options) {
		this.commit_title = undefined;
		this.commit_message = undefined;
		this.merge_method = undefined;
		if(typeof options.commit_title === "string")
			this.commit_title = options.commit_title;
		if(typeof options.commit_message === "string")
			this.commit_message = options.commit_message;
		if(typeof options.merge_method === "string")
			this.merge_method = options.merge_method;
	}

	findLast({ botUsername }, { pull_request_info }) {
		return pull_request_info.then(({ merged_by, merged_at, mergeable, merged }) => {
			if(
				merged_by &&
				merged_by.login === botUsername &&
				merged_at
			) {
				return new Date(merged_at).getTime();
			}
			if(mergeable !== true || merged) return Infinity;
			return false;
		})
	}

	run(context, issue) {
		const { owner, repo, item, github, reporter } = context;
		const { number, pull_request_info } = issue;
		return pull_request_info.then(({ title, head: { sha, label }, number }) => {
			const commit_title = this.commit_title && interpolate(this.commit_title, { context, issue }) || `Merge pull request #${number} from ${label.replace(":", "/")}`;
			const commit_message = this.commit_message && interpolate(this.commit_message, { context, issue }) || title;
			const merge_method = this.merge_method && interpolate(this.merge_method, { context, issue }) || "merge";
				reporter({ item, action: `merge ${merge_method} ${commit_title} ${commit_message}` });
			return github.merge(owner, repo, number, commit_title, commit_message, sha, merge_method);
		});
	}
}

module.exports = MergeAction;
