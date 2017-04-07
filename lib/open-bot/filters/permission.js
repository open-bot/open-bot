const interpolate = require("../helpers/interpolate");

class PermissionFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.user = "{{issue.user.login}}";
		this.matching = /^(write|admin)$/;
		if(typeof options === "string") {
			this.matching = new RegExp(options, "i");
		} else if(options && typeof options === "object") {
			if(typeof options.user === "string")
				this.user = options.user;
			if(typeof options.matching === "string")
				this.matching = new RegExp(options.matching, "i");
		}
	}

	findLast(context, issue) {
		const user = interpolate(this.user, { context, issue });
		const { owner, repo, github } = context;
		return github.getPermissionForRepo(owner, repo, user).then(({ permission }) => {
			return this.matching.test(permission) ? 1 : -1;
		});
	}
}

module.exports = PermissionFilter;
