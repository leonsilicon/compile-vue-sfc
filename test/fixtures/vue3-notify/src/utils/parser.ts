const floatRegexp = '[-+]?[0-9]*.?[0-9]+';

export type ValueType = {
	type: string;
	value: number | string;
};

const types = [
	{
		name: 'px',
		regexp: new RegExp(`^${floatRegexp}px$`),
	},
	{
		name: '%',
		regexp: new RegExp(`^${floatRegexp}%$`),
	},
	/**
	 * Fallback option
	 * If no suffix specified, assigning "px"
	 */
	{
		name: 'px',
		regexp: new RegExp(`^${floatRegexp}$`),
	},
];

const getType = (value: string): ValueType => {
	if (value === 'auto') {
		return {
			type: value,
			value: 0,
		};
	}

	for (const type of types) {
		if (type.regexp.test(value)) {
			return {
				type: type.name,
				value: Number.parseFloat(value),
			};
		}
	}

	return {
		type: '',
		value,
	};
};

export const parseNumericValue = (value: number | string) => {
	switch (typeof value) {
		case 'number':
			return { type: 'px', value };
		case 'string':
			return getType(value);
		default:
			return { type: '', value };
	}
};
