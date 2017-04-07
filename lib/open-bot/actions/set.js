const findLast = require("../helpers/findLast");

class SetAction {
	constructor(options) {
		this.id = options.id;
		this.value = options.value;
	}

	findLast() {
		return -1;
	}

	run(context, issue) {
		const value = interpolate(this.value, { context, issue });
		reporter({ item, action: "set", message: `${this.id} = ${value}` });
		context.data[this.id] = value;
		return Promise.resolve();
	}
}

module.exports = SetAction;
