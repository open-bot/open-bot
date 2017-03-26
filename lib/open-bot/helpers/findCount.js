const getDate = require("./getDate");

module.exports = function findCount(array, min, max, startDate, fn) {
	if(typeof min !== "number") min = 0;
	if(typeof max !== "number") max = Infinity;
	let result = array.filter((item, i) => !fn(item, i, array)).map(getDate).reduce((a, b) => Math.min(a, b), -startDate);
	if(min <= 0) {
		result = -result;
	}
	let count = 0;
	for(let i = 0; i < array.length; i++) {
		if(fn(array[i], i, array)) {
			count++;
			if(count === min) {
				result = Math.abs(getDate(array[i]));
			}
			if(count === max + 1) {
				result = -Math.abs(getDate(array[i]));
			}
		}
	}
	return result;
}