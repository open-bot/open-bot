const findLast = require("../helpers/findLast");

class CommentFilter {
	constructor(options, key) {
		this.id = options.id || key;
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

	findLast({ data, botUsername }, { timeline }) {
		return timeline.then(timeline => findLast(timeline, event => {
			const { event: eventType, actor: { login } = {}, body } = event;
			if(eventType !== "commented") return false;

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
		}));
	}
}

module.exports = CommentFilter;
