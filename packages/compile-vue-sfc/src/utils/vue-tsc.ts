import { join } from 'desm';
import type { Options as ExecaOptions } from 'execa';
import { execa } from 'execa';

export async function executeVueTsc(
	args: string[],
	execaOptions?: ExecaOptions
): Promise<string> {
	const vueTscWrapperPath = join(import.meta.url, '../vue-tsc/wrapper.js');
	const { stdout: vueSFCDeclaration } = await execa(
		'node',
		[vueTscWrapperPath, ...args],
		execaOptions
	);
	return vueSFCDeclaration;
}
