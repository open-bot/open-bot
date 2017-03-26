const actionsList = require("./actions");
const filtersList = require("./filters");
const seq = require("./helpers/seq");

class Rule {
	constructor(filters, actions) {
		this.filters = filters;
		this.actions = actions;
	}

	run(context, issue) {
		return seq(this.filters, filter => filter.findLast(context, issue), result => result < 0)
			.then(filterResults => {
				const isMatched = filterResults.every(r => r >= 0);
				if(isMatched) {
					const max = filterResults.reduce((max, i) => Math.max(max, i), -1);
					return this.runActions(context, issue, max);
				}
				return filterResults;
			});
	}

	runActions(context, issue, lastFilterImpuls) {
		return seq(this.actions, action => {
			return Promise.resolve(action.findLast(context, issue))
				.then(pos => {
					if(pos < lastFilterImpuls) {
						return Promise.resolve(action.run(context, issue))
							.then(() => "activated")
							.catch(err => {
								context.reporter({
									item: context.item,
									error: action.constructor.name + " failed: " + err
								});
								return "errored";
							});
					}
					return "already done";
				});
		});
	}
}

class Config {
	constructor(configJson) {
		this.rules = configJson.rules.map(rule => Config.parseRule(rule));
		this.bot = configJson.bot;
	}

	static parseRule(ruleJson) {
		const filters = this.parseItems(ruleJson.filters, filtersList);
		const actions = this.parseItems(ruleJson.actions, actionsList);
		return new Rule(filters, actions);
	}

	static parseItems(data, types) {
		if(!data) return [];
		return Array.isArray(data) ?
			data.map(item => this.parseItem(item, null, types)) :
			Object.keys(data).map(key => this.parseItem(data[key], key.replace(/_\d+$/, ""), types, key))
	}

	static parseItem(data, type, types, key) {
		const typeName = type || data.type;
		const Type = types[typeName];
		if(!Type) throw new Error(`'${typeName} is not a valid type`);
		return new Type(data, key);
	}

	run(context, issue) {
		return seq(this.rules, rule => rule.run(context, issue));
	}
}

module.exports = Config;
