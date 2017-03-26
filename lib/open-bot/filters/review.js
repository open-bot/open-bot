const findLast = require("../helpers/findLast");

class ReviewFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.matching = undefined;
		this.state = undefined;
		this.author = undefined;
		this.upToDate = undefined;
		switch(typeof options) {
			case "string":
				this.matching = new RegExp(options, "i");
				break;
			case "object":
				if(options) {
					if(typeof options.matching === "string")
						this.matching = new RegExp(options.matching, "i");
					if(typeof options.state === "string")
						this.state = new RegExp(options.state, "i");
					if(typeof options.author === "string")
						this.author = new RegExp(options.author, "i");
					if(typeof options.upToDate === "boolean")
						this.upToDate = options.upToDate;
				}
				break;
		}
	}

	findLast({ data, botUsername }, { pull_request_info, pull_request_reviews }) {
		return pull_request_info.then(pull_request_info => 
			pull_request_reviews.then(timeline => findLast(timeline, event => {
			const { commit_id, user: { login } = {}, body, state } = event;

			if(typeof this.upToDate === "boolean") {
				const isUpToDate = pull_request_info.head.sha === commit_id;
				if(this.upToDate !== isUpToDate) return false;
			}
			if(this.state) {
				if(!this.state.test(state)) return false;
			}
			if(this.matching) {
				if(!this.matching.test(body)) return false;
			}
			if(this.author) {
				if(!login || !this.author.test(login)) return false;
			} else {
				if(login === botUsername) return false;
			}
			if(this.id)
				data[this.id] = event;
			return true;
		})));
	}
}

module.exports = ReviewFilter;
