module.exports = function matchRange(range, value) {
	if(typeof range === "number") {
		return value >= range;
	} else if(typeof range === "string") {
		const parts = range.split(",");
		if(parts.length > 1) {
			return parts.some(part => matchRange(part, value));
		}
		const regex = /(<|<=|>|>=|==|!=)\s*(\d+)|(\d+)\s*-\s*(\d+)/g;
		let match;
		do {
			match = regex.exec(range);
			if(!match) return true;
			if(match[1]) {
				const cmp = +match[2];
				switch(match[1]) {
					case "<":
						if(value >= cmp) return false;
						break;
					case "<=":
						if(value > cmp) return false;
						break;
					case ">":
						if(value <= cmp) return false;
						break;
					case ">=":
						if(value > cmp) return false;
						break;
					case "==":
						if(value !== cmp) return false;
						break;
					case "!=":
						if(value === cmp) return false;
						break;
				}
			} else if(match[3]) {
				const start = +match[3];
				const end = +match[4];
				if(value < start || value > end) return false;
			}
		} while(true);
	}
	return false;
}