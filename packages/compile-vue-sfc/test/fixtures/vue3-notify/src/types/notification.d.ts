/// <reference types="node" />
export interface NotificationsOptions {
    id?: number;
    title?: string;
    text?: string;
    type?: string;
    group?: string;
    duration?: number;
    speed?: number;
    data?: unknown;
    clear?: boolean;
    ignoreDuplicates?: boolean;
}
export declare type NotificationItem = Pick<NotificationsOptions, 'id' | 'title' | 'text' | 'type' | 'speed' | 'data'> & {
    length: number;
};
export declare type NotificationItemWithTimer = NotificationItem & {
    timer?: NodeJS.Timeout;
};
