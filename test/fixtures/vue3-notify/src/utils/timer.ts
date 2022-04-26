import type { NotificationItemWithTimer } from '~/types/notification.js';

export class Timer {
	private start!: number;
	private remaining: number;
	private notifyItem: NotificationItemWithTimer;
	private readonly callback: () => void;

	constructor(
		callback: () => void,
		delay: number,
		notifItem: NotificationItemWithTimer
	) {
		this.remaining = delay;
		this.callback = callback;
		this.notifyItem = notifItem;
		this.resume();
	}

	pause(): void {
		if (this.notifyItem.timer !== undefined) {
			clearTimeout(this.notifyItem.timer);
		}

		this.remaining -= Date.now() - this.start;
	}

	resume(): void {
		this.start = Date.now();
		if (this.notifyItem.timer !== undefined) {
			clearTimeout(this.notifyItem.timer);
		}

		this.notifyItem.timer = setTimeout(this.callback, this.remaining);
	}
}
