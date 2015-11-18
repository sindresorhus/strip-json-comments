'use strict';
var assert = require('assert');
var strip = require('./');

suite('Test Cases', function () {
	test('should replace comments with whitespace', function () {
		assert.strictEqual(strip('//comment\n{"a":"b"}'), '         \n{"a":"b"}');
		assert.strictEqual(strip('/*//comment*/{"a":"b"}'), '             {"a":"b"}');
		assert.strictEqual(strip('{"a":"b"//comment\n}'), '{"a":"b"         \n}');
		assert.strictEqual(strip('{"a":"b"/*comment*/}'), '{"a":"b"           }');
		assert.strictEqual(strip('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a"  \n\n\n       \r\n  :"b"}');
		assert.strictEqual(strip('/*!\n * comment\n */\n{"a":"b"}'), '   \n          \n   \n{"a":"b"}');
		assert.strictEqual(strip('{/*comment*/"a":"b"}'), '{           "a":"b"}');
	});

	test('should remove comments', function () {
		var options = { whitespace: false };

		assert.strictEqual(strip('//comment\n{"a":"b"}', options), '\n{"a":"b"}');
		assert.strictEqual(strip('/*//comment*/{"a":"b"}', options), '{"a":"b"}');
		assert.strictEqual(strip('{"a":"b"//comment\n}', options), '{"a":"b"\n}');
		assert.strictEqual(strip('{"a":"b"/*comment*/}', options), '{"a":"b"}');
		assert.strictEqual(strip('{"a"/*\n\n\ncomment\r\n*/:"b"}', options), '{"a":"b"}');
		assert.strictEqual(strip('/*!\n * comment\n */\n{"a":"b"}', options), '\n{"a":"b"}');
		assert.strictEqual(strip('{/*comment*/"a":"b"}', options), '{"a":"b"}');
	});

	test('should not strip comments inside strings', function () {
		assert.strictEqual(strip('{"a":"b//c"}'), '{"a":"b//c"}');
		assert.strictEqual(strip('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
		assert.strictEqual(strip('{"/*a":"b"}'), '{"/*a":"b"}');
		assert.strictEqual(strip('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
	});

	test('should consider escaped slashes when checking for escaped string quote', function () {
		assert.strictEqual(strip('{"\\\\":"https://foobar.com"}'), '{"\\\\":"https://foobar.com"}');
		assert.strictEqual(strip('{"foo\\\"":"https://foobar.com"}'), '{"foo\\\"":"https://foobar.com"}');
	});

	suite('Line endings', function () {
		test('no comments', function () {
			assert.strictEqual(strip('{"a":"b"\n}'), '{"a":"b"\n}');
			assert.strictEqual(strip('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
		});

		test('single line comment', function () {
			assert.strictEqual(strip('{"a":"b"//c\n}'), '{"a":"b"   \n}');
			assert.strictEqual(strip('{"a":"b"//c\r\n}'), '{"a":"b"   \r\n}');
		});

		test('single line block comment', function () {
			assert.strictEqual(strip('{"a":"b"/*c*/\n}'), '{"a":"b"     \n}');
			assert.strictEqual(strip('{"a":"b"/*c*/\r\n}'), '{"a":"b"     \r\n}');
		});

		test('multi line block comment', function () {
			assert.strictEqual(strip('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b",   \n    "x":"y"\n}');
			assert.strictEqual(strip('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b",   \r\n    "x":"y"\r\n}');
		});
	});
});
