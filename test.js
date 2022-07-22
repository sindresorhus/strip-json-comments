import test from 'ava';
import stripJsonComments from './index.js';

test('replace comments with whitespace', t => {
	t.is(stripJsonComments('//comment\n{"a":"b"}'), '         \n{"a":"b"}');
	t.is(stripJsonComments('/*//comment*/{"a":"b"}'), '             {"a":"b"}');
	t.is(stripJsonComments('{"a":"b"//comment\n}'), '{"a":"b"         \n}');
	t.is(stripJsonComments('{"a":"b"/*comment*/}'), '{"a":"b"           }');
	t.is(stripJsonComments('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a"  \n\n\n       \r\n  :"b"}');
	t.is(stripJsonComments('/*!\n * comment\n */\n{"a":"b"}'), '   \n          \n   \n{"a":"b"}');
	t.is(stripJsonComments('{/*comment*/"a":"b"}'), '{           "a":"b"}');
});

test('remove comments', t => {
	const options = {whitespace: false};
	t.is(stripJsonComments('//comment\n{"a":"b"}', options), '\n{"a":"b"}');
	t.is(stripJsonComments('/*//comment*/{"a":"b"}', options), '{"a":"b"}');
	t.is(stripJsonComments('{"a":"b"//comment\n}', options), '{"a":"b"\n}');
	t.is(stripJsonComments('{"a":"b"/*comment*/}', options), '{"a":"b"}');
	t.is(stripJsonComments('{"a"/*\n\n\ncomment\r\n*/:"b"}', options), '{"a":"b"}');
	t.is(stripJsonComments('/*!\n * comment\n */\n{"a":"b"}', options), '\n{"a":"b"}');
	t.is(stripJsonComments('{/*comment*/"a":"b"}', options), '{"a":"b"}');
});

test('doesn\'t strip comments inside strings', t => {
	t.is(stripJsonComments('{"a":"b//c"}'), '{"a":"b//c"}');
	t.is(stripJsonComments('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
	t.is(stripJsonComments('{"/*a":"b"}'), '{"/*a":"b"}');
	t.is(stripJsonComments('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
});

test('consider escaped slashes when checking for escaped string quote', t => {
	t.is(stripJsonComments('{"\\\\":"https://foobar.com"}'), '{"\\\\":"https://foobar.com"}');
	t.is(stripJsonComments('{"foo\\"":"https://foobar.com"}'), '{"foo\\"":"https://foobar.com"}');
});

test('line endings - no comments', t => {
	t.is(stripJsonComments('{"a":"b"\n}'), '{"a":"b"\n}');
	t.is(stripJsonComments('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
});

test('line endings - single line comment', t => {
	t.is(stripJsonComments('{"a":"b"//c\n}'), '{"a":"b"   \n}');
	t.is(stripJsonComments('{"a":"b"//c\r\n}'), '{"a":"b"   \r\n}');
});

test('line endings - single line block comment', t => {
	t.is(stripJsonComments('{"a":"b"/*c*/\n}'), '{"a":"b"     \n}');
	t.is(stripJsonComments('{"a":"b"/*c*/\r\n}'), '{"a":"b"     \r\n}');
});

test('line endings - multi line block comment', t => {
	t.is(stripJsonComments('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b",   \n    "x":"y"\n}');
	t.is(stripJsonComments('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b",   \r\n    "x":"y"\r\n}');
});

test('line endings - works at EOF', t => {
	const options = {whitespace: false};
	t.is(stripJsonComments('{\r\n\t"a":"b"\r\n} //EOF'), '{\r\n\t"a":"b"\r\n}      ');
	t.is(stripJsonComments('{\r\n\t"a":"b"\r\n} //EOF', options), '{\r\n\t"a":"b"\r\n} ');
});

test('handles weird escaping', t => {
	t.is(stripJsonComments(String.raw`{"x":"x \"sed -e \\\"s/^.\\\\{46\\\\}T//\\\" -e \\\"s/#033/\\\\x1b/g\\\"\""}`), String.raw`{"x":"x \"sed -e \\\"s/^.\\\\{46\\\\}T//\\\" -e \\\"s/#033/\\\\x1b/g\\\"\""}`);
});

test('strips trailing commas', t => {
	t.is(stripJsonComments('{"x":true,}', {trailingCommas: true}), '{"x":true }');
	t.is(stripJsonComments('{"x":true,}', {trailingCommas: true, whitespace: false}), '{"x":true}');
	t.is(stripJsonComments('{"x":true,\n  }', {trailingCommas: true}), '{"x":true \n  }');
	t.is(stripJsonComments('[true, false,]', {trailingCommas: true}), '[true, false ]');
	t.is(stripJsonComments('[true, false,]', {trailingCommas: true, whitespace: false}), '[true, false]');
	t.is(stripJsonComments('{\n  "array": [\n    true,\n    false,\n  ],\n}', {trailingCommas: true, whitespace: false}), '{\n  "array": [\n    true,\n    false\n  ]\n}');
	t.is(stripJsonComments('{\n  "array": [\n    true,\n    false /* comment */ ,\n /*comment*/ ],\n}', {trailingCommas: true, whitespace: false}), '{\n  "array": [\n    true,\n    false  \n  ]\n}');
});

test.failing('handles malformed block comments', t => {
	t.is(stripJsonComments('[] */'), '[] */');
	t.is(stripJsonComments('[] /*'), '[] /*'); // Fails
});
