/*!
	strip-json-comments
	Strip comments from JSON. Lets you use comments in your JSON files!
	https://github.com/sindresorhus/strip-json-comments
	by Sindre Sorhus
	MIT License
*/
(function () {
	'use strict';

	var regex = /("(?:[^"\\\n\r]|\\[^\n\r])*"?)|\/\/.*|\/\*(?:[^*]|\*(?!\/))*(?:\*\/)?/g;
	function stripJsonComments(str) {
		return str.replace(regex, function(match, string) {
			if (string) {
				return match;
			}
			return '';
		});
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = stripJsonComments;
	} else {
		window.stripJsonComments = stripJsonComments;
	}
})();
