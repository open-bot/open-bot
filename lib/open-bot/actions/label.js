const findLast = require("../helpers/findLast");

class LabelAction {
	constructor(options) {
		this.add = undefined;
		this.remove = undefined;
		if(typeof options === "string") {
			this.add = [options];
		} else if(Array.isArray(options)) {
			this.add = options;
		} else {
			if(typeof options.add === "string" || Array.isArray(options.add))
				this.add = [].concat(options.add);
			if(typeof options.remove === "string" || Array.isArray(options.remove))
				this.remove = [].concat(options.remove);
		}
	}

	findLast({ botUsername }, { timeline, labels }) {
		const labelNames = labels.map(label => label.name);
		if((!this.add || this.add.every(l => labelNames.includes(l))) &&
			(!this.remove || this.remove.every(l => !labelNames.includes(l))))
			return Infinity;
		return timeline.then(timeline => findLast(timeline, event => {
			if(this.add &&
				event.event === "labeled" &&
				event.actor.login === botUsername &&
				this.add.includes(event.label.name))
				return true;
			if(this.remove &&
				event.event === "unlabeled" &&
				event.actor.login === botUsername &&
				this.remove.includes(event.label.name))
				return true;
			return false;
		}));
	}

	run({ owner, repo, item, github, reporter }, { number, labels }) {
		const labelNames = labels.map(label => label.name);
		const add = this.add && this.add.filter(l => !labelNames.includes(l));
		const remove = this.remove && this.remove.filter(l => labelNames.includes(l));
		reporter({ item, action: [
			add && add.length && "add labels " + add.join(" "),
			remove && remove.length && "remove labels " + remove.join(" "),
		].filter(Boolean).join(", ")})
		return Promise.all([
			add && github.addLabels(owner, repo, number, add),
			remove && github.removeLabels(owner, repo, number, remove)
		].filter(Boolean));
	}
}

module.exports = LabelAction;
