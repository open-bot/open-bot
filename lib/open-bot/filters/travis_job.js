const findLast = require("../helpers/findLast");
const matchRange = require("../helpers/matchRange");

class TravisJobFilter {
	constructor(options, key) {
		this.id = options.id || key;
		this.config = undefined;
		this.state = undefined;
		this.allow_failure = undefined;
		if(options.config && typeof options.config === "object") {
			this.config = Object.keys(options.config).reduce((obj, key) => {
				obj[key] = new RegExp(options.config[key], "i");
				return obj;
			});
		}
		if(typeof options.state === "string")
			this.state = new RegExp(options.state, "i");
		if(typeof options.allow_failure === "boolean")
			this.allow_failure = options.allow_failure;
	}

	findLast({ data, botUsername }, { travis_jobs }) {
		return travis_jobs.then(travis_jobs => findLast(travis_jobs, travis_job => {
			const { config, state, allow_failure } = travis_job;
			if(typeof this.allow_failure === "boolean") {
				if(this.allow_failure !== allow_failure) return false;
			}
			if(this.state) {
				if(!this.state.test(state)) return false;
			}
			if(this.config) {
				const keys = Object.keys(this.config);
				for(let key of keys) {
					if(!this.config[key].test(config[key])) return false;
				}
			}
			if(this.id)
				data[this.id] = travis_job;
			return true;
		}));
	}
}

module.exports = TravisJobFilter;
