const parseDate = require("./parseDate");

module.exports = item => {
	if(typeof item === "number") return item;
	return parseDate(item.submitted_at || item.created_at || item.finished_at || item.started_at || (item.commit && item.commit.committer && item.commit.committer.date)) || 1;
}