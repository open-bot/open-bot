const actionsList = require("./actions");
const filtersList = require("./filters");
const seq = require("./helpers/seq");

class Rule {
	constructor(idx, filters, actions) {
		this.idx = idx;
		this.filters = filters;
		this.actions = actions;
	}

	static formatResult(result) {
		return `${result} = ${result < 0 ? "-" : "+"}${result ? new Date(Math.abs(result)).toLocaleString() : 0}`
	}

	run(context, issue) {
		return seq(this.filters, (filter, idx) => {
			const result = filter.findLast(context, issue);
			return Promise.resolve(result).then(result => {
				context.reporter({
					item: context.item,
					debug: true,
					action: `filter ${this.idx}.${idx}`,
					message: Rule.formatResult(result)
				});
				return result;
			});
		}, result => result < 0)
			.then(filterResults => {
				const isMatched = filterResults.every(r => r >= 0);
				if(isMatched) {
					const max = filterResults.reduce((max, i) => Math.max(max, i), -1);
					context.reporter({
						item: context.item,
						debug: true,
						action: `run actions ${this.idx}`,
						message: Rule.formatResult(max)
					});
					return this.runActions(context, issue, max);
				}
				return filterResults;
			});
	}

	runActions(context, issue, lastFilterImpuls) {
		return seq(this.actions, (action, idx) => {
			return Promise.resolve(action.findLast(context, issue))
				.then(pos => {
					context.reporter({
						item: context.item,
						debug: true,
						action: `action ${this.idx}.${idx}`,
						message: Rule.formatResult(pos)
					});
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
		this.rules = configJson.rules.map((rule, idx) => Config.parseRule(rule, idx));
		this.bot = configJson.bot;
	}

	static parseRule(ruleJson, idx) {
		const filters = this.parseItems(ruleJson.filters, filtersList);
		const actions = this.parseItems(ruleJson.actions, actionsList);
		return new Rule(idx, filters, actions);
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
