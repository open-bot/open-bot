const fs = require("fs");
const path = require("path");
const prompt = require("prompt");
const argv = require("minimist")(process.argv.slice(2));
const OpenBot = require("../open-bot/open-bot");
const yaml = require("js-yaml");

const configPath = path.resolve("config.json");

if(argv._.length < 1)
	helpCommand();
else {
	const command = argv._.shift().toLowerCase();

	switch(command) {
		case "configurate":
			configurateCommand();
			break;
		case "process":
			processCommand();
			break;
		default:
			helpCommand();
			break;
	}
}

function helpCommand() {
	console.log("open-bot help: Display help");
	console.log("open-bot configurate: Ask questions to create a configuration file");
	console.log("open-bot process <org>[/<repo>] <org>[/<repo>]: Start/Continue processing repos and organizations");
	console.log("  --simulate: Don't do modifications, only simulate actions");
	console.log("  --settings: Override repo settings with this settings file");
	console.log("  --since: Only process issues/PRs updated since this date");
	console.log("  --state: Only process issues/PRs with this state (open/closed)");
	console.log("  --label: Only process issues/PRs with this label");
	//console.log("open-bot server: Start server listening to webhooks which are processed");
}

function displayError(err) {
	console.error(err.stack);
	console.error(err);
	process.exit(1);
}

function configurateCommand() {
	loadConfig()
		.then((config) => promptConfig(config))
		.then(config => new Promise((resolve, reject) => {
			fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8", err => {
				if(err) return reject(err);
				resolve();
			});
		}))
		.catch(displayError);

	function promptConfig(defaults) {
		const schema = {
			properties: {
				user: {
					description: "Github bot user name",
					type: "string",
					pattern: /^[^\s]+$/,
					default: defaults && defaults.user || undefined,
					required: true
				},
				token: {
					description: "OAuth token for user",
					type: "string",
					default: defaults && defaults.token || undefined,
					required: true
				},
				cache: {
					description: "Cache directory for caching",
					type: "string",
					default: defaults && defaults.cache || ".cache",
					required: true,
					before: value => path.resolve(value)
				},
				awsAccountId: {
					description: "AWS accout id",
					type: "string"
				}
			}
		};

		return new Promise((resolve, reject) => {
			prompt.get(schema, (err, result) => {
				if(err) return reject(err);
				resolve(result);
			});
		});
	}
}

function processCommand() {
	loadConfig()
		.then(config => {
			if(argv.settings) {
				const file = new Promise((resolve, reject) => {
					fs.readFile(path.resolve(argv.settings), "utf-8", (err, content) => {
						if(err) return reject(err);
						resolve(new Promise((resolve) => {
							resolve(yaml.safeLoad(content));
						}));
					});
				});
				return file.then(settings => {
					config.overrideSettings = settings;
					return config;
				});
			}
			return config;
		})
		.then(config => {
			if(argv.simulate)
				config.simulate = argv.simulate;
			return config;
		})
		.then(config => {
			if(!config) throw new Error("No configuration file. Run 'open-bot configurate'.");
			const openBot = new OpenBot(config);
			const items = argv._;
			const start = new Date();
			return Promise.all(items.map(item => {
				const idx = item.indexOf("/");
				if(idx >= 0) {
					const idx2 = item.indexOf("#");
					if(idx2 >= 0) {
						return openBot.getIssue(item.substr(0, idx), item.substr(idx + 1, idx2 - idx - 1), +item.substr(idx2 + 1));
					} else {
						return openBot.getRepo(item.substr(0, idx), item.substr(idx + 1));
					}
				} else {
					return openBot.getReposOfOrg(item);
				}
			}))
				.then(workItems => workItems.reduce((list, item) => list.concat(item), []))
				.then(workItems => {
					console.log("Bot will try to process these items:");
					workItems.forEach(repo => {
						console.log(" * " + repo.full_name);
					});
					return workItems;
				})
				.then(workItems => {
					const { reporter, finish } = createReporter(argv.debug);
					return openBot.process({
						workItems,
						reporter,
						issueFilter: {
							since: argv.since && new Date(argv.since).toISOString(),
							state: argv.state,
							labels: argv.label
						}
					})
						.then(() => {
							finish();
						});
				})
				.then(() => {
					const end = new Date();
					console.log(`Finished at ${end.toLocaleString()} in ${Math.round((end.getTime() - start.getTime()) / 1000)}s`);
				});

		})
		.catch(displayError);
}

function createReporter(showDebug) {
	let queuedJobs = 0;
	let activeJobs = 0;
	let completedJobs = 0;
	let lastLineLength = 0;
	let actions = [];
	let errors = [];
	const reporter = ({ item, debug, action, change, message, error, stack }) => {
		if(!showDebug && debug) return;
		if(error) {
			errors.push({
				item,
				error,
				stack
			});
		} else {
			switch(change) {
				case "queued":
					queuedJobs++;
					break;
				case "start":
					queuedJobs--;
					activeJobs++;
					break;
				case "done":
					activeJobs--;
					completedJobs++;
					break;
				default:
					actions.push({ item, action, message });
					break;
			}
			const totalJobs = completedJobs + queuedJobs + activeJobs;
			let line = `${completedJobs}/${totalJobs} completed, ${Math.floor(completedJobs / totalJobs * 100)}%, ${item} ${action}`;
			const prevLineLength = lastLineLength;
			lastLineLength = line.length;
			if(prevLineLength > lastLineLength)
				line += Array(prevLineLength - lastLineLength + 1).join(" ");
			line += debug ? "\n" : "\r";
			process.stdout.write(line);
		}
	};
	const finish = () => {
		console.log("");
		if(actions.length > 0) {
			console.log("Executed Actions:");
			actions.forEach(({ item, action, message }) => {
				console.log(` * ${item}: ${action} ${message || ""}`);
			});
			actions.length = 0;
		}
		if(errors.length > 0) {
			console.log("Errors:");
			errors.forEach(({ item, error, stack }) => {
				console.log(` * ${item}: ${error}`);
				console.log("     " + stack);
			});
			errors.length = 0;
		}
		queuedJobs = 0;
		activeJobs = 0;
		completedJobs = 0;
		lastLineLength = 0;
	};
	return { reporter, finish };
}

function loadConfig() {
	return new Promise((resolve, reject) => {
		fs.exists(configPath, exist => {
			if(!exist) return resolve(null);
			fs.readFile(configPath, "utf-8", (err, content) => {
				if(err) return reject(err);
				try {
					resolve(JSON.parse(content));
				} catch(e) {
					reject(e);
				}
			});
		});
	});
}