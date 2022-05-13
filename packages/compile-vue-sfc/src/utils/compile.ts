import vue from '@vitejs/plugin-vue';
import { findUp } from 'find-up';
import { globby } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import styles from 'rollup-plugin-styles';

import { executeVueTsc } from '~/utils/vue-tsc.js';

type CompileVueSFCPayload = {
	declarations?: string[];
	outputChunks: OutputChunk[];
};

type CompileVueSFCOptions = {
	files: string | string[];
	projectRootPath?: string;
	write?: boolean;
} & (
	| {
			declarations: true;
			tsconfigPath?: string;
	  }
	| {
			declarations?: false;
	  }
);

export async function compileVueSFC(
	options: Omit<CompileVueSFCOptions, 'declarations'> & { declarations: false }
): Promise<Omit<CompileVueSFCPayload, 'declarations'>>;
export async function compileVueSFC(
	options: Omit<CompileVueSFCOptions, 'declarations'> & { declarations: true }
): Promise<
	Omit<CompileVueSFCPayload, 'declarations'> & { declarations: string[] }
>;
export async function compileVueSFC(
	options: CompileVueSFCOptions
): Promise<CompileVueSFCPayload>;
export async function compileVueSFC(
	options: CompileVueSFCOptions
): Promise<CompileVueSFCPayload> {
	const payload: CompileVueSFCPayload = {
		outputChunks: [],
	};

	const vueSFCFiles = await globby(options.files);
	if (vueSFCFiles.length === 0) {
		throw new Error('No files were provided.');
	}

	if (options.declarations) {
		let tsconfigPath: string;
		if (options.tsconfigPath === undefined) {
			const projectTsconfigPath = await findUp('tsconfig.json', {
				cwd: path.dirname(vueSFCFiles[0]!),
			});
			if (projectTsconfigPath === undefined) {
				throw new Error('`tsconfig.json` file not found');
			}

			tsconfigPath = projectTsconfigPath;
		} else {
			tsconfigPath = options.tsconfigPath;
		}

		const projectPath = path.dirname(tsconfigPath);

		// Copying the declaration files to the original project
		await Promise.all(
			vueSFCFiles.map(async (vueSFCFilePath) => {
				const vueSFCDeclaration = await executeVueTsc([
					'--declaration',
					'--emitDeclarationOnly',
					'--project',
					tsconfigPath,
					// custom option for our wrapper
					'--vue-sfc-file-path',
					vueSFCFilePath,
				]);

				const relativePath = path.relative(
					path.dirname(tsconfigPath),
					vueSFCFilePath
				);

				const vueSFCDtsPath = path.join(projectPath, `${relativePath}.d.ts`);
				if (options.write) {
					await fs.promises.writeFile(vueSFCDeclaration, vueSFCDtsPath);
				}
			})
		);
	}

	// Transform the .vue files into JavaScript with rollup
	const outputChunks = await Promise.all(
		vueSFCFiles.map(async (vueSFCFile) => {
			const bundle = await rollup({
				plugins: [vue({ reactivityTransform: true }), styles()],
				external(id: string) {
					// TODO: find a better way to distinguish between a project's import and a rollup plugin's import
					if (
						id.startsWith('plugin-vue') ||
						id.startsWith('./plugin-vue') ||
						id.includes('/rollup-plugin-styles/') ||
						id.includes('?')
					) {
						return false;
					}

					return true;
				},
				input: vueSFCFile,
			});

			const result = await bundle.generate({ format: 'esm' });

			const { code } = result.output[0];

			if (options.write) {
				await fs.promises.writeFile(
					path.join(
						path.dirname(vueSFCFile),
						`${path.basename(vueSFCFile)}.js`
					),
					code
				);
			}

			return result.output[0];
		})
	);

	payload.outputChunks = outputChunks;

	return payload;
}
