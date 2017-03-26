const Duration = require("duration-js");

class TimeFilter {
	constructor(options) {
		this.minimum = undefined;
		this.maximum = undefined;
		this.minimumDate = undefined;
		this.maximumDate = undefined;
		if(typeof options === "string") {
			this.minimum = new Duration(options).valueOf();
		} else {
			if(typeof options.minimum === "string") {
				this.minimum = new Duration(options.minimum).valueOf();
			} else if(typeof options.minimum === "number") {
				this.minimum = options.minimum;
			}
			if(typeof options.maximum === "string") {
				this.maximum = new Duration(options.maximum).valueOf();
			} else if(typeof options.maximum === "number") {
				this.maximum = options.maximum;
			}
			if(options.minimumDate) {
				this.minimumDate = new Date(options.minimumDate).getTime();
			}
			if(options.maximumDate) {
				this.maximumDate = new Date(options.maximumDate).getTime();
			}
		}
	}

	getDate(context, issue) {
		throw new Error("Not implemented");
	}

	findLast(context, issue) {
		return Promise.resolve(this.getDate(context, issue)).then(dateValue => {
			if(!dateValue)
				return -1;
			const date = new Date(dateValue).getTime();
			const age = Date.now() - date;
			if(this.minimum && age < this.minimum)
				return -1;
			if(this.maximum && age > this.maximum)
				return -1;
			if(this.minimumDate && date < this.minimumDate)
				return -1;
			if(this.maximumDate && date < this.maximumDate)
				return -1;
			return dateValue
		});
	}
}

module.exports = TimeFilter;
