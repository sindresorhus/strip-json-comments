import test from 'ava';
import m from '.';

test('replace comments with whitespace', t => {
	t.is(m('//comment\n{"a":"b"}'), '         \n{"a":"b"}');
	t.is(m('/*//comment*/{"a":"b"}'), '             {"a":"b"}');
	t.is(m('{"a":"b"//comment\n}'), '{"a":"b"         \n}');
	t.is(m('{"a":"b"/*comment*/}'), '{"a":"b"           }');
	t.is(m('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a"  \n\n\n       \r\n  :"b"}');
	t.is(m('/*!\n * comment\n */\n{"a":"b"}'), '   \n          \n   \n{"a":"b"}');
	t.is(m('{/*comment*/"a":"b"}'), '{           "a":"b"}');
});

test('remove comments', t => {
	const opts = {whitespace: false};
	t.is(m('//comment\n{"a":"b"}', opts), '\n{"a":"b"}');
	t.is(m('/*//comment*/{"a":"b"}', opts), '{"a":"b"}');
	t.is(m('{"a":"b"//comment\n}', opts), '{"a":"b"\n}');
	t.is(m('{"a":"b"/*comment*/}', opts), '{"a":"b"}');
	t.is(m('{"a"/*\n\n\ncomment\r\n*/:"b"}', opts), '{"a":"b"}');
	t.is(m('/*!\n * comment\n */\n{"a":"b"}', opts), '\n{"a":"b"}');
	t.is(m('{/*comment*/"a":"b"}', opts), '{"a":"b"}');
});

test('doesn\'t strip comments inside strings', t => {
	t.is(m('{"a":"b//c"}'), '{"a":"b//c"}');
	t.is(m('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
	t.is(m('{"/*a":"b"}'), '{"/*a":"b"}');
	t.is(m('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
});

test('consider escaped slashes when checking for escaped string quote', t => {
	t.is(m('{"\\\\":"https://foobar.com"}'), '{"\\\\":"https://foobar.com"}');
	t.is(m('{"foo\\"":"https://foobar.com"}'), '{"foo\\"":"https://foobar.com"}');
});

test('line endings - no comments', t => {
	t.is(m('{"a":"b"\n}'), '{"a":"b"\n}');
	t.is(m('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
});

test('line endings - single line comment', t => {
	t.is(m('{"a":"b"//c\n}'), '{"a":"b"   \n}');
	t.is(m('{"a":"b"//c\r\n}'), '{"a":"b"   \r\n}');
});

test('line endings - single line block comment', t => {
	t.is(m('{"a":"b"/*c*/\n}'), '{"a":"b"     \n}');
	t.is(m('{"a":"b"/*c*/\r\n}'), '{"a":"b"     \r\n}');
});

test('line endings - multi line block comment', t => {
	t.is(m('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b",   \n    "x":"y"\n}');
	t.is(m('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b",   \r\n    "x":"y"\r\n}');
});

test('line endings - works at EOF', t => {
	const opts = {whitespace: false};
	t.is(m('{\r\n\t"a":"b"\r\n} //EOF'), '{\r\n\t"a":"b"\r\n}      ');
	t.is(m('{\r\n\t"a":"b"\r\n} //EOF', opts), '{\r\n\t"a":"b"\r\n} ');
});

test('handles weird escaping - read files', t => {
	const opts = {whitespace: false};
	const fs = require('fs');
	const weirdData = fs.readFileSync(`${__dirname}/weird.json`, 'utf8');
	const expectedData = fs.readFileSync(`${__dirname}/expect.json`, 'utf8');

	t.is(m(weirdData, opts), expectedData);
});

test('handles weird escaping - string literals', t => {
	const weirdData = '{"x":"x \\"sed -e \\\\\\"s/^.\\\\\\\\{46\\\\\\\\}T//\\\\\\" -e \\\\\\"s/#033/\\\\\\\\x1b/g\\\\\\"\\""}';
	t.is(m(weirdData), weirdData);
});
