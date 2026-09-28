import fs from 'node:fs';
import stripJsonComments from './index.js';

const json = fs.readFileSync('sample.json', 'utf8');
const bigJson = fs.readFileSync('sample-big.json', 'utf8');

// Run the function repeatedly for one second, after a short warmup, and report the average time per call.
function bench(name, function_) {
	for (let index = 0; index < 10; index++) {
		function_();
	}

	let iterations = 0;
	const start = performance.now();
	while (performance.now() - start < 1000) {
		function_();
		iterations++;
	}

	const average = (performance.now() - start) / iterations;
	console.log(`${name}: ${average.toFixed(3)} ms`);
}

bench('strip JSON comments', () => {
	stripJsonComments(json);
});

bench('strip JSON comments without whitespace', () => {
	stripJsonComments(json, {whitespace: false});
});

bench('strip Big JSON comments', () => {
	stripJsonComments(bigJson);
});
