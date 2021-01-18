const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const crypto = require("crypto");
const Queue = require("promise-queue");
const clone = require("clone");

const USER_AGENT = "github.com/open-bot/open-bot";

class ApiUtils {
	constructor({ cache }) {
		this.cache = cache;
		this.queue = new Queue(30);
		this.cacheDirectoryExists = Object.create(null);
	}

	prepareCache(name, cacheDirectory) {
		if(!this.cacheDirectoryExists[name]) {
			return this.cacheDirectoryExists[name] = new Promise((resolve, reject) => {
				fs.exists(cacheDirectory, exist => {
					if(exist) return resolve();
					mkdirp(cacheDirectory, err => {
						if(err) return reject(err);
						resolve();
					});
				});
			});
		} else {
			return this.cacheDirectoryExists[name];
		}
	}

	fetch(name, api, data) {
		const cacheDirectory = path.resolve(this.cache, name);
		return this.prepareCache(name, cacheDirectory)
			.then(() => this.queue.add(() => this._fetchAll(this.cached(api, cacheDirectory), data)));
	}

	fetchAll(name, api, data) {
		const cacheDirectory = path.resolve(this.cache, name);
		return this.prepareCache(name, cacheDirectory)
			.then(() => this.queue.add(() => this._fetchAll(this.cached(api, cacheDirectory), data)));
	}

	cached(api, cacheDirectory) {
		return (data) => {
			const key = JSON.stringify(data);
			const digest = crypto.createHash("md5").update(key).digest("hex");
			// we assume there is no hash conflict ;)
			const cacheFile = path.join(cacheDirectory, digest + ".json");
			const requestWithCachedData = (etag, cacheData) => {
				data.headers = {
					"user-agent": USER_AGENT,
					"if-none-match": etag
				};
				api(data).then(res => {
					if(res.status === "304 Not Modified" || res.status === 304) {
						return cacheData;
					}
					return new Promise(resolve => fs.writeFile(cacheFile, JSON.stringify({
						etag: res.headers.etag,
						data: res.data,
						headers: res.headers
					}), "utf-8", err => {
						return resolve(res);
					}));
				}, err => {
					if(err.code === 304) {
						return cacheData;
					}
					throw err;
				});
			};
			const requestWithoutCachedData = () => {
				data.headers = {
					"user-agent": USER_AGENT
				};
				return api(data).then(res => new Promise(resolve => {
					fs.writeFile(cacheFile, JSON.stringify({
						etag: res.headers.etag,
						data: res.data,
						headers: res.headers
					}), "utf-8", err => {
						return resolve(res);
					});
				}));
			};
			return new Promise((resolve, reject) => {
				fs.exists(cacheFile, exist => {
					if(exist) {
						fs.readFile(cacheFile, "utf-8", (err, content) => {
							if(!err && content) {
								try {
									const data = JSON.parse(content);
									return resolve(requestWithCachedData(etag, data));
								} catch(e) {
									err = e;
								}
							}
							return resolve(requestWithoutCachedData());
						});
					} else resolve(requestWithoutCachedData());
				});
			});
		}
	}

	_fetchAll(api, data) {
		data = clone(data);
		const usePages = typeof data.per_page !== "number";
		if(usePages) {
			data.per_page = 100;
			data.page = 1;
		}
		let results = [];
		const onResult = (result) => {
			if(usePages && Array.isArray(result.data) && result.headers && result.headers.link) {
				const links = this._parseLinks(result.headers.link);
				result.data.forEach(res => results.push(res));
				if(links.next) {
					data.page++;
					return api(clone(data)).then(onResult);
				} else {
					return results;
				}
			} else {
				return result.data;
			}
		};
		return api(clone(data)).then(onResult);
	}

	_fetch(api, data) {
		return new Promise((resolve, reject) => {
			api(data, (err, result) => {
				if(err) return reject(new Error(err));
				resolve(result.data);
			});
		});
	}

	_parseLinks(link) {
		var re = /<([^>]+)>;\s+rel="([a-z]+)"/g;
		var links = {};
		var match;
		while(match = re.exec(link)) {
			links[match[2]] = match[1];
		}
		return links;
	}
}

module.exports = ApiUtils;
