const AWS = require("aws-sdk");
const config = require("../../config.json");
config.cache = "/tmp/.cache";

const sns = new AWS.SNS();

module.exports = (event, context, callback) => {
	const content = JSON.parse(event.body);
	const owner = content.repository && content.repository.owner && content.repository.owner.login;
	const repo = content.repository && content.repository.name;
	const number = content.issue && content.issue.number ||
		content.pull_request && content.pull_request.number;
	const sha = content.commit && content.commit.sha;
	if(typeof owner !== "string" || !owner)
		throw new Error("[400] owner is not valid")
	if(typeof repo !== "string" || !repo)
		throw new Error("[400] repo is not valid")
	if(typeof number !== "number" && typeof sha === "string") {
		// we need to find the issue...
		const Github = require("../open-bot/github");
		const github = new Github(config);
		github.getPullRequestsForCommit(owner, repo, sha).then(prs => {
			if(prs.length === 0) return callback(new Error("[200] commit has no PR"));
			const pr = prs[0];
			console.log(`Commit is part of PR #${pr.number}`);
			publish(pr.number);
		}).catch(callback);
	} else {
		publish(number);
	}
	function publish(number) {
		if(typeof number !== "number" || !(number > 0))
			throw new Error("[400] issue_number is not valid")
		const task = {
			owner: owner,
			repo: repo,
			number: number
		};
		const params = {
			Message: JSON.stringify(task),
			TopicArn: `arn:aws:sns:us-east-1:${config.awsAccountId}:processIssue`,
		};
		console.log("Publish", params);
		sns.publish(params, (err, result) => {
			if(err) {
				console.error(err && err.stack || err);
				return callback(err);
			}
			console.log("Published", params, result);
			callback(null, {
				statusCode: 200,
				body: JSON.stringify({ message: "processing successfully enqueued" })
			});
		});
	}
};
