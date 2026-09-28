import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import stripJsonComments from './index.js';

test('replace comments with whitespace', () => {
	assert.equal(stripJsonComments('//comment\n{"a":"b"}'), '         \n{"a":"b"}');
	assert.equal(stripJsonComments('/*//comment*/{"a":"b"}'), '             {"a":"b"}');
	assert.equal(stripJsonComments('{"a":"b"//comment\n}'), '{"a":"b"         \n}');
	assert.equal(stripJsonComments('{"a":"b"/*comment*/}'), '{"a":"b"           }');
	assert.equal(stripJsonComments('{"a"/*\n\n\ncomment\r\n*/:"b"}'), '{"a"  \n\n\n       \r\n  :"b"}');
	assert.equal(stripJsonComments('/*!\n * comment\n */\n{"a":"b"}'), '   \n          \n   \n{"a":"b"}');
	assert.equal(stripJsonComments('{/*comment*/"a":"b"}'), '{           "a":"b"}');
});

test('remove comments', () => {
	const options = {whitespace: false};
	assert.equal(stripJsonComments('//comment\n{"a":"b"}', options), '\n{"a":"b"}');
	assert.equal(stripJsonComments('/*//comment*/{"a":"b"}', options), '{"a":"b"}');
	assert.equal(stripJsonComments('{"a":"b"//comment\n}', options), '{"a":"b"\n}');
	assert.equal(stripJsonComments('{"a":"b"/*comment*/}', options), '{"a":"b"}');
	assert.equal(stripJsonComments('{"a"/*\n\n\ncomment\r\n*/:"b"}', options), '{"a":"b"}');
	assert.equal(stripJsonComments('/*!\n * comment\n */\n{"a":"b"}', options), '\n{"a":"b"}');
	assert.equal(stripJsonComments('{/*comment*/"a":"b"}', options), '{"a":"b"}');
});

test('doesn\'t strip comments inside strings', () => {
	assert.equal(stripJsonComments('{"a":"b//c"}'), '{"a":"b//c"}');
	assert.equal(stripJsonComments('{"a":"b/*c*/"}'), '{"a":"b/*c*/"}');
	assert.equal(stripJsonComments('{"/*a":"b"}'), '{"/*a":"b"}');
	assert.equal(stripJsonComments(String.raw`{"\"/*a":"b"}`), String.raw`{"\"/*a":"b"}`);
});

test('consider escaped slashes when checking for escaped string quote', () => {
	assert.equal(stripJsonComments(String.raw`{"\\":"https://foobar.com"}`), String.raw`{"\\":"https://foobar.com"}`);
	assert.equal(stripJsonComments(String.raw`{"foo\"":"https://foobar.com"}`), String.raw`{"foo\"":"https://foobar.com"}`);
});

test('line endings - no comments', () => {
	assert.equal(stripJsonComments('{"a":"b"\n}'), '{"a":"b"\n}');
	assert.equal(stripJsonComments('{"a":"b"\r\n}'), '{"a":"b"\r\n}');
});

test('line endings - single line comment', () => {
	assert.equal(stripJsonComments('{"a":"b"//c\n}'), '{"a":"b"   \n}');
	assert.equal(stripJsonComments('{"a":"b"//c\r\n}'), '{"a":"b"   \r\n}');
});

test('line endings - lone CR ends a single line comment', () => {
	// LF, CRLF, and lone CR end a single-line comment and remain intact.
	assert.equal(stripJsonComments('{"a":"b"//c\r}'), '{"a":"b"   \r}');
	assert.equal(stripJsonComments('//c\r{}\n[]'), '   \r{}\n[]');
	assert.equal(stripJsonComments('//c\r{}\r\n[]'), '   \r{}\r\n[]');
	assert.equal(stripJsonComments('//c\r{"a":"b"}', {whitespace: false}), '\r{"a":"b"}');
	assert.equal(stripJsonComments('{"a":"b"//c\r}', {whitespace: false}), '{"a":"b"\r}');
	assert.equal(stripJsonComments('//c\r//d\r{}'), '   \r   \r{}');
	assert.equal(stripJsonComments('//c\r//d\r{}', {whitespace: false}), '\r\r{}');
	assert.equal(stripJsonComments('//c\r'), '   \r');
	assert.equal(stripJsonComments('//c\r', {whitespace: false}), '\r');
	assert.equal(stripJsonComments('[1,//c\r]', {trailingCommas: true}), '[1    \r]');
	assert.equal(stripJsonComments('[1,//c\r]', {trailingCommas: true, whitespace: false}), '[1\r]');
	assert.equal(stripJsonComments('[1,//c\r2,]', {trailingCommas: true, whitespace: false}), '[1,\r2]');
});

test('line endings - CRLF survives stripping the comment entirely', () => {
	// The line ending is document structure, not comment content, so it stays even when the comment itself is removed rather than blanked.
	const options = {whitespace: false};
	assert.equal(stripJsonComments('{"a":"b"//c\r\n}', options), '{"a":"b"\r\n}');
	assert.equal(stripJsonComments('//c\r\n{"a":"b"}', options), '\r\n{"a":"b"}');
	assert.equal(stripJsonComments('{"a":"b"//c\r\n"d":"e"}', options), '{"a":"b"\r\n"d":"e"}');
	// Line endings *inside* a block comment are comment content and do go away.
	assert.equal(stripJsonComments('{"a"/*c\r\n*/:"b"}', options), '{"a":"b"}');
});

test('line endings - single line block comment', () => {
	assert.equal(stripJsonComments('{"a":"b"/*c*/\n}'), '{"a":"b"     \n}');
	assert.equal(stripJsonComments('{"a":"b"/*c*/\r\n}'), '{"a":"b"     \r\n}');
});

test('line endings - multi line block comment', () => {
	assert.equal(stripJsonComments('{"a":"b",/*c\nc2*/"x":"y"\n}'), '{"a":"b",   \n    "x":"y"\n}');
	assert.equal(stripJsonComments('{"a":"b",/*c\r\nc2*/"x":"y"\r\n}'), '{"a":"b",   \r\n    "x":"y"\r\n}');
});

test('line endings inside a block comment are kept, not blanked', () => {
	// The whitespace-preserving strip only replaces what a line ending is not, so a line ending inside a block comment survives even though the rest of the comment is blanked. That is what keeps `JSON.parse` positions lined up with the input.
	assert.equal(stripJsonComments('{"a"/*\r\n*/:"b"}'), '{"a"  \r\n  :"b"}');
	assert.equal(stripJsonComments('{"a"/*\r*/:"b"}'), '{"a"  \r  :"b"}');
	assert.deepEqual(JSON.parse(stripJsonComments('{\r\n\t/* c */\r\n\t"a": 1\r\n}')), {a: 1});
});

test('a CR inside a string is ordinary text', () => {
	assert.equal(stripJsonComments('{"a":"b\rc"}'), '{"a":"b\rc"}');
	assert.equal(stripJsonComments('{"a":"b//c\rd"}'), '{"a":"b//c\rd"}');
	assert.equal(stripJsonComments('{"a":"b\rc"}//c\n{}'), '{"a":"b\rc"}   \n{}');
});

test('line endings - works at EOF', () => {
	const options = {whitespace: false};
	assert.equal(stripJsonComments('{\r\n\t"a":"b"\r\n} //EOF'), '{\r\n\t"a":"b"\r\n}      ');
	assert.equal(stripJsonComments('{\r\n\t"a":"b"\r\n} //EOF', options), '{\r\n\t"a":"b"\r\n} ');
});

test('handles weird escaping', () => {
	const fixture = String.raw`{"x":"x \"sed -e \\\"s/^.\\\\{46\\\\}T//\\\" -e \\\"s/#033/\\\\x1b/g\\\"\""}`;
	assert.equal(stripJsonComments(fixture), fixture);
});

test('strips trailing commas', () => {
	const removed = {trailingCommas: true, whitespace: false};
	assert.equal(stripJsonComments('{"x":true,}', {trailingCommas: true}), '{"x":true }');
	assert.equal(stripJsonComments('{"x":true,}', removed), '{"x":true}');
	assert.equal(stripJsonComments('{"x":true,\n  }', {trailingCommas: true}), '{"x":true \n  }');
	assert.equal(stripJsonComments('[true, false,]', {trailingCommas: true}), '[true, false ]');
	assert.equal(stripJsonComments('[true, false,]', removed), '[true, false]');
	assert.equal(stripJsonComments('{\n  "array": [\n    true,\n    false,\n  ],\n}', removed), '{\n  "array": [\n    true,\n    false\n  ]\n}');
	assert.equal(stripJsonComments('{\n  "array": [\n    true,\n    false /* comment */ ,\n /*comment*/ ],\n}', removed), '{\n  "array": [\n    true,\n    false  \n  ]\n}');
});

