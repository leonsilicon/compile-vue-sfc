import lionFixture from 'lion-fixture';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { compileVueSFC } from '~/index.js';

const { fixture } = lionFixture(import.meta.url);

describe('works with vue3-notify/', () => {
	test('works with declarations', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-declarations'
		);

		const { declarations, outputChunks } = await compileVueSFC({
			declarations: true,
			write: true,
			files: [path.join(vue3NotifyTempDir, 'src/**/*.vue')],
		});
		expect(declarations).toMatchSnapshot();
		expect(outputChunks.map((chunk) => chunk.code)).toMatchSnapshot();
	});

	test('works with outDir', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-outdir'
		);

		const { declarations, outputChunks } = await compileVueSFC({
			declarations: true,
			outDir: 'dist',
			files: [path.join(vue3NotifyTempDir, 'src/**/*.vue')],
		});
		expect(declarations).toMatchSnapshot();
		expect(outputChunks.map((chunk) => chunk.code)).toMatchSnapshot();
	});

	test('works without declarations', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-no-declarations'
		);

		const payload = await compileVueSFC({
			declarations: false,
			write: true,
			files: [path.join(vue3NotifyTempDir, '**/*.vue')],
		});
		expect((payload as any).declarations).toBe(undefined);
		expect(payload.outputChunks.map((chunk) => chunk.code)).toMatchSnapshot();
	});

	test('works without declarations and outDir', async () => {
		const vue3NotifyTempDir = await fixture(
			'vue3-notify',
			'vue3-notify-no-declarations'
		);

		const payload = await compileVueSFC({
			declarations: false,
			outDir: 'dist',
			files: [path.join(vue3NotifyTempDir, '**/*.vue')],
		});
		expect((payload as any).declarations).toBe(undefined);
		expect(payload.outputChunks.map((chunk) => chunk.code)).toMatchSnapshot();
	});
});
