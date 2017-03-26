module.exports = function findLastIndex(array, fn) {
	for(let i = array.length - 1; i >= 0; i--) {
		if(fn(array[i], i, array))
			return i;
	}
	return -1;
}