const findLast = require("../helpers/findLast");
const matchRange = require("../helpers/matchRange");

class FetchFilter {
	constructor(options, key) {
		this.id = options.id || key;
		if(typeof options === "string")
			this.value = options;
		else
			this.value = options.value;
	}

	findLast({ data }) {
		const items = this.value.split(".");
		let current = data;
		for(let item of items) {
			if(typeof current !== "object" || !current) {
				return -1;
			}
			current = current[item];
		}
		return Promise.resolve(current).then(result => {
			if(this.id) {
				data[this.id] = result;
			}
			return 1;
		});
	}
}

module.exports = FetchFilter;