test('handles malformed block comments', () => {
	assert.equal(stripJsonComments('[] */'), '[] */');
	// An unclosed block comment is left as-is, so `JSON.parse` reports it at its real position.
	assert.equal(stripJsonComments('[] /*'), '[] /*');
	assert.equal(stripJsonComments('{"a":1} /* unclosed'), '{"a":1} /* unclosed');
	assert.equal(stripJsonComments('[] /*\nunclosed', {whitespace: false}), '[] /*\nunclosed');
});

test('strips an unclosed single-line comment to the end of the input', () => {
	assert.equal(stripJsonComments('[] //c'), '[]    ');
	assert.equal(stripJsonComments('[] //c', {whitespace: false}), '[] ');
});

test('handles non-breaking space with preserving whitespace', () => {
	const fixture = `{
	// Comment with non-breaking-space: '\u{A0}'
	"a": 1
	}`;

	const stripped = stripJsonComments(fixture);
	assert.deepEqual(JSON.parse(stripped), {a: 1});
});

test('comment markers inside strings are not comments', () => {
	assert.equal(stripJsonComments('{"a":"//"}'), '{"a":"//"}');
	assert.equal(stripJsonComments('{"a":"/*"}'), '{"a":"/*"}');
	assert.equal(stripJsonComments('{"a":"*/"}'), '{"a":"*/"}');
	assert.equal(stripJsonComments('{"a":"//x//y"}'), '{"a":"//x//y"}');
	assert.equal(stripJsonComments('{"a":"/* not a comment */"}'), '{"a":"/* not a comment */"}');
	assert.equal(stripJsonComments('{"a":"// not a comment"}'), '{"a":"// not a comment"}');
});

test('quotes inside comments do not open a string', () => {
	assert.equal(stripJsonComments('//a"b"//c\n{}'), '         \n{}');
	assert.equal(stripJsonComments('/*a"b*/{}'), '       {}');
	assert.equal(stripJsonComments('{"a"/*x*/:"b"}'), '{"a"     :"b"}');
	assert.equal(stripJsonComments('{/*x*/"a"/*y*/:/*z*/"b"/*w*/}'), '{     "a"     :     "b"     }');
});

test('comments do not nest', () => {
	assert.equal(stripJsonComments('/* /* */ {}'), '         {}');
	assert.equal(stripJsonComments('/* // */ {}'), '         {}');
	assert.equal(stripJsonComments('// /* \n{}'), '      \n{}');
	assert.equal(stripJsonComments('/**//**/{}'), '        {}');
	assert.equal(stripJsonComments('/* * / */ {}'), '          {}');
});

test('trailing commas inside strings and comments are left alone', () => {
	const options = {trailingCommas: true};
	assert.equal(stripJsonComments('{"a":",}"}', options), '{"a":",}"}');
	assert.equal(stripJsonComments('{"a":"x,y",}', options), '{"a":"x,y" }');
	assert.equal(stripJsonComments('{"a":1,/*,}*/}', options), '{"a":1       }');
	assert.equal(stripJsonComments('[1,//,]\n]', options), '[1     \n]');
});

test('a comma is only trailing when a bracket follows it', () => {
	const options = {trailingCommas: true};
	assert.equal(stripJsonComments('{"a":1,"b":2}', options), '{"a":1,"b":2}');
	assert.equal(stripJsonComments('{"a":1,,"b":2}', options), '{"a":1,,"b":2}');
	assert.equal(stripJsonComments('[1, /* unclosed', options), '[1, /* unclosed');
	assert.equal(stripJsonComments('[1, // unclosed', options), '[1,            ');
});

test('a comment between two commas does not make the second one trailing', () => {
	// Two commas in a row is not something valid JSON contains, so neither is treated as the trailing comma. A comment sitting between the two must not change that: stripping the second one would leave another trailing comma behind, and the result would then differ from the result of stripping it again.
	const options = {trailingCommas: true, whitespace: false};
	assert.equal(stripJsonComments('[1,,]', options), '[1,,]');
	assert.equal(stripJsonComments('[1,/*c*/,]', options), '[1,,]');
	assert.equal(stripJsonComments('[1,//c\n,]', options), '[1,\n,]');
	assert.equal(stripJsonComments('{"a":1,/*c*/,}', options), '{"a":1,,}');
	assert.equal(stripJsonComments('[1,2,,]', options), '[1,2,,]');
	assert.equal(stripJsonComments('[1,2,/*c*/,]', options), '[1,2,,]');
});

