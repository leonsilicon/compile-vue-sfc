import { program } from 'commander';

import { compileVueSFC } from '~/utils/compile.js';

program
	.showHelpAfterError()
	.name('compile-vue-sfc')
	.argument('<files>', 'a list of file globs to Vue SFC files')
	.option('--declarations', 'generate TypeScript declarations')
	.parse();

const files = program.args[0]!;
const options = program.opts<{ declarations?: boolean }>();

await compileVueSFC({
	files,
	write: true,
	declarations: options.declarations,
});
