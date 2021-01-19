const Github = require("./github");
const Travis = require("./travis");
const Config = require("./Config");
const Queue = require("promise-queue");
const once = require("./helpers/once");
const yaml = require("js-yaml");

function queueAll(queue, array, fn) {
	return Promise.all(array.map(item => queue.add(() => fn(item))));
}

class OpenBot {
	constructor(config) {
		this.config = config;
		this.github = new Github(config);
		this.travis = new Travis({
			cache: config.cache,
			simulate: config.simulate
		});
		this.configCache = Object.create(null);
	}

	getRepo(owner, repo) {
		return this.github.getRepo(owner, repo);
	}

	getIssue(owner, repo, number) {
		return this.github.getIssue(owner, repo, number)
			.then(issue => this.getRepo(owner, repo).then(repo => {
				issue.repo = repo;
				return issue;
			}))
			.then(issue => {
				issue.type = "issue";
				issue.full_name = `${owner}/${repo}#${number}`;
				return issue;
			});
	}

	getReposOfOrg(org) {
		return this.github.getReposOfOrg(org);
	}

	getIssuesForRepo(org, repo, filter) {
		return this.github.getIssuesForRepo(org, repo, filter);
	}

	getConfig(owner, repo) {
		const cacheKey = `${owner}/${repo}`;
		let cacheItem = this.configCache[cacheKey];
		if(cacheItem) return cacheItem;
		let settingsJson;
		if(this.config.overrideSettings) {
			settingsJson = Promise.resolve(this.config.overrideSettings);
		} else {
			settingsJson = this.github.getBlob(owner, repo, "/open-bot.yaml")
				.catch(() => this.github.getBlob(owner, repo, "/open-bot.yml"))
				.then(blob => Buffer.from(blob.content, "base64").toString("utf-8"))
				.then(content => yaml.safeLoad(content));
		}
		return this.configCache[cacheKey] = settingsJson
			.then(config => new Config(config))
			.catch(err => {
				throw new Error(`Cannot read settings file in ${owner}/${repo}: ${err}`)
			});
	}

	process({ workItems, reporter = () => {}, simulate = false, issueFilter = {} }) {
		const queue = new Queue(10);
		const FETCH_ACTION = "fetch config and data";
		const PROCESS_ACTION = "process issue";
		workItems.forEach(({ full_name }) => reporter({
			item: full_name,
			action: FETCH_ACTION,
			change: "queued"
		}));
		return queueAll(queue, workItems, workItem => {
			reporter({
				item: workItem.full_name,
				action: FETCH_ACTION,
				change: "start"
			});
			if(workItem.type === "issue") {
				return this.getConfig(workItem.repo.owner.login, workItem.repo.name)
					.then(config => [{
						config,
						repo: workItem.repo,
						issue: workItem
					}])
					.then(workItems => {
						reporter({
							item: workItem.full_name,
							action: FETCH_ACTION,
							change: "done"
						});
						return workItems;
					})
					.catch(err => {
						reporter({
							item: workItem.full_name,
							error: "Failed to process work item: " + err,
							stack: err.stack
						});
						return [];
					});
			}
			const repo = workItem;
			const config = this.getConfig(repo.owner.login, repo.name);
			return config
				.then(config => {
					if(config.bot !== this.config.user)
						throw new Error("Reject to process repo of different bot user (config.bot property)");
					return this.github.getIssuesForRepo(repo.owner.login, repo.name, issueFilter)
						.then(issues => {
							reporter({
								item: workItem.full_name,
								action: FETCH_ACTION,
								change: "done"
							});
							return issues.map(issue => ({
								config,
								repo,
								issue
							}));
						});
				})
				.catch(err => {
					reporter({
						item: workItem.full_name,
						error: "Failed to process work item: " + err,
						stack: err.stack
					});
					return [];
				});
		})
			.then(issuesLists => issuesLists.reduce((list, item) => list.concat(item), []))
			.then(issues => {
				issues.forEach(({ repo: { full_name }, issue: { number }}) => reporter({
					item: full_name + "#" + number,
					action: PROCESS_ACTION,
					change: "queued"
				}));
				return queueAll(queue, issues, ({ config, repo, issue }) => {
					reporter({
						item: repo.full_name + "#" + issue.number,
						action: PROCESS_ACTION,
						change: "start"
					});
					return this.processIssueWithData({
						config,
						owner: repo.owner.login,
						repo: repo.name,
						issue,
						reporter,
						simulate
					})
						.then(() => {
							reporter({
								item: repo.full_name + "#" + issue.number,
								action: PROCESS_ACTION,
								change: "done"
							});
						})
						.catch(err => {
							reporter({
								item: repo.full_name + "#" + issue.number,
								error: "Failed to process work item: " + err,
								stack: err.stack
							});
						});
				});
			});
	}

	processIssue({ owner, repo, number, reporter = () => {}, simulate = false }) {
		return this.getConfig(owner, repo).catch(err => null).then(config => {
			if(!config) {
				reporter({
					item: `${owner}/${repo}#${number}`,
					action: "skip (no config)"
				});
				return;
			}
			if(config.bot !== this.config.user) {
				reporter({
					item: `${owner}/${repo}#${number}`,
					action: "skip (different bot user)"
				});
				return;
			}
			return this.github.getIssue(owner, repo, number).then(issue => {
				return this.processIssueWithData({ config, owner, repo, issue, reporter, simulate });
			});
		});
	}

	processIssueWithData({ config, owner, repo, issue, reporter = () => {}, simulate = false }) {
		Object.defineProperty(issue, "timeline", {
			get: once(() => this.github.getEventsForIssue(owner, repo, issue.number))
		});
		Object.defineProperty(issue, "comments", {
			get: once(() => this.github.getCommentsForIssue(owner, repo, issue.number))
		});
		Object.defineProperty(issue, "pull_request_info", {
			get: once(() => issue.pull_request ? this.github.getPullRequest(owner, repo, issue.number) : Promise.resolve(null))
		});
		Object.defineProperty(issue, "pull_request_commits", {
			get: once(() => issue.pull_request ? this.github.getCommitsForPullRequest(owner, repo, issue.number) : Promise.resolve([]))
		});
		Object.defineProperty(issue, "pull_request_reviews", {
			get: once(() => issue.pull_request ? this.github.getReviewsForPullRequest(owner, repo, issue.number) : Promise.resolve([]))
		});
		Object.defineProperty(issue, "pull_request_statuses", {
			get: once(() => {
				if(!issue.pull_request) return Promise.resolve([]);
				return issue.pull_request_info.then(info => {
					if(!info.head || !info.head.sha) return [];
					return this.github.getStatuses(owner, repo, info.head.sha)
						.then(statuses => statuses.reverse());
				});
			})
		});
		Object.defineProperty(issue, "pull_request_checks", {
			get: once(() => {
				if(!issue.pull_request) return Promise.resolve([]);
				return issue.pull_request_info.then(info => {
					if(!info.head || !info.head.sha) return [];
					return this.github.getChecks(owner, repo, info.head.sha)
						.then(checks => checks.check_runs.sort((a, b) => {
							const aTime = Math.max(+new Date(a.completed_at || 0), +new Date(a.started_at || 0));
							const bTime = Math.max(+new Date(b.completed_at || 0), +new Date(b.started_at || 0));
							if(aTime > bTime) return 1;
							if(bTime > aTime) return -1;
							return 0;
						}));
				});
			})
		});
		Object.defineProperty(issue, "travis_jobs", {
			get: once(() => issue.pull_request_statuses.then(pull_request_statuses => {
				const travisStatuses = pull_request_statuses.filter(status => status.context === "continuous-integration/travis-ci/pr");
				if(travisStatuses.length === 0) return [];
				const travisStatus = travisStatuses[travisStatuses.length - 1];
				const match = /^https:\/\/travis-ci\.org\/.+builds\/(\d+)/.exec(travisStatus.target_url);
				if(!match) return [];
				const buildId = match[1];
				return this.travis.getBuild(buildId)
					.then(buildData => {
						return buildData.jobs.map(jobData => {
							const job = Object.assign({}, jobData);
							Object.defineProperty(job, "log", {
								get: once(() => this.travis.getLog(job.id))
							});
							Object.defineProperty(job, "rawLog", {
								get: once(() => this.travis.getRawLog(job.id))
							});
							return job;
						});
					});
			}))
		});
		return config.run({
			owner,
			repo,
			item: `${owner}/${repo}#${issue.number}`,
			github: this.github,
			travis: this.travis,
			botUsername: this.config.user,
			data: {},
			reporter,
			simulate
		}, issue);
	}
}

module.exports = OpenBot;
