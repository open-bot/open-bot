const findLast = require("../helpers/findLast");

class CommitFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.matching = undefined;
		this.author = undefined;
		this.committer = undefined;
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
					if(typeof options.committer === "string")
						this.committer = new RegExp(options.committer, "i");
				}
				break;
		}
	}

	findLast({ data, botUsername }, { pull_request_commits }) {
		return pull_request_commits.then(commits => findLast(commits, event => {
			const { committer: comitterObject, author: authorObject, commit: { message } = {} } = event;
			const { login: committer } = comitterObject || {};
			const { login: author } = authorObject || {};

			if(this.matching) {
				if(!this.matching.test(message)) return false;
			}
			if(this.author) {
				if(!author || !this.author.test(author)) return false;
			}
			if(this.committer) {
				if(!committer || !this.committer.test(committer)) return false;
			} else {
				if(committer === botUsername) return false;
			}
			if(this.id)
				data[this.id] = event;
			return true;
		}));
	}
}

module.exports = CommitFilter;
