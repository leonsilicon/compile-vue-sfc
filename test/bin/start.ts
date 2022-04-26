import { join } from 'desm';

import { compileVueSFC } from '~/index.js';

process.chdir(join(import.meta.url, '../fixtures/vue3-notify'));
await compileVueSFC({
	files: join(import.meta.url, '../fixtures/vue3-notify/src/**/*.vue'),
	tsconfigPath: join(import.meta.url, '../fixtures/vue3-notify/tsconfig.json')
});
