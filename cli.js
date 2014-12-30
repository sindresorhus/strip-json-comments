#!/usr/bin/env node
'use strict';
var fs = require('fs');
var strip = require('./strip-json-comments');
var input, output;


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

function writeStdout(data, output) {
	if (output) {
		fs.writeFile(output, data);
	} else {
		process.stdout.write(data);
	}
}

if (process.argv.indexOf('-h') !== -1 || process.argv.indexOf('--help') !== -1) {
	console.log('strip-json-comments input-file > output-file');
	console.log('or');
	console.log('strip-json-comments < input-file > output-file');
	console.log('or');
	console.log('strip-json-comments -i input-file -o output-file');
	return;
}

if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--version') !== -1) {
	console.log(require('./package').version);
	return;
}

if (process.argv.indexOf('-i') !== -1) {
	input = process.argv[process.argv.indexOf('-i') + 1];
} else if (process.argv[2] && process.argv[2].substring(0, 1) !== '-') {
	input = process.argv[2];
}

if (process.argv.indexOf('-o') !== -1) {
	output = process.argv[process.argv.indexOf('-o') + 1];
}

if (input) {
	writeStdout(strip(fs.readFileSync(input, 'utf8')), output);
	return;
}

getStdin(function (data) {
	writeStdout(strip(data), output);
});
