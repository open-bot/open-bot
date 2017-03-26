const fs = require("fs");
const path = require("path");
const exec = require("sync-exec");

const packages = fs.readdirSync(path.resolve(__dirname, "../lib"));

packages.forEach(p => {
	const fullPath = path.resolve(__dirname, "../lib/" + p);
	const cmd = process.argv.slice(2).join(" ");
	console.log(p, cmd);
	const output = exec(cmd, { cwd: fullPath });
	console.log(output.stdout);
});
