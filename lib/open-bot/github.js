const { Octokit } = require("@octokit/rest");
const clone = require("clone");
const seq = require("./helpers/seq");
const ApiUtils = require("./api-utils");

const USER_AGENT = "github.com/open-bot/open-bot";

class Github {
	constructor({ token, cache, simulate }) {
		this.simulate = !!simulate;
		this.api = new Octokit({
			auth: token,
			version: "3.0.0",
			userAgent: USER_AGENT,
			previews: ["mockingbird-preview", "squirrel-girl-preview"],
			includePreview: true
		});
		this.apiUtils = new ApiUtils({ cache });
	}

	getReposOfUser(username) {
		return this._fetch("repos.getForUser", this.api.repos.listForUser, {
			username
		});
	}

	getReposOfOrg(org) {
		return this._fetch("repos.getForOrg", this.api.repos.listForOrg, {
			org
		});
	}

	getRepo(owner, repo) {
		return this._fetch("repos.get", this.api.repos.get, {
			owner,
			repo
		});
	}

	getIssuesForRepo(owner, repo, { state = "all", since, labels } = {}) {
		return this._fetch("issues.getForRepo", this.api.issues.listForRepo, this.filterUndefined({
			owner,
			repo,
			state,
			since,
			labels,
			sort: "updated"
		}));
	}

	getPullRequestForCommit(owner, repo, sha) {
		return this._fetch("pullRequests.getAll", this.api.pulls.list, {
			per_page: 10,
			owner,
			repo,
			state: "open"
		}).then(pullRequests => pullRequests.filter(pr => pr.head && pr.head.sha === sha)[0]);
	}

	getIssue(owner, repo, issue_number) {
		return this._fetch("issues.get", this.api.issues.get, {
			owner,
			repo,
			issue_number
		});
	}

	getEventsForIssue(owner, repo, issue_number) {
		return this._fetch("issues.getEventsTimeline", this.api.issues.listEventsForTimeline, {
			owner,
			repo,
			issue_number
		});
	}

	getCommentsForIssue(owner, repo, issue_number) {
		return this._fetch("issues.getComments", this.api.issues.listComments, {
			owner,
			repo,
			issue_number
		});
	}

	getPermissionForRepo(owner, repo, username) {
		return this._fetch("repos.reviewUserPermissionLevel", this.api.repos.getCollaboratorPermissionLevel, {
			owner,
			repo,
			username
		});
	}

	getPullRequest(owner, repo, pull_number) {
		return this._fetch("pullRequests.get", this.api.pulls.get, {
			owner,
			repo,
			pull_number
		});
	}

	getPullRequest(owner, repo, pull_number) {
		return this._fetch("pullRequests.get", this.api.pulls.get, {
			owner,
			repo,
			pull_number
		});
	}

	getCommitsForPullRequest(owner, repo, pull_number) {
		return this._fetch("pullRequests.getCommits", this.api.pulls.listCommits, {
			owner,
			repo,
			pull_number
		});
	}

	getFilesForPullRequest(owner, repo, pull_number) {
		return this._fetch("pullRequests.getFiles", this.api.pulls.listFiles, {
			owner,
			repo,
			pull_number
		});
	}

	getReviewsForPullRequest(owner, repo, pull_number) {
		return this._fetch("pullRequests.getReviews", this.api.pulls.listReviews, {
			owner,
			repo,
			pull_number
		});
	}

	getReviewRequestsForPullRequest(owner, repo, pull_number) {
		return this._fetch("pulls.listRequestedReviewers", this.api.pulls.listRequestedReviewers, {
			owner,
			repo,
			pull_number
		});
	}

	getStatuses(owner, repo, ref) {
		return this._fetch("repos.listCommitStatusesForRef", this.api.repos.listCommitStatusesForRef, {
			owner,
			repo,
			ref
		});
	}

	getChecks(owner, repo, ref) {
		return this._fetch("repos.checks.listForRef", this.api.checks.listForRef, {
			owner,
			repo,
			ref
		});
	}

	getBlob(owner, repo, pathInRepo) {
		return this._fetch("repos.getContent", this.api.repos.getContent, {
			owner,
			repo,
			path: pathInRepo
		});
	}

	editIssue(owner, repo, issue_number, update) {
		update = clone(update);
		update.owner = owner;
		update.repo = repo;
		update.issue_number = issue_number;
		return this._action(this.api.issues.update, update);
	}

	addLabels(owner, repo, issue_number, labels) {
		return this._action(this.api.issues.addLabels, {
			owner,
			repo,
			issue_number,
			labels
		});
	}

	removeLabels(owner, repo, issue_number, labels) {
		return seq(labels, label => this._action(this.api.issues.removeLabel, {
			owner,
			repo,
			issue_number,
			name: label
		}));
	}

	createIssue(owner, repo, title, body) {
		return this._action(this.api.issues.create, {
			owner,
			repo,
			title,
			body
		});
	}

	createComment(owner, repo, issue_number, body) {
		return this._action(this.api.issues.createComment, {
			owner,
			repo,
			issue_number,
			body
		});
	}

	editComment(owner, repo, comment_id, body) {
		return this._action(this.api.issues.updateComment, {
			owner,
			repo,
			comment_id,
			body
		});
	}

	deleteComment(owner, repo, comment_id) {
		return this._action(this.api.issues.deleteComment, {
			owner,
			repo,
			comment_id
		});
	}

	createStatus(owner, repo, sha, context, state, { target_url, description } = {}) {
		return this._action(this.api.repos.createCommitStatus, {
			owner,
			repo,
			sha,
			state,
			target_url,
			description,
			context
		});
	}

	merge(owner, repo, pull_number, commit_title, commit_message, sha, merge_method) {
		return this._action(this.api.pulls.merge, {
			owner,
			repo,
			pull_number,
			commit_title,
			commit_message,
			sha,
			merge_method
		});
	}

	filterUndefined(obj) {
		return Object.keys(obj).reduce((o, k) => {
			if(typeof obj[k] !== "undefined")
				o[k] = obj[k];
			return o;
		}, {})
	}

	_action(api, data) {
		if(this.simulate) return Promise.resolve();
		return api(data);
	}

	_fetch(name, api, data) {
		return this.apiUtils.fetchAll(name, api, data);
	}
}

module.exports = Github;

