import vue from '@vitejs/plugin-vue';
import { findUp } from 'find-up';
import { globby } from 'globby';
import mockArgv from 'mock-argv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import styles from 'rollup-plugin-styles';
import onExit from 'signal-exit';
import tmp from 'tmp-promise';
import { readFile as readTsconfigFile } from 'tsconfig';
import type { Tsconfig } from 'tsconfig-type';

const randomChars = () => Math.random().toString(36).slice(2);

type CompileVueSFCPayload = {
	declarations?: string[];
	outputChunks: OutputChunk[];
};

type CompileVueSFCOptions = {
	files: string | string[];
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

	if (options.declarations) {
		const declarations: string[] = [];

		// Generate the TypeScript definitions
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

		const tsconfig = (await readTsconfigFile(tsconfigPath)) as Tsconfig;

		// Write a temp config file
		const tmpTsconfigPath = path.join(
			path.dirname(tsconfigPath),
			`tsconfig.${randomChars()}.json`
		);

		// Ensure that the temporary tsconfig is always deleted before the program exits
		onExit(() => {
			fs.rmSync(tmpTsconfigPath, { force: true });
		});

		const tmpOutDir = await tmp.dir();

		const tmpTsconfig: Tsconfig = {
			...tsconfig,
			compilerOptions: {
				...tsconfig.compilerOptions,
				skipLibCheck: true,
				noEmitOnError: false,
				outDir: tmpOutDir.path,
				rootDir: projectPath,
			},
			files: vueSFCFiles,
			include: [],
		};

		fs.writeFileSync(tmpTsconfigPath, JSON.stringify(tmpTsconfig, null, '\t'));

		const originalProcessExit = process.exit;

		// @ts-expect-error: We're temporarily overriding process.exit to prevent vue-tsc from exiting the program
		process.exit = (code: number) => {
			if (code !== 0) {
				throw new Error(`vue-tsc returned a non-zero exit code: ${code}`);
			}
			/* noop */
		};

		await mockArgv(
			['--declaration', '--emitDeclarationOnly', '--project', tmpTsconfigPath],
			async () => {
				await import('vue-tsc/bin/vue-tsc.js');
			}
		);

		process.exit = originalProcessExit;

		// Copying the declaration files to the original project
		await Promise.all(
			vueSFCFiles.map(async (vueSFCFilePath) => {
				const relativePath = path.relative(
					path.dirname(tsconfigPath),
					vueSFCFilePath
				);
				const tmpVueSFCDtsFilePath = path.join(
					tmpOutDir.path,
					`${relativePath}.d.ts`
				);
				const vueSFCDtsPath = path.join(projectPath, `${relativePath}.d.ts`);
				if (options.write) {
					await fs.promises.cp(tmpVueSFCDtsFilePath, vueSFCDtsPath);
				}

				declarations.push(
					await fs.promises.readFile(tmpVueSFCDtsFilePath, 'utf8')
				);
			})
		);

		payload.declarations = declarations;
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
