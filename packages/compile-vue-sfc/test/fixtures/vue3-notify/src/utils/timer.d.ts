import type { NotificationItemWithTimer } from '~/types/notification.js';
export declare class Timer {
    private start;
    private remaining;
    private notifyItem;
    private readonly callback;
    constructor(callback: () => void, delay: number, notifItem: NotificationItemWithTimer);
    pause(): void;
    resume(): void;
}