test('CRLF ends a comment wherever it appears', () => {
	assert.equal(stripJsonComments('{"a"//c\r\n:"b"}'), '{"a"   \r\n:"b"}');
	assert.equal(stripJsonComments('[//c\r\n1]'), '[   \r\n1]');
	assert.equal(stripJsonComments('[1//c\r\n,2]', {trailingCommas: true}), '[1   \r\n,2]');
});

test('a line ending does not hide a trailing comma', () => {
	const removed = {whitespace: false, trailingCommas: true};
	assert.equal(stripJsonComments('[1,//c\r\n]', removed), '[1\r\n]');
	assert.equal(stripJsonComments('[1,//c\n]', removed), '[1\n]');
	assert.equal(stripJsonComments('[1,//c\r\n2,]', removed), '[1,\r\n2]');
	assert.equal(stripJsonComments('[1,//c\r\n]', {trailingCommas: true}), '[1    \r\n]');
	// No bracket follows the comma, so it is not trailing and stays.
	assert.equal(stripJsonComments('{"a":1,/*', removed), '{"a":1,/*');
	assert.equal(stripJsonComments('{"a":1,//c', removed), '{"a":1,');
});

test('non-ASCII characters around comment markers', () => {
	// `index.js` reads UTF-16 code units, so it sees the two halves of a surrogate pair. Neither half can match an ASCII marker.
	assert.equal(stripJsonComments('{"a":"😀//b"}'), '{"a":"😀//b"}');
	assert.equal(stripJsonComments('{"a":"😀/*x*/😀"}'), '{"a":"😀/*x*/😀"}');
	assert.equal(stripJsonComments('{"a":"é/*x*/é"}'), '{"a":"é/*x*/é"}');
	assert.equal(stripJsonComments('😀//c\n{}'), '😀   \n{}');
	assert.equal(stripJsonComments('{"😀":"x"}//c\n{}'), '{"😀":"x"}   \n{}');
	assert.equal(stripJsonComments('/*😀😀*/{}'), '        {}');
	assert.equal(stripJsonComments('{"a":"😀//b"}', {whitespace: false}), '{"a":"😀//b"}');
	assert.deepEqual(JSON.parse(stripJsonComments('{"😀":[1,2] // c\n}')), {'😀': [1, 2]});
});

test('a comment at any gap in a document leaves its value unchanged', () => {
	// A realistic document split into the tokens a comment can be placed between. `c//d` is a string holding what looks like a comment, and it has to survive every one of these placements untouched.
	const tokens = ['{', '"a"', ':', '[', '1', ',', '2', ',', '{', '"b"', ':', '"c//d"', '}', ']', ',', '"e"', ':', 'true', '}'];
	const expected = {a: [1, 2, {b: 'c//d'}], e: true};

	for (let index = 0; index <= tokens.length; index++) {
		for (const comment of ['/*c*/', '//c\n', '/*\n\tc\n*/', '/*a*//*b*/']) {
			const withComment = [...tokens];
			withComment.splice(index, 0, comment);
			const stripped = stripJsonComments(withComment.join(' '));
			assert.deepEqual(JSON.parse(stripped), expected, `${JSON.stringify(comment)} before token ${index}`);
		}
	}
});

test('several comments in a row are all removed', () => {
	const expected = {a: 1};
	assert.deepEqual(JSON.parse(stripJsonComments('/*a*//*b*/{/*c*/"a"/*d*/:/*e*/1/*f*/}/*g*/')), expected);
	assert.deepEqual(JSON.parse(stripJsonComments('/*a*/\n//b\n{//c\n"a"//d\n:1}//e\n')), expected);
	assert.deepEqual(JSON.parse(stripJsonComments('/*a*/ /*b*/ /*c*/ { /*d*/ "a" /*e*/ : /*f*/ 1 /*g*/ } /*h*/')), expected);
});

test('the bundled sample files strip to valid JSON', () => {
	// An end-to-end pass over realistic documents rather than hand-written fragments.
	for (const file of ['sample.json', 'sample-big.json']) {
		const source = readFileSync(new URL(file, import.meta.url), 'utf8');

		for (const options of [{}, {whitespace: false}, {trailingCommas: true}]) {
			const output = stripJsonComments(source, options);
			// The message is the point: without it a failure only says that one of the six passes over the two samples produced invalid JSON, not which.
			// eslint-disable-next-line node-test/no-useless-assertion
			assert.doesNotThrow(() => JSON.parse(output), `${file} ${JSON.stringify(options)}`);

			if (options.whitespace !== false) {
				assert.equal(output.length, source.length, `${file} ${JSON.stringify(options)}`);
			}
		}
	}
});

