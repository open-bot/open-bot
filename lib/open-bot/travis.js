const Queue = require("promise-queue");
const ApiUtils = require("./api-utils");
const request = require("request");

const travisUrl = "https://api.travis-ci.org/";

const travisRequest = (url, method, headers, body, callback) => {
	if(typeof body === "object") {
		body = JSON.stringify(body);
	}
	const options = {
		headers: Object.assign({
			accept: "application/vnd.travis-ci.2+json"
		}, headers),
		method,
		url: travisUrl + url,
		body
	};
	request(options, (err, res) => {
		if(err) return callback(err);
		if(res.statusCode >= 400) {
			return callback(res.body || res.statusCode);
		}
		const resBody = res.headers["content-type"] && res.headers["content-type"].indexOf("application/json") >= 0 ? JSON.parse(res.body) : res.body;
		callback(null, { 
			meta: {
				status: res.statusCode,
				etag: res.headers["etag"],
				link: res.headers["link"]
			},
			data: resBody
		});
	});
}

const travisGetBuild = (data, cb) => travisRequest(`builds/${data.id}`, "GET", data.headers, null, cb);
const travisGetLog = (data, cb) => travisRequest(`jobs/${data.id}/log`, "GET", Object.assign({ accept: "text/plain" }, data.headers), null, cb);

class Travis {
	constructor({ simulate, cache }) {
		this.simulate = !!simulate;
		this.apiUtils = new ApiUtils({ cache });
	}

	getBuild(id) {
		return this._fetch("travis-build", travisGetBuild, { id });
	}

	getRawLog(id) {
		return this._fetch("travis-log", travisGetLog, { id });
	}

	getLog(id) {
		return this._fetch("travis-log", travisGetLog, { id })
			.then(log => log
				.replace(/travis_fold:start:(.+)[\r\n](.+)[\r\n][\s\S]+?travis_fold:end:\1/g, "$2 [...]")
				.replace(/travis_time:(start|end):.+[\r\n]/g, "")
				.replace(/\u001b\[[\d;]+m|\u001b\[0K/g, "")
				.replace(/\r+\n?/g, "\n")
				.trim()
			)
	}

	_fetch(name, api, data) {
		return this.apiUtils.fetch(name, api, data);
	}
}

module.exports = Travis;