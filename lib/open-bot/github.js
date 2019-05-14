const GitHubApi = require("github");
const clone = require("clone");
const seq = require("./helpers/seq");
const ApiUtils = require("./api-utils");

const USER_AGENT = "github.com/open-bot/open-bot";

class Github {
	constructor({ user, token, cache, simulate }) {
		this.simulate = !!simulate;
		this.api = new GitHubApi({
			version: "3.0.0",
			requestMedia: "application/vnd.github.squirrel-girl-preview+json",
			includePreview: true
		});
		this.api.authenticate({
			type: "oauth",
			token: token
		});
		this.apiUtils = new ApiUtils({ cache });
	}

	getReposOfUser(username) {
		return this._fetch("repos.getForUser", this.api.repos.getForUser, {
			username
		});
	}

	getReposOfOrg(org) {
		return this._fetch("repos.getForOrg", this.api.repos.getForOrg, {
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
		return this._fetch("issues.getForRepo", this.api.issues.getForRepo, this.filterUndefined({
			owner,
			repo,
			state,
			since,
			labels,
			sort: "updated"
		}));
	}

	getPullRequestForCommit(owner, repo, sha) {
		return this._fetch("pullRequests.getAll", this.api.pullRequests.getAll, {
			per_page: 10,
			owner,
			repo,
			state: "open"
		}).then(pullRequests => pullRequests.filter(pr => pr.head && pr.head.sha === sha)[0]);
	}

	getIssue(owner, repo, number) {
		return this._fetch("issues.get", this.api.issues.get, {
			owner,
			repo,
			number
		});
	}

	getEventsForIssue(owner, repo, issue_number) {
		return this._fetch("issues.getEventsTimeline", this.api.issues.getEventsTimeline, {
			owner,
			repo,
			issue_number
		});
	}

	getCommentsForIssue(owner, repo, number) {
		return this._fetch("issues.getComments", this.api.issues.getComments, {
			owner,
			repo,
			number
		});
	}

	getPermissionForRepo(owner, repo, username) {
		return this._fetch("repos.reviewUserPermissionLevel", this.api.repos.reviewUserPermissionLevel, {
			owner,
			repo,
			username
		});
	}

	getPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.get", this.api.pullRequests.get, {
			owner,
			repo,
			number
		});
	}

	getPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.get", this.api.pullRequests.get, {
			owner,
			repo,
			number
		});
	}

	getCommitsForPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.getCommits", this.api.pullRequests.getCommits, {
			owner,
			repo,
			number
		});
	}

	getFilesForPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.getFiles", this.api.pullRequests.getFiles, {
			owner,
			repo,
			number
		});
	}

	getReviewsForPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.getReviews", this.api.pullRequests.getReviews, {
			owner,
			repo,
			number
		});
	}

	getReviewRequestsForPullRequest(owner, repo, number) {
		return this._fetch("pullRequests.getReviewRequests", this.api.pullRequests.getReviewRequests, {
			owner,
			repo,
			number
		});
	}

	getStatuses(owner, repo, ref) {
		return this._fetch("repos.getStatuses", this.api.repos.getStatuses, {
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

	editIssue(owner, repo, number, update) {
		update = clone(update);
		update.owner = owner;
		update.repo = repo;
		update.number = number;
		return this._action(this.api.issues.edit, update);
	}

	addLabels(owner, repo, number, labels) {
		return this._action(this.api.issues.addLabels, {
			owner,
			repo,
			number,
			labels
		});
	}

	removeLabels(owner, repo, number, labels) {
		return seq(labels, label => this._action(this.api.issues.removeLabel, {
			owner,
			repo,
			number,
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

	createComment(owner, repo, number, body) {
		return this._action(this.api.issues.createComment, {
			owner,
			repo,
			number,
			body
		});
	}

	editComment(owner, repo, id, body) {
		return this._action(this.api.issues.editComment, {
			owner,
			repo,
			id,
			body
		});
	}

	deleteComment(owner, repo, id) {
		return this._action(this.api.issues.deleteComment, {
			owner,
			repo,
			id
		});
	}

	createStatus(owner, repo, sha, context, state, { target_url, description } = {}) {
		return this._action(this.api.repos.createStatus, {
			owner,
			repo,
			sha,
			state,
			target_url,
			description,
			context
		});
	}

	merge(owner, repo, number, commit_title, commit_message, sha, merge_method) {
		return this._action(this.api.pullRequests.merge, {
			owner,
			repo,
			number,
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
		return new Promise((resolve, reject) => {
			api(data, (err) => {
				if(err) return reject(err);
				resolve();
			});
		});
	}

	_fetch(name, api, data) {
		return this.apiUtils.fetchAll(name, api, data);
	}
}

module.exports = Github;

