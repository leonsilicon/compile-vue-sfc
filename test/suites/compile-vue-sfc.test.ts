import lionFixture from 'lion-fixture';
import * as fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

import { compileVueSFC } from '~/index.js';

const { fixture, tempDir } = lionFixture(import.meta.url);

beforeAll(() => {
	fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('works with vue3-notify/', () => {
	test('works with declarations', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-declarations'
		);

		const { declarations, outputChunks } = await compileVueSFC({
			declarations: true,
			files: [path.join(vue3NotifyTempDir, 'src/**/*.vue')],
		});
		expect(declarations).toMatchSnapshot();
		expect(outputChunks).toMatchSnapshot();
	});

	test('works without declarations', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-no-declarations'
		);

		const payload = await compileVueSFC({
			declarations: false,
			files: [path.join(vue3NotifyTempDir, '**/*.vue')],
		});
		expect((payload as any).declarations).toBe(undefined);
		expect(payload.outputChunks).toMatchSnapshot();
	});
});
