declare type EventType = {
    add: NotificationOptions;
    close: unknown;
};
export declare const emitter: import("mitt").Emitter<EventType>;
export {};
