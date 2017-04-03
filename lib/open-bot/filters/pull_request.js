const parseDate = require("../helpers/parseDate");
const IssuePullRequestBaseFilter = require("./IssuePullRequestBaseFilter");
const matchRange = require("../helpers/matchRange");

class PullRequestFilter extends IssuePullRequestBaseFilter {
	constructor(options) {
		super(options);
		this.head_ref = undefined;
		this.base_ref = undefined;
		this.merged = undefined;
		this.mergeable = undefined;
		this.mergeable_state = undefined;
		this.merged_by = undefined;
		this.additions = undefined;
		this.deletions = undefined;
		this.commits = undefined;
		this.changed_files = undefined;
		if(options && typeof options === "object") {
			if(typeof options.head_ref === "string")
				this.head_ref = new RegExp(options.head_ref, "i");
			if(typeof options.base_ref === "string")
				this.base_ref = new RegExp(options.base_ref, "i");
			if(typeof options.mergeable_state === "string")
				this.mergeable_state = new RegExp(options.mergeable_state, "i");
			if(typeof options.merged_by === "string")
				this.merged_by = new RegExp(options.merged_by, "i");
			if(typeof options.mergeable === "boolean")
				this.mergeable = options.mergeable;
			if(typeof options.merged === "boolean")
				this.merged = options.merged;
			if(options.additions)
				this.additions = options.additions;
			if(options.deletions)
				this.deletions = options.deletions;
			if(options.commits)
				this.commits = options.commits;
			if(options.changed_files)
				this.changed_files = options.changed_files;
		}
	}

	findLast(context, issue) {
		const { pull_request, created_at, pull_request_info } = issue;
		const cd = parseDate(created_at);
		if(!pull_request) return -cd;
		return pull_request_info.then(({
			head: { ref: head_ref } = {},
			base: { ref: base_ref } = {},
			merged,
			mergeable,
			mergeable_state,
			merged_by,
			additions,
			deletions,
			commits,
			changed_files,
		}) => {
			if(typeof this.merged === "boolean") {
				if(merged !== this.merged) return -cd;
			}
			if(typeof this.mergeable === "boolean") {
				if(mergeable !== this.mergeable) return -cd;
			}
			if(this.head_ref) {
				if(!this.head_ref.test(head_ref)) return -cd;
			}
			if(this.base_ref) {
				if(!this.base_ref.test(base_ref)) return -cd;
			}
			if(this.merged_by) {
				if(!merged_by || typeof merged_by !== "object") return -cd;
				if(!this.merged_by.test(merged_by.login)) return -cd;
			}
			if(this.mergeable_state) {
				if(!this.mergeable_state.test(mergeable_state)) return -cd;
			}
			if(this.additions) {
				if(!matchRange(this.additions, additions)) return -cd;
			}
			if(this.deletions) {
				if(!matchRange(this.deletions, deletions)) return -cd;
			}
			if(this.commits) {
				if(!matchRange(this.commits, commits)) return -cd;
			}
			if(this.changed_files) {
				if(!matchRange(this.changed_files, changed_files)) return -cd;
			}
			return super.findLast(context, issue);
		});
	}
}

module.exports = PullRequestFilter;
