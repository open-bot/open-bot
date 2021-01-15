const findLast = require("../helpers/findLast");

class CheckFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.matching = undefined;
		this.conclusion = undefined;
		this.name = undefined;
		if(typeof options === "string") {
			this.matching = new RegExp(options, "i");
		} else if(typeof options === "object") {
			if(typeof options.matching === "string")
				this.matching = new RegExp(options.matching, "i");
			if(typeof options.conclusion === "string")
				this.conclusion = new RegExp(options.conclusion, "i");
			if(typeof options.name === "string")
				this.name = new RegExp(options.name, "i");
		}
	}

	findLast({ botUsername, data }, { pull_request_checks }) {
		return pull_request_checks.then(pull_request_checks => {
			return findLast(pull_request_checks, (check) => {
				const { conclusion, name, output: { title } = {}, creator: { login } = {} } = check;
				if(login === botUsername) return false;
				if(this.matching) {
					if(!this.matching.test(title)) return false;
				}
				if(this.conclusion) {
					if(!this.conclusion.test(conclusion)) return false;
				}
				if(this.name) {
					if(!this.name.test(name)) return false;
				}
				if(this.id) {
					data[this.id] = check;
				}
				return true;
			});
		});
	}
}

module.exports = CheckFilter;