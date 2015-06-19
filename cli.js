#!/usr/bin/env node
'use strict';
var fs = require('fs');
var meow = require('meow');
var strip = require('./strip-json-comments');

var cli = meow({
	help: [
		'Usage',
		'  $ strip-json-comments <input-file> > <output-file>',
		'  $ strip-json-comments < <input-file> > <output-file>',
		'',
		'Example',
		'  $ strip-json-comments package.json > package-stripped.json'
	]
});

var input = cli.input[0];

function getStdin(cb) {
	var ret = '';

	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (data) {
		ret += data;
	});

	process.stdin.on('end', function () {
		cb(ret);
	});
}

if (!input && process.stdin.isTTY) {
	console.error('Expected a filename');
	process.exit(1);
}

if (input) {
	process.stdout.write(strip(fs.readFileSync(input, 'utf8')));
} else {
	getStdin(function (data) {
		process.stdout.write(strip(data));
	});
}
