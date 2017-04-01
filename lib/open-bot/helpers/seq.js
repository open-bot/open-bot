module.exports = function seq(arr, fn, breakCondition) {
	let breaked = false;
	let i = 0;
	return arr.reduce(
		(p, item) => p
			.then((arr) => breaked ? arr : Promise.resolve(fn(item, i++))
				.then(res => {
					if(breakCondition && breakCondition(res))
						breaked = true;
					return res;
				})
				.then(res => arr.concat([res]))
			),
		Promise.resolve([])
	);
};