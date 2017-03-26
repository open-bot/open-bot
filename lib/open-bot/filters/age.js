const TimeFilter = require("./TimeFilter");

class AgeFilter extends TimeFilter {
	getDate({}, { created_at }) {
		return created_at;
	}
}

module.exports = AgeFilter;
