/* globals bench */
'use strict';
const fs = require('fs');
const stripJsonComments = require('.');

const json = fs.readFileSync('sample.json', 'utf8');
const bigJson = fs.readFileSync('sampleBig.json', 'utf8');

bench('strip JSON comments', () => {
  set('type', 'static');
	stripJsonComments(json);
});

bench('strip JSON comments without whitespace', () => {
	stripJsonComments(json, {
    whitespace: false
  });
});

bench('strip Big JSON comments', () => {
	stripJsonComments(bigJson);
});
