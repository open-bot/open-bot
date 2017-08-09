let dynamoDbSingleton;

function getDocumentClient() {
	if(!dynamoDbSingleton) {
		const AWS = require("aws-sdk");

		dynamoDbSingleton = new AWS.DynamoDB.DocumentClient();
	}

	return dynamoDbSingleton;
}

exports.schedule = function schedule(owner, repo, number, inDuration) {
	const dynamoDb = getDocumentClient();

	const timestamp = Date.now() + inDuration;
	const epoch = Math.floor(timestamp / 36000000); // 1 epoch = 10 hours

	const item = `${owner}/${repo}#${number}`;

	const params = {
		TableName: `open-bot-${process.env.STAGE}-schedule`,
		Key: { "item": item },
		ConditionExpression: "attribute_not_exists(#schedule) OR #schedule > :timestamp",
		UpdateExpression: "set #owner = :owner, #repo = :repo, #number = :number, #schedule = :timestamp, #epoch = :epoch",
		ExpressionAttributeNames: {
			"#owner": "owner",
			"#repo": "repo",
			"#number": "number",
			"#schedule": "schedule",
			"#epoch": "epoch"
		},
		ExpressionAttributeValues: {
			":owner": owner,
			":repo": repo,
			":number": number,
			":timestamp": timestamp,
			":epoch": epoch
		},
		ReturnValues: "ALL_NEW"
	};
	return new Promise((resolve, reject) => {
		dynamoDb.update(params, (err, result) => {
			if(err) {
				if(err.code === "ConditionalCheckFailedException")
					return resolve();
				return reject(err);
			}
			resolve(result);
		});
	});
}
