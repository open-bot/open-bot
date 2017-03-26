const fs = require("fs");
const path = require("path");

const libPackage = path.resolve(__dirname, "../lib/open-bot/package.json");
const cliPackage = path.resolve(__dirname, "../lib/open-bot-cli/package.json");
const mainPackage = path.resolve(__dirname, "../package.json");

const lib = JSON.parse(fs.readFileSync(libPackage, "utf-8"));
const cli = JSON.parse(fs.readFileSync(cliPackage, "utf-8"));
const main = JSON.parse(fs.readFileSync(mainPackage, "utf-8"));

const addDependency = (name, value) => {
	main.dependencies[name] = value;
}

Object.keys(cli.dependencies).forEach(name => addDependency(name, cli.dependencies[name]));
Object.keys(lib.dependencies).forEach(name => addDependency(name, lib.dependencies[name]));

main.dependencies = Object.keys(main.dependencies).sort().reduce((o, name) => {
	o[name] = main.dependencies[name];
	return o;
}, {});

fs.writeFileSync(mainPackage, JSON.stringify(main, 0, 2), "utf-8");
