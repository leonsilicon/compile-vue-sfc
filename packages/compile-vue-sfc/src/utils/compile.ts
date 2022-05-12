import vue from '@vitejs/plugin-vue';
import { execa } from 'execa';
import { findUp } from 'find-up';
import { globby } from 'globby';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import styles from 'rollup-plugin-styles';
import tmp from 'tmp-promise';
import { readFile as readTsconfigFile } from 'tsconfig';
import type { Tsconfig } from 'tsconfig-type';

const __require = createRequire(import.meta.url);

const randomChars = () => Math.random().toString(36).slice(2);

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
		// To generate the declarations, we need to create a temporary tsconfig.json file to pass to vue-tsc. Unfortunately, TypeScript doesn't support specifying individual files yet, so we instead symlink all the project files into a temporary directory.
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

		const tmpDir = await tmp.dir();
		const projectTmpDir = tmpDir.path;

		// Using `path.resolve` for more robust equality checks in the below while loop
		const projectRootPath = path.resolve(
			options.projectRootPath ?? path.dirname(tsconfigPath)
		);

		// Recursively symlink all parent folders of the tsconfigPath until it reaches projectRootPath
		let currentDirectory = tsconfigPath;

		do {
			currentDirectory = path.dirname(currentDirectory);
			// Symlink the files individually and not the entire project folder so that when we create the temporary tsconfig.json file, it doesn't pollute the original directory
			const projectFiles = fs.readdirSync(currentDirectory);
			for (const projectFile of projectFiles) {
				const projectFilePath = path.join(currentDirectory, projectFile);
				fs.symlinkSync(projectFilePath, path.join(projectTmpDir, projectFile));
			}
		} while (currentDirectory !== projectRootPath);

		const projectPath = options.projectRootPath ?? path.dirname(tsconfigPath);

		const declarations: string[] = [];

		const tsconfig = (await readTsconfigFile(tsconfigPath)) as Tsconfig;

		const tmpTsconfigPath = path.join(
			projectTmpDir,
			`tsconfig.${randomChars()}.json`
		);

		const tmpOutDir = await tmp.dir();
		const vueSFCTempFiles = vueSFCFiles.map((vueSFCFile) =>
			path.join(projectTmpDir, path.relative(projectPath, vueSFCFile))
		);

		const tmpTsconfig: Tsconfig = {
			...tsconfig,
			compilerOptions: {
				...tsconfig.compilerOptions,
				skipLibCheck: true,
				noEmitOnError: false,
				outDir: tmpOutDir.path,
				rootDir: projectTmpDir,
			},
			files: vueSFCTempFiles,
			include: [],
		};

		fs.writeFileSync(tmpTsconfigPath, JSON.stringify(tmpTsconfig, null, '\t'));

		const vueTscPath = __require.resolve('vue-tsc/bin/vue-tsc.js');

		await execa(
			vueTscPath,
			['--declaration', '--emitDeclarationOnly', '--project', tmpTsconfigPath],
			{ stdio: 'inherit' }
		);

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
