#!/usr/bin/env node

/* eslint-disable prefer-destructuring */

import isPathInside from 'is-path-inside';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse as parseTsconfig } from 'tsconfig';

const projectFlagIndex = process.argv.indexOf('--project');
if (projectFlagIndex === -1) {
	throw new Error('`--project` not provided');
}

const tsconfigPath = process.argv[projectFlagIndex + 1];
if (tsconfigPath === undefined) {
	throw new Error('`tsconfig.json` path not provided');
}

if (!fs.existsSync(tsconfigPath)) {
	throw new Error(`\`tsconfig.json\` at ${tsconfigPath} does not exist`);
}

const vueSFCFilePathFlagIndex = process.argv.indexOf('--vue-sfc-file-path');
if (projectFlagIndex === -1) {
	throw new Error('`--vue-sfc-file-path` not provided');
}

const vueSFCFilePath = process.argv[vueSFCFilePathFlagIndex + 1];
if (vueSFCFilePath === undefined) {
	throw new Error('Path to Vue SFC not provided');
}

if (!fs.existsSync(vueSFCFilePath)) {
	throw new Error('Path to Vue SFC does not exist');
}

// Remove the `--vue-sfc-file-path` option before passing the other options through to `vue-tsc`
process.argv.splice(vueSFCFilePathFlagIndex, 2);

const readFileSync = fs.readFileSync;
fs.readFileSync = (...args) => {
	if (args[0] === tsconfigPath) {
		const tsconfigString = String(readFileSync(...args));

		try {
			const tsconfig = parseTsconfig(tsconfigString);

			tsconfig.compilerOptions ??= {};
			tsconfig.compilerOptions.outDir = 'dist';
			tsconfig.compilerOptions.skipLibCheck = true;
			tsconfig.compilerOptions.noEmitOnError = false;
			tsconfig.files = [vueSFCFilePath];
			tsconfig.include = [];

			return JSON.stringify(tsconfig);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	return readFileSync(...args);
};

let mostRecentlyOpenedFile;
const openSync = fs.openSync;
const distFolder = path.resolve(path.dirname(tsconfigPath), 'dist');
fs.openSync = (...args) => {
	mostRecentlyOpenedFile = args[0];
	// Don't open `dist` files (because we don't want to create new files on the file system)
	if (isPathInside(args[0], distFolder)) {
		return;
	}

	return openSync(...args);
};

let declaration;
// We deliberately never write to the file system for performance reasons
fs.writeSync = (...args) => {
	if (mostRecentlyOpenedFile.endsWith('.vue.d.ts')) {
		declaration = args[1];
	}
};

let exitCode;
const exit = process.exit;
process.exit = (code) => {
	exitCode = code;
	// Deliberately don't exit tho program to prevent TypeScript from exiting the process early
};

await import('vue-tsc/bin/vue-tsc.js');

if (declaration === undefined) {
	throw new Error('declaration was not generated');
}

process.stdout.write(declaration);
exit(exitCode);
