import test from 'ava';
import fn from './';

test('replace comments with whitespace', t => {
	t.is(fn('//comment\n{"a":"b"}'), '         \n{"a":"b"}');
	t.is(fn('/*//comment*/{"a":"b"}'), '             {"a":"b"}');
	t.is(fn('{"a":"b"//comment\n}'), '{"a":"b"         \n}');
	t.is(fn('{"a":"b"/*comment*/}'), '{"a":"b"           }');
	t.is(fn('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a"  \n\n\n       \r\n  :"b"}');
	t.is(fn('/*!\n * comment\n */\n{"a":"b"}'), '   \n          \n   \n{"a":"b"}');
	t.is(fn('{/*comment*/"a":"b"}'), '{           "a":"b"}');
});

test('remove comments', t => {
	const opts = {whitespace: false};
	t.is(fn('//comment\n{"a":"b"}', opts), '\n{"a":"b"}');
	t.is(fn('/*//comment*/{"a":"b"}', opts), '{"a":"b"}');
	t.is(fn('{"a":"b"//comment\n}', opts), '{"a":"b"\n}');
	t.is(fn('{"a":"b"/*comment*/}', opts), '{"a":"b"}');
	t.is(fn('{"a"/*\n\n\ncomment\r\n*/:"b"}', opts), '{"a":"b"}');
	t.is(fn('/*!\n * comment\n */\n{"a":"b"}', opts), '\n{"a":"b"}');
	t.is(fn('{/*comment*/"a":"b"}', opts), '{"a":"b"}');
});

test('doesn\'t strip comments inside strings', t => {
	t.is(fn('{"a":"b//c"}'), '{"a":"b//c"}');
	t.is(fn('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
	t.is(fn('{"/*a":"b"}'), '{"/*a":"b"}');
	t.is(fn('{"\\"/*a":"b"}'), '{"\\"/*a":"b"}');
});

test('consider escaped slashes when checking for escaped string quote', t => {
	t.is(fn('{"\\\\":"https://foobar.com"}'), '{"\\\\":"https://foobar.com"}');
	t.is(fn('{"foo\\\"":"https://foobar.com"}'), '{"foo\\\"":"https://foobar.com"}');
});

test('line endings - no comments', t => {
	t.is(fn('{"a":"b"\n}'), '{"a":"b"\n}');
	t.is(fn('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
});

test('line endings - single line comment', t => {
	t.is(fn('{"a":"b"//c\n}'), '{"a":"b"   \n}');
	t.is(fn('{"a":"b"//c\r\n}'), '{"a":"b"   \r\n}');
});

test('line endings - single line block comment', t => {
	t.is(fn('{"a":"b"/*c*/\n}'), '{"a":"b"     \n}');
	t.is(fn('{"a":"b"/*c*/\r\n}'), '{"a":"b"     \r\n}');
});

test('line endings - multi line block comment', t => {
	t.is(fn('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b",   \n    "x":"y"\n}');
	t.is(fn('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b",   \r\n    "x":"y"\r\n}');
});

test('line endings - works at EOF', t => {
	const opts = {whitespace: false};
	t.is(fn('{\r\n\t"a":"b"\r\n} //EOF'), '{\r\n\t"a":"b"\r\n}      ');
	t.is(fn('{\r\n\t"a":"b"\r\n} //EOF', opts), '{\r\n\t"a":"b"\r\n} ');
});
