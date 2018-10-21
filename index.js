'use strict';
const singleComment = 1;
const multiComment = 2;
const stripWithoutWhitespace = () => '';
const stripWithWhitespace = (str, start, end) => str.slice(start, end).replace(/\S/g, ' ');

const isEscaped = (str, qoutePos) => {
	let i = qoutePos - 1;
	let numOfBackslash = 0;

	while (str[i] === '\\') {
		numOfBackslash += 1;
		i -= 1;
	}

	return Boolean(numOfBackslash % 2);
};

module.exports = (str, opts) => {
	opts = opts || {};

	const strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	let insideString = false;
	let insideComment = false;
	let offset = 0;
	let ret = '';

	for (let i = 0; i < str.length; i++) {
		const currentChar = str[i];
		const nextChar = str[i + 1];

		if (!insideComment && currentChar === '"') {
			const escaped = isEscaped(str, i);
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentChar + nextChar === '//') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentChar + nextChar === '\r\n') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentChar === '\n') {
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
		} else if (!insideComment && currentChar + nextChar === '/*') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentChar + nextChar === '*/') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	return ret + (insideComment ? strip(str.substr(offset)) : str.substr(offset));
};
