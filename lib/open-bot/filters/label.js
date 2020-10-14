const findLast = require("../helpers/findLast");
const parseDate = require("../helpers/parseDate");

class LabelFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.labels = undefined;
		this.labelRegExp = undefined;
		if(typeof options === "string") {
			this.labels = [options];
		} else if(Array.isArray(options)) {
			this.labels = options;
		}
		if(typeof options.labelRegExp === "string")
			this.labelRegExp = new RegExp(options.labelRegExp, "i");
		if((!this.labels || this.labels.length === 0) && !this.labelRegExp)
			throw new Error("No labels specified in 'label' and no 'labelRegExp' specified");
	}

	findLast({ data, botUsername }, { created_at, labels, timeline }) {
		const labelNames = labels.map(label => label.name);
		let hasLabel = true;
		if(this.labels && !this.labels.every(label => labelNames.includes(label)))
			hasLabel = false;
		if(this.labelRegExp && !labelNames.some(label => this.labelRegExp.test(label)))
			hasLabel = false;
		return timeline.then(timeline => {
			let info = findLast(timeline, event => {
				const { event: eventType, label: { name } = {}, actor: { login } = {} } = event;
				if(eventType !== (hasLabel ? "labeled" : "unlabeled")) return false;
				if(login === botUsername) return false;
				if(this.labels && this.labels.includes(name)) return true;
				if(this.labelRegExp && this.labelRegExp.test(name)) return true;
				if(this.id) {
					data[this.id] = event;
				}
			});
			info = info < 0 ? parseDate(created_at) : info;
			return hasLabel ? info : -info;
		});
	}
}

module.exports = LabelFilter;
