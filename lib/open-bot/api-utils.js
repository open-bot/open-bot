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
		return (data, callback) => {
			const key = JSON.stringify(data);
			const digest = crypto.createHash("md5").update(key).digest("hex");
			// we assume there is no hash conflict ;)
			const cacheFile = path.join(cacheDirectory, digest + ".json");
			const requestWithCachedData = (etag, cacheData) => {
				data.headers = {
					"user-agent": USER_AGENT,
					"if-none-match": etag
				};
				api(data, (err, res) => {
					if(err) {
						if(err.code === 304) {
							return callback(null, cacheData);
						}
						return callback(err);
					}
					if(res.meta.status === "304 Not Modified" || res.meta.status === 304) {
						return callback(null, cacheData);
					}
					fs.writeFile(cacheFile, JSON.stringify({
						etag: res.meta.etag,
						data: res,
						meta: res.meta
					}), "utf-8", err => {
						return callback(null, res);
					});
				});
			};
			const requestWithoutCachedData = () => {
				data.headers = {
					"user-agent": USER_AGENT
				};
				api(data, (err, res) => {
					if(err) return callback(err);
					fs.writeFile(cacheFile, JSON.stringify({
						etag: res.meta.etag,
						data: res,
						meta: res.meta
					}), "utf-8", err => {
						return callback(null, res);
					});
				});
			};
			fs.exists(cacheFile, exist => {
				if(exist) {
					fs.readFile(cacheFile, "utf-8", (err, content) => {
						if(!err && content) {
							try {
								const data = JSON.parse(content);
								const etag = data.etag;
								const cacheData = data.data;
								cacheData.meta = data.meta;
								return requestWithCachedData(etag, cacheData);
							} catch(e) {
								err = e;
							}
						}
						return requestWithoutCachedData();
					});
				} else requestWithoutCachedData();
			});

		}
	}

	_fetchAll(api, data) {
		data = clone(data);
		return new Promise((resolve, reject) => {
			const usePages = typeof data.per_page !== "number";
			if(usePages) {
				data.per_page = 100;
				data.page = 1;
			}
			let results = [];
			const onResult = (err, result) => {
				if(err) return reject(new Error(err));
				if(usePages && Array.isArray(result.data) && result.meta && result.meta.link) {
					const links = this._parseLinks(result.meta.link);
					result.data.forEach(res => results.push(res));
					if(links.next) {
						data.page++;
						api(clone(data), onResult);
					} else {
						resolve(results);
					}
				} else {
					resolve(result.data);
				}
			};
			api(clone(data), onResult);
		});
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
