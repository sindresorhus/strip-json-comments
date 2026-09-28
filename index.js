const singleComment = Symbol('singleComment');
const multiComment = Symbol('multiComment');

const stripWithoutWhitespace = () => '';

// Replace all characters except ASCII spaces, tabs and line endings with regular spaces to ensure valid JSON output.
// The `v` flag would make the pattern match code points, so the two halves of a surrogate pair would be blanked as one character and the output would be shorter than the input, breaking the offsets the whole package exists to preserve.
// eslint-disable-next-line require-unicode-regexp
const stripWithWhitespace = (string, start, end) => string.slice(start, end).replaceAll(/[^\t\n\r ]/g, ' ');

const isEscaped = (jsonString, quotePosition) => {
	let index = quotePosition - 1;
	let backslashCount = 0;

	while (jsonString[index] === '\\') {
		index -= 1;
		backslashCount += 1;
	}

	return Boolean(backslashCount % 2);
};

export default function stripJsonComments(jsonString, {whitespace = true, trailingCommas = false} = {}) {
	if (typeof jsonString !== 'string') {
		throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
	}

	const strip = whitespace ? stripWithWhitespace : stripWithoutWhitespace;

	let isInsideString = false;
	let isInsideComment = false;
	let offset = 0;
	let buffer = '';
	let result = '';
	let commaIndex = -1;

	for (let index = 0; index < jsonString.length; index++) {
		const currentCharacter = jsonString[index];
		const nextCharacter = jsonString[index + 1];

		if (!isInsideComment && currentCharacter === '"') {
			// Enter or exit string
			const escaped = isEscaped(jsonString, index);
			if (!escaped) {
				isInsideString = !isInsideString;
			}
		}

		if (isInsideString) {
			continue;
		}

		if (!isInsideComment && currentCharacter === '/' && (nextCharacter === '/' || nextCharacter === '*')) {
			// Enter a comment, stepping over the character that completes its opening marker
			buffer += jsonString.slice(offset, index);
			offset = index;
			isInsideComment = nextCharacter === '/' ? singleComment : multiComment;
			index++;
		} else if (isInsideComment === singleComment && (currentCharacter === '\n' || currentCharacter === '\r')) {
			// Exit single-line comment at LF, CRLF, or CR, leaving the line ending itself intact.
			isInsideComment = false;
			buffer += strip(jsonString, offset, index);
			offset = index;
		} else if (isInsideComment === multiComment && currentCharacter === '*' && nextCharacter === '/') {
			// Exit multiline comment
			index++;
			isInsideComment = false;
			buffer += strip(jsonString, offset, index + 1);
			offset = index + 1;
		} else if (trailingCommas && !isInsideComment) {
			if (commaIndex !== -1) {
				if (currentCharacter === '}' || currentCharacter === ']') {
					// Strip trailing comma
					buffer += jsonString.slice(offset, index);
					result += strip(buffer, 0, 1) + buffer.slice(1);
					buffer = '';
					offset = index;
					commaIndex = -1;
				} else if (currentCharacter !== ' ' && currentCharacter !== '\t' && currentCharacter !== '\r' && currentCharacter !== '\n') {
					// Hit non-whitespace following a comma; comma is not trailing
					buffer += jsonString.slice(offset, index);
					offset = index;
					commaIndex = -1;
				}
			} else if (currentCharacter === ',') {
				// Flush buffer prior to this point, and save new comma index
				result += buffer + jsonString.slice(offset, index);
				buffer = '';
				offset = index;
				commaIndex = index;
			}
		}
	}

	const remaining = (isInsideComment === singleComment)
		? strip(jsonString, offset)
		: jsonString.slice(offset);

	return result + buffer + remaining;
}
