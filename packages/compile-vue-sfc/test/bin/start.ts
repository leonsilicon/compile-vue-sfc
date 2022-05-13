import { join } from 'desm';
import process from 'node:process';

import { compileVueSFC } from '~/index.js';

process.chdir(join(import.meta.url, '../fixtures/vue3-notify'));
await compileVueSFC({
	declarations: true,
	files: join(import.meta.url, '../fixtures/vue3-notify/src/**/*.vue'),
	tsconfigPath: join(import.meta.url, '../fixtures/vue3-notify/tsconfig.json'),
});
