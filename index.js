export default function stripJsonComments(jsonString, {whitespace = true} = {}) {
	if (typeof jsonString !== 'string') {
		throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
	}

	// This regular expression translates to:
	//
	//   /quoted-string|line-comment|block-comment/g
	//
	// This means that comment characters inside of strings will match
	// as strings, not comments, so we can just skip the whole string
	// in the replacer function.
	return jsonString.replace(
		/"(?:[^"\\]|\\.)*"?|\/\/[^\r\n]*|\/\*(?:[^*]|\*[^/])*(?:\*\/)?/g, match => {
			// Skip strings & broken block comments:
			if (match[0] === '"' || (match[1] === '*' && match.slice(-2) !== '*/')) {
				return match;
			}

			// Replace comments with whitespace (or not):
			return whitespace ? match.replace(/\S/g, ' ') : '';
		},
	);
}
