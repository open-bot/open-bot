const AWS = require("aws-sdk");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = (event, context, callback) => {
	const now = Date.now();
	const epoch = Math.floor(now / 36000000); // 1 epoch = 10 hours

	const queryParams = {
		ExpressionAttributeNames: {
			"#item": "item",
			"#owner": "owner",
			"#repo": "repo",
			"#number": "number",
			"#schedule": "schedule",
			"#epoch": "epoch"
		},
		TableName: `open-bot-${process.env.STAGE}-schedule`,
		IndexName: `schedule-index`,
		Limit: 50,
		ProjectionExpression: "#item, #owner, #repo, #number, #schedule"
	}

	const query1 = new Promise((resolve, reject) => {
		dynamoDb.query(Object.assign({}, queryParams, {
			KeyConditionExpression: "#epoch = :epoch",
			ExpressionAttributeValues: {
				":epoch": epoch - 1,
			}
		}), (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});

	const query2 = new Promise((resolve, reject) => {
		dynamoDb.query(Object.assign({}, queryParams, {
			KeyConditionExpression: "#epoch = :epoch AND #schedule <= :now",
			ExpressionAttributeValues: {
				":epoch": epoch,
				":now": now
			}
		}), (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});

	Promise.all([query1, query2]).then(results => {
		const items = results[0].Items.concat(results[1].Items).slice(0, 50);
		console.log(`Start processing ${items.length} schedules (${results[0].Items.length} from last epoch)`);
		
		return Promise.all(items.map(item => {
			const task = {
				item: item.item,
				owner: item.owner,
				repo: item.repo,
				number: item.number
			};
			const params = {
				TableName: `open-bot-${process.env.STAGE}-queue`,
				Key: { "item": task.item },
				UpdateExpression: "set #owner = :owner, #repo = :repo, #number = :number, #trigger = :timestamp, #schedule = :timestamp",
				ExpressionAttributeNames: {
					"#owner": "owner",
					"#repo": "repo",
					"#number": "number",
					"#trigger": "trigger",
					"#schedule": "schedule"
				},
				ExpressionAttributeValues: {
					":owner": task.owner,
					":repo": task.repo,
					":number": task.number,
					":timestamp": now
				},
				ReturnValues: "ALL_NEW"
			};
			return new Promise((resolve, reject) => {
				dynamoDb.update(params, (err, result) => {
					if(err) return reject(err);
					console.log(`Task ${task.item} enqueued with ${Math.round((Date.now() - item.schedule) / 1000)}s delay`);
					resolve();
				});
			}).then(() => new Promise((resolve, reject) => {
				dynamoDb.delete({
					TableName: `open-bot-${process.env.STAGE}-schedule`,
					Key: { "item": item.item },
					ConditionExpression: "#schedule = :schedule",
					ExpressionAttributeNames: {
						"#schedule": "schedule"
					},
					ExpressionAttributeValues: {
						":schedule": item.schedule
					},
					ReturnValues: "NONE"
				}, (err, result) => {
					if(err) {
						if(err.code === "ConditionalCheckFailedException")
							return resolve();
						return reject(err);
					}
					console.log(`Schedule ${item.item} cleaned up with ${Math.round((Date.now() - item.schedule) / 1000)}s delay`);
					resolve();
				});
			}));
		})).then(() => items.length);

	}).then(numberOfItems => {
		callback(null, {
			statusCode: 200,
			body: JSON.stringify({ message: "processing successfully enqueued", numberOfItems: numberOfItems })
		});
	}).catch(err => {
		console.error(err && err.stack || err);
		callback(err);
	});
};
