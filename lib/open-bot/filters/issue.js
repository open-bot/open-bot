const parseDate = require("../helpers/parseDate");

class IssueFilter {
	constructor(options) {
		this.matching = undefined;
		this.author = undefined;
		switch(typeof options) {
			case "string":
				this.matching = new RegExp(options, "i");
				break;
			case "object":
				if(options) {
					if(typeof options.matching === "string")
						this.matching = new RegExp(options.matching, "i");
					if(typeof options.author === "string")
						this.author = new RegExp(options.author, "i");
				}
				break;
		}
	}

	findLast({ botUsername }, { created_at, body, pull_request, user: { login } }) {
		const cd = parseDate(created_at);
		if(pull_request) return -cd;
		if(this.matching) {
			if(!this.matching.test(body)) return -cd;
		}
		if(this.author) {
			if(!this.author.test(login)) return -cd;
		} else {
			if(login === botUsername) return -cd;
		}
		return cd;
	}
}

module.exports = IssueFilter;
