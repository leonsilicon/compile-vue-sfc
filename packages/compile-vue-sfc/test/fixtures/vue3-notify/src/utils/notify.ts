import type { NotificationsOptions } from '~/types/notification';

import { emitter } from './events.js';

export const notify = (args: NotificationsOptions | string): void => {
	if (typeof args === 'string') {
		args = { title: '', text: args };
	}

	if (typeof args === 'object') {
		emitter.emit('add', args);
	}
};

notify.close = function (id: unknown): void {
	emitter.emit('close', id);
};
