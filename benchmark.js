module.exports = function (fn, print) {
	const _initial = process.hrtime();
	fn();
	const _final = process.hrtime(_initial);
	if (print === true) {
		console.log('Result: ' + _final[0] + 's ' + _final[1] + 'ns');
	} else {
		return _final;
	}
};
