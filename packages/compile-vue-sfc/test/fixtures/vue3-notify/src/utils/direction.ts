import is from '@sindresorhus/is';

import type { Direction } from '~/types/direction.js';

/**
	Splits space/tab separated string into array and cleans empty string items.
*/
export const splitWhitespace = (value: unknown): string[] => {
	if (typeof value !== 'string') {
		return [];
	}

	return value
		.split(/\s+/gi)
		.filter((part) => is.nonEmptyStringAndNotWhitespace(part));
};

const directions = {
	x: ['left', 'center', 'right'],
	y: ['top', 'bottom'],
};

/**
	Cleans and transforms string of format "x y" into object {x, y}.
	Possible combinations:
		x - left, center, right
		y - top, bottom
*/
export const listToDirection = (value: string | string[]): Direction => {
	if (typeof value === 'string') {
		value = splitWhitespace(value);
	}

	let x = null;
	let y = null;

	for (const v of value) {
		if (directions.y.includes(v)) {
			y = v;
		}

		if (directions.x.includes(v)) {
			x = v;
		}
	}

	return { x, y };
};
