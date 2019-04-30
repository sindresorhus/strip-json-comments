'use strict';
const singleComment = Symbol('singleComment');
const multiComment = Symbol('multiComment');
const stripWithoutWhitespace = () => '';
const stripWithWhitespace = (string, start, end) => string.slice(start, end).replace(/\S/g, ' ');

module.exports = (jsonString, options = {}) => {
	const strip = options.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	let insideString = false;
	let insideComment = false;
	let offset = 0;
	let result = '';

	for (let i = 0; i < jsonString.length; i++) {
		const currentCharacter = jsonString[i];
		const nextCharacter = jsonString[i + 1];

		if (!insideComment && currentCharacter === '"') {
			const escaped = jsonString[i - 1] === '\\' && jsonString[i - 2] !== '\\';
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentCharacter + nextCharacter === '//') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
			i++;
			insideComment = false;
			result += strip(jsonString, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentCharacter === '\n') {
			insideComment = false;
			result += strip(jsonString, offset, i);
			offset = i;
		} else if (!insideComment && currentCharacter + nextCharacter === '/*') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentCharacter + nextCharacter === '*/') {
			i++;
			insideComment = false;
			result += strip(jsonString, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	return result + (insideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));
};
