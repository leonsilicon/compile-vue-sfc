import vue from '@vitejs/plugin-vue';
import { findUp } from 'find-up';
import { globby } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pkgUp } from 'pkg-up';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import jsImports from 'rollup-plugin-js-imports';
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
	outDir?: string;
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

	let projectPath: string;
	if (options.projectRootPath === undefined) {
		const pkgJsonPath = await pkgUp({ cwd: [options.files].flat()[0] });
		if (pkgJsonPath === undefined) {
			throw new Error(
				'Could not find the root of the project (please set the option `projectRootPath` to the path of your project root).'
			);
		}

		projectPath = path.dirname(pkgJsonPath);
	} else {
		projectPath = options.projectRootPath;
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

				const relativePathDir = path.dirname(
					path.relative(projectPath, vueSFCFilePath)
				);

				const vueSFCName = path.parse(vueSFCFilePath).name;
				if (options.outDir !== undefined) {
					const vueSFCDtsPath = path.join(
						options.outDir,
						relativePathDir,
						`${vueSFCName}.d.ts`
					);
					if (!fs.existsSync(path.dirname(vueSFCDtsPath))) {
						fs.mkdirSync(path.dirname(vueSFCDtsPath), { recursive: true });
					}

					await fs.promises.writeFile(vueSFCDtsPath, vueSFCDeclaration);
				} else if (options.write) {
					const vueSFCDtsPath = path.join(
						projectPath,
						relativePathDir,
						`${vueSFCName}.d.ts`
					);
					if (!fs.existsSync(path.dirname(vueSFCDtsPath))) {
						fs.mkdirSync(path.dirname(vueSFCDtsPath), { recursive: true });
					}

					await fs.promises.writeFile(vueSFCDtsPath, vueSFCDeclaration);
				}
			})
		);
	}

	// Transform the .vue files into JavaScript with rollup
	const outputChunks = await Promise.all(
		vueSFCFiles.map(async (vueSFCFile) => {
			const bundle = await rollup({
				plugins: [vue({ reactivityTransform: true }), styles(), jsImports()],
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

			const relativePathDir = path.dirname(
				path.relative(projectPath, vueSFCFile)
			);
			const vueSFCName = path.parse(vueSFCFile).name;

			if (options.outDir !== undefined) {
				const compiledVueSFCPath = path.join(
					options.outDir,
					relativePathDir,
					`${vueSFCName}.js`
				);

				if (!fs.existsSync(path.dirname(compiledVueSFCPath))) {
					fs.mkdirSync(path.dirname(compiledVueSFCPath), { recursive: true });
				}

				await fs.promises.writeFile(compiledVueSFCPath, code);
			} else if (options.write) {
				const compiledVueSFCPath = path.join(
					projectPath,
					relativePathDir,
					`${vueSFCName}.js`
				);
				await fs.promises.writeFile(compiledVueSFCPath, code);
			}

			return result.output[0];
		})
	);

	payload.outputChunks = outputChunks;

	return payload;
}
