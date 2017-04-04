const AWS = require("aws-sdk");
const config = require("../../config.json");
config.cache = "/tmp/.cache";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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
		console.log(`${owner}/${repo}#${sha}`);
		const Github = require("../open-bot/github");
		const github = new Github(config);
		github.getPullRequestForCommit(owner, repo, sha).then(pr => {
			if(!pr) {
				console.log("PR not found");
				return callback(null, {
					statusCode: 200,
					body: JSON.stringify({ message: "nothing to do: commit has no PR" })
				});
			}
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
			item: `${owner}/${repo}#${number}`,
			owner: owner,
			repo: repo,
			number: number
		};
		console.log(task.item);
		const params = {
			TableName: `open-bot-${process.env.STAGE}-queue`,
			Key: { "item": task.item },
			UpdateExpression: "set #owner = :owner, #repo = :repo, #number = :number, #trigger = :timestamp, #event = :timestamp",
			ExpressionAttributeNames: {
				"#owner": "owner",
				"#repo": "repo",
				"#number": "number",
				"#trigger": "trigger",
				"#event": "event"
			},
			ExpressionAttributeValues: {
				":owner": task.owner,
				":repo": task.repo,
				":number": task.number,
				":timestamp": new Date().getTime()
			},
			ReturnValues: "ALL_NEW"
		};
		console.log("Update", params);
		dynamoDb.update(params, (err, result) => {
			if(err) {
				console.error(err && err.stack || err);
				return callback(err);
			}
			console.log("Updated", params, result);
			callback(null, {
				statusCode: 200,
				body: JSON.stringify({ message: "processing successfully enqueued", item: task.item })
			});
		});
	}
};
