const parseDate = require("../helpers/parseDate");

class IssuePullRequestBaseFilter {
	constructor(options) {
		this.matching = undefined;
		this.title = undefined;
		this.author = undefined;
		this.locked = undefined;
		if(typeof options === "string") {
			this.matching = new RegExp(options, "i");
		} else if(options && typeof options === "object") {
			if(typeof options.matching === "string")
				this.matching = new RegExp(options.matching, "i");
			if(typeof options.title === "string")
				this.title = new RegExp(options.title, "i");
			if(typeof options.author === "string")
				this.author = new RegExp(options.author, "i");
			if(typeof options.locked === "boolean")
				this.locked = options.locked;
		}
	}

	findLast({ botUsername }, { created_at, body, title, locked, user: { login } }) {
		const cd = parseDate(created_at);
		if(this.matching) {
			if(!this.matching.test(body)) return -cd;
		}
		if(this.author) {
			if(!this.author.test(login)) return -cd;
		} else {
			if(login === botUsername) return -cd;
		}
		if(this.title) {
			if(!this.title.test(title)) return -cd;
		}
		if(typeof this.locked === "boolean") {
			if(this.locked !== locked) return -cd;
		}
		return cd;
	}
}

module.exports = IssuePullRequestBaseFilter;
