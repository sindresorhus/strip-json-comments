'use strict';
var assert = require('assert');
var strip = require('./strip-json-comments');

suite('Test Cases', function () {
	test('should strip comments', function () {
		assert.strictEqual(strip('//comment\n{"a":"b"}'), '\n{"a":"b"}');
		assert.strictEqual(strip('/*//comment*/{"a":"b"}'), '{"a":"b"}');
		assert.strictEqual(strip('{"a":"b"//comment\n}'), '{"a":"b"\n}');
		assert.strictEqual(strip('{"a":"b"/*comment*/}'), '{"a":"b"}');
		assert.strictEqual(strip('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a":"b"}');
	});

	test('should not strip comments inside strings', function () {
		assert.strictEqual(strip('{"a":"b//c"}'), '{"a":"b//c"}');
		assert.strictEqual(strip('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
		assert.strictEqual(strip('{"/*a":"b"}'), '{"/*a":"b"}');
		assert.strictEqual(strip('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
	});

	suite('Line endings', function () {
		test('no comments', function () {
			assert.strictEqual(strip('{"a":"b"\n}'), '{"a":"b"\n}');
			assert.strictEqual(strip('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
		});

		test('single line comment', function () {
			assert.strictEqual(strip('{"a":"b"//c\n}'), '{"a":"b"\n}');
			assert.strictEqual(strip('{"a":"b"//c\r\n}'), '{"a":"b"\r\n}');
		});

		test('single line block comment', function () {
			assert.strictEqual(strip('{"a":"b"/*c*/\n}'), '{"a":"b"\n}');
			assert.strictEqual(strip('{"a":"b"/*c*/\r\n}'), '{"a":"b"\r\n}');
		});

		test('multi line block comment', function () {
			assert.strictEqual(strip('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b","x":"y"\n}');
			assert.strictEqual(strip('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b","x":"y"\r\n}');
		});
	});
});
