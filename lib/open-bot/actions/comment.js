const findLast = require("../helpers/findLast");
const findLastIndex = require("../helpers/findLastIndex");
const interpolate = require("../helpers/interpolate");

class CommentAction {
	constructor(options) {
		this.identifier = undefined;
		this.edit = false;
		this.message = undefined;
		if(typeof options === "string") {
			this.message = options;
		} else {
			if(typeof options.message === "string")
				this.message = options.message;
			if(typeof options.identifier === "string")
				this.identifier = options.identifier;
			if(typeof options.edit === "boolean")
				this.edit = options.edit;
		}
	}

	findLast(context, issue) {
		const { botUsername } = context;
		const { timeline } = issue;
		const msg = interpolate(this.message, { context, issue, identifier: this.identifier });
		return timeline.then(timeline => {
			const last = timeline[timeline.length - 1];
			if(last &&
				last.event === "commented" &&
				last.actor.login === botUsername &&
				last.body === msg) {
				return Infinity;
			}
			return findLast(timeline, event => {
				return event.event === "commented" &&
					event.actor.login === botUsername &&
					event.body === msg;
			});
		});
	}

	run(context, issue) {
		const { owner, repo, item, github, reporter, botUsername } = context;
		const { number, comments } = issue;
		const msg = this.message && interpolate(this.message, { context, issue, identifier: this.identifier });
		const addComment = () => {
			if(msg) {
				reporter({ item, action: "add comment", message: msg });
				return github.createComment(owner, repo, number, msg);
			}
		}
		if(this.identifier) {
			return comments.then(comments => {
				const idx = findLastIndex(comments, ({ user: { login } = {}, body }) =>
					login === botUsername && body.indexOf(`<!-- identifier: ${this.identifier} -->`) === 0
				);
				if(idx < 0) {
					return addComment();
				} else if(!msg) {
					reporter({ item, action: "remove comment" });
					return github.deleteComment(owner, repo, comments[idx].id);
				} else if(this.edit) {
					reporter({ item, action: "edit comment", message: msg });
					return github.editComment(owner, repo, comments[idx].id, msg);
				} else {
					reporter({ item, action: "readd comment", message: msg });
					return github.deleteComment(owner, repo, comments[idx].id)
						.then(() => github.createComment(owner, repo, number, msg));
				}
			});
		} else {
			return addComment();
		}
	}
}

module.exports = CommentAction;
