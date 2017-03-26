const findLast = require("../helpers/findLast");

class StatusFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.matching = undefined;
		this.state = undefined;
		this.context = undefined;
		if(typeof options === "string") {
			this.matching = new RegExp(options, "i");
		} else if(typeof options === "object") {
			if(typeof options.matching === "string")
				this.matching = new RegExp(options.matching, "i");
			if(typeof options.state === "string")
				this.state = new RegExp(options.state, "i");
			if(typeof options.context === "string")
				this.context = new RegExp(options.context, "i");
		}
	}

	findLast({ botUsername, data }, { pull_request_statuses }) {
		return pull_request_statuses.then(pull_request_statuses => {
			return findLast(pull_request_statuses, (status) => {
				const { state, context, description, creator: { login } = {} } = status;
				if(login === botUsername) return false;
				if(this.matching) {
					if(!this.matching.test(description)) return false;
				}
				if(this.state) {
					if(!this.state.test(state)) return false;
				}
				if(this.context) {
					if(!this.context.test(context)) return false;
				}
				if(this.id) {
					data[this.id] = status;
				}
				return true;
			});
		});
	}
}

module.exports = StatusFilter;