const findLastIndex = require("./findLastIndex");
const getDate = require("./getDate");

module.exports = function findLast(list, fn) {
	const idx = findLastIndex(list, fn);
	if(idx < 0) return -1;
	const item = list[idx];
	return getDate(item) + (idx / list.length);
}