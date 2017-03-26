module.exports = function once(factory) {
	let result;
	return () => {
		if(result) return result;
		return result = factory();
	}
};