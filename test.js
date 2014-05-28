'use strict';
var assert = require('assert');
var strip = require('./strip-json-comments');

it('should strip comments', function () {
	assert.strictEqual(strip('//comment\n{"a":"b"}'), '\n{"a":"b"}');
	assert.strictEqual(strip('/*//comment*/{"a":"b"}'), '{"a":"b"}');
	assert.strictEqual(strip('{"a":"b"//comment\n}'), '{"a":"b"\n}');
	assert.strictEqual(strip('{"a":"b"/*comment*/}'), '{"a":"b"}');
	assert.strictEqual(strip('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a":"b"}');
});

it('should not strip comments inside strings', function () {
	assert.strictEqual(strip('{"a":"b//c"}'), '{"a":"b//c"}');
	assert.strictEqual(strip('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
	assert.strictEqual(strip('{"/*a":"b"}'), '{"/*a":"b"}');
	assert.strictEqual(strip('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
});
