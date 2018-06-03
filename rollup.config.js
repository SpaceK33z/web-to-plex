import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import copy from 'rollup-plugin-copy';

function generateConfig(filepath, plugins = []) {
	return {
		input: `src/${filepath}.ts`,
		output: {
			format: 'iife',
			file: `build/${filepath}.js`,
		},
		plugins: [
			nodeResolve({
				jsnext: true,
				main: true,
			}),
			commonjs(),
			typescript(),
			...plugins,
		],
	};
}

const manifestFile = process.env.FIREFOX
	? 'src/manifest_firefox.json'
	: 'src/manifest.json';

export default [
	generateConfig('options/index', [
		copy({
			'src/img': 'build/img',
			'src/css': 'build/css',
			[manifestFile]: 'build/manifest.json',
			'src/options/index.html': 'build/options/index.html',
			verbose: true,
		}),
	]),
	generateConfig('background'),
	generateConfig('history-hack'),
	generateConfig('imdb'),
	generateConfig('letterboxd'),
	generateConfig('movieo'),
	generateConfig('trakt'),
];
