const interpolate = require("../helpers/interpolate");

class StringCleanupFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.value = options.value;
		if(Array.isArray(options.remove))
			this.remove = options.remove.map(item => new RegExp(item, "gi"));
		else
			this.remove = [new RegExp(options.remove, "gi")];
	}

	findLast(context, issue) {
		let value = interpolate(this.value, { context, issue });
		this.remove.forEach(item => {
			value = value.replace(item, "");
		});
		if(this.id) {
			context.data[this.id] = value;
		}
		return 1;
	}
}

module.exports = StringCleanupFilter;
