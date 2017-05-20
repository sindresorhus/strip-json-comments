'use strict';
const fs = require('fs');
const stripJsonComments = require('./');

const json = fs.readFileSync('sample.json', 'utf8');

bench('strip JSON comments', function () {
	stripJsonComments(json);
});