test('an error in the output points at the same place in the input', () => {
	// Replacing comments with whitespace exists so that a `JSON.parse` error still points at the right spot in the original file. Find the offending character in the output, then check the input holds the same character at the same offset, which is the same column because nothing before it was added or dropped, and the same line because no line ending before it changed.
	const fixtures = [
		'{\n\t// comment\n\t"a": 1,\n\t/* block */\n\t"b": @\n}',
		'// leading\r\n[\r\n\t1,\r\n\t// inner\r\n\t@\r\n]',
		'{"a": 1 /* mid */, "b": @}',
		'[1, 2, @]',
		'{\n\t// one\n\t"a": [\n\t\t1,\n\t\t// two\n\t\t@ // trailing\n\t]\n}',
		'{"a":/* c */1,// d\r\n"b": @}',
	];

	for (const fixture of fixtures) {
		const output = stripJsonComments(fixture);
		assert.throws(() => JSON.parse(output), SyntaxError, fixture);

		const offset = output.indexOf('@');
		assert.notEqual(offset, -1, fixture);
		assert.equal(fixture[offset], '@', fixture);
		assert.equal(output.slice(0, offset).split('\n').length, fixture.slice(0, offset).split('\n').length, fixture);
	}
});

test('replaces comments with whitespace of the same length', () => {
	// The property that carries positions is a substitution, not an edit: a comment becomes spaces in place, so nothing after it moves. The error-position test above is what actually checks the resulting offsets.
	for (const fixture of [
		'//comment\n{"a":"b"}',
		'/*//comment*/{"a":"b"}',
		'{"a":"b"/*\r\n*/"c":"d"}',
		'{"a"//c\r\n:"b"}',
		'[] /* unclosed',
		'{\r\n\t"a":1,// two\r\n\t"b":2\r\n}',
	]) {
		assert.equal(stripJsonComments(fixture).length, fixture.length, fixture);
	}
});

test('stripping is idempotent when whitespace is preserved', () => {
	// Blanking a comment cannot create a new one, and a stripped trailing comma becomes a space, so a second pass has nothing left to do.
	const fixtures = [
		'//c\n{"a":"b"}',
		'{"a"/*c*/:1}',
		'[] /*',
		'[1,//c\n]',
		'[1,/*c*/,]',
		'{"a":1,}',
		'[1,//c\r\n]',
		'[1,//c\n]',
		String.raw`\/*x*/",]`,
	];

	for (const fixture of fixtures) {
		for (const options of [{}, {trailingCommas: true}, {trailingCommas: false}]) {
			const once = stripJsonComments(fixture, options);
			assert.equal(stripJsonComments(once, options), once, `${fixture} ${JSON.stringify(options)}`);
		}
	}
});

test('with whitespace removed, a second pass can still change the result', () => {
	// Removing a comment moves the characters around it, so the first pass is not always the whole job. Here the block comment sits between a backslash and a quote, and removing it turns the quote into an escaped one, so the string that was swallowing the trailing comma closes and the second pass finds the comma after all.
	const options = {whitespace: false, trailingCommas: true};
	const first = stripJsonComments(String.raw`\/*x*/",]`, options);
	const second = stripJsonComments(first, options);
	assert.equal(first, String.raw`\",]`);
	assert.equal(second, String.raw`\"]`);
	assert.equal(stripJsonComments(second, options), second);
	// The same input with whitespace preserved is stable in one pass, because the comment becomes spaces and the quote keeps a non-backslash in front of it.
	assert.equal(stripJsonComments(String.raw`\/*x*/",]`, {trailingCommas: true}), String.raw`\     ",]`);
});

test('defaults to replacing comments with whitespace and keeping trailing commas', () => {
	assert.equal(stripJsonComments('//c\n{}'), '   \n{}');
	assert.equal(stripJsonComments('{"x":true,}'), '{"x":true,}');
	assert.equal(stripJsonComments('{"x":true,}', {trailingCommas: false}), '{"x":true,}');
});

test('throws on non-string input', () => {
	for (const value of [undefined, null, 1, {}, [], true, 1n]) {
		assert.throws(
			() => stripJsonComments(value),
			{
				name: 'TypeError',
				message: /^Expected argument `jsonString` to be a `string`, got /v,
			},
			`input: ${String(value)}`,
		);
	}

	assert.throws(() => stripJsonComments(undefined), {message: 'Expected argument `jsonString` to be a `string`, got `undefined`'});
	assert.throws(() => stripJsonComments(null), {message: 'Expected argument `jsonString` to be a `string`, got `object`'});
});
