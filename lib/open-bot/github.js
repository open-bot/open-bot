const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const crypto = require("crypto");
const GitHubApi = require("github");
const Queue = require("promise-queue");
const clone = require("clone");
const seq = require("./helpers/seq");

const USER_AGENT = "github.com/open-bot/open-bot";

class Github {
	constructor({ user, token, cache, simulate }) {
		this.simulate = !!simulate;
		this.api = new GitHubApi({
			version: "3.0.0"
		});
		this.api.authenticate({
			type: "oauth",
			token: token
		});
		this.queue = new Queue(30);
		this.cache = cache;
		this.cacheDirectoryExists = Object.create(null);
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

	getIssuesForRepo(owner, repo, { state = "all", since = "", labels = "" } = {}) {
		return this._fetch("issues.getForRepo", this.api.issues.getForRepo, {
			owner,
			repo,
			state,
			since,
			labels,
			sort: "updated"
		});
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
		const cacheDirectory = path.resolve(this.cache, name);
		let prepareCache;
		if(!this.cacheDirectoryExists[name]) {
			prepareCache = this.cacheDirectoryExists[name] = new Promise((resolve, reject) => {
				fs.exists(cacheDirectory, exist => {
					if(exist) return resolve();
					mkdirp(cacheDirectory, err => {
						if(err) return reject(err);
						resolve();
					});
				});
			});
		} else {
			prepareCache = this.cacheDirectoryExists[name];
		}
		return prepareCache
			.then(() => this.queue.add(() => this._fetchAll(this._cached(api, cacheDirectory), data)));
	}

	_cached(api, cacheDirectory) {
		return (data, callback) => {
			const key = JSON.stringify(data);
			const digest = crypto.createHash("md5").update(key).digest("hex");
			// we assume there is no hash conflict ;)
			const cacheFile = path.join(cacheDirectory, digest + ".json");
			const requestWithCachedData = (etag, cacheData) => {
				data.headers = {
					"user-agent": USER_AGENT,
					"if-none-match": etag
				};
				api(data, (err, res) => {
					if(err) {
						if(err.code === 304) {
							return callback(null, cacheData);
						}
						return callback(err);
					}
					if(res.meta.status === "304 Not Modified") {
						return callback(null, cacheData);
					}
					fs.writeFile(cacheFile, JSON.stringify({
						etag: res.meta.etag,
						data: res,
						meta: res.meta
					}), "utf-8", err => {
						return callback(null, res);
					});
				});
			};
			const requestWithoutCachedData = () => {
				data.headers = {
					"user-agent": USER_AGENT
				};
				api(data, (err, res) => {
					if(err) return callback(err);
					fs.writeFile(cacheFile, JSON.stringify({
						etag: res.meta.etag,
						data: res,
						meta: res.meta
					}), "utf-8", err => {
						return callback(null, res);
					});
				});
			};
			fs.exists(cacheFile, exist => {
				if(exist) {
					fs.readFile(cacheFile, "utf-8", (err, content) => {
						if(!err && content) {
							const data = JSON.parse(content);
							const etag = data.etag;
							const cacheData = data.data;
							cacheData.meta = data.meta;
							requestWithCachedData(etag, cacheData);
						} else requestWithoutCachedData();
					});
				} else requestWithoutCachedData();
			});

		}
	}

	_fetchAll(api, data) {
		data = clone(data);
		return new Promise((resolve, reject) => {
			const usePages = typeof data.per_page !== "number";
			if(usePages) {
				data.per_page = 100;
				data.page = 1;
			}
			let results = [];
			const onResult = (err, result) => {
				if(err) return reject(new Error(err));
				if(usePages && Array.isArray(result.data)) {
					const links = this._parseLinks(result.meta.link);
					result.data.forEach(res => results.push(res));
					if(links.next) {
						data.page++;
						api(clone(data), onResult);
					} else {
						resolve(results);
					}
				} else {
					resolve(result.data);
				}
			};
			api(clone(data), onResult);
		});
	}

	_parseLinks(link) {
		var re = /<([^>]+)>;\s+rel="([a-z]+)"/g;
		var links = {};
		var match;
		while(match = re.exec(link)) {
			links[match[2]] = match[1];
		}
		return links;
	}
}

module.exports = Github;

