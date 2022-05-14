/// <reference types="node" />
import type { NotificationsOptions } from '~/types/notification.js';
declare const _default: import("vue").DefineComponent<__VLS_TypePropsToRuntimeProps<{
    group?: string | undefined;
    width?: string | number | undefined;
    reverse?: boolean | undefined;
    position?: string | string[] | undefined;
    classes?: string | undefined;
    animationName?: string | undefined;
    speed?: number | undefined;
    cooldown?: number | undefined;
    duration?: number | undefined;
    delay?: number | undefined;
    max?: number | undefined;
    ignoreDuplicates?: boolean | undefined;
    closeOnClick?: boolean | undefined;
    pauseOnHover?: boolean | undefined;
}>, {
    addItem: (event?: NotificationsOptions) => void;
    list: (Pick<NotificationsOptions, "id" | "title" | "text" | "type" | "speed" | "data"> & {
        length: number;
    } & {
        timer?: NodeJS.Timeout | undefined;
    } & {
        state: 0 | 2;
    })[];
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    click: (item: Pick<NotificationsOptions, "id" | "title" | "text" | "type" | "speed" | "data"> & {
        length: number;
    } & {
        timer?: NodeJS.Timeout | undefined;
    } & {
        state: 0 | 2;
    }) => void;
} & {
    destroy: (item: Pick<NotificationsOptions, "id" | "title" | "text" | "type" | "speed" | "data"> & {
        length: number;
    } & {
        timer?: NodeJS.Timeout | undefined;
    } & {
        state: 0 | 2;
    }) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    group?: string | undefined;
    width?: string | number | undefined;
    reverse?: boolean | undefined;
    position?: string | string[] | undefined;
    classes?: string | undefined;
    animationName?: string | undefined;
    speed?: number | undefined;
    cooldown?: number | undefined;
    duration?: number | undefined;
    delay?: number | undefined;
    max?: number | undefined;
    ignoreDuplicates?: boolean | undefined;
    closeOnClick?: boolean | undefined;
    pauseOnHover?: boolean | undefined;
}>>> & {
    onClick?: ((item: Pick<NotificationsOptions, "id" | "title" | "text" | "type" | "speed" | "data"> & {
        length: number;
    } & {
        timer?: NodeJS.Timeout | undefined;
    } & {
        state: 0 | 2;
    }) => any) | undefined;
    onDestroy?: ((item: Pick<NotificationsOptions, "id" | "title" | "text" | "type" | "speed" | "data"> & {
        length: number;
    } & {
        timer?: NodeJS.Timeout | undefined;
    } & {
        state: 0 | 2;
    }) => any) | undefined;
}, {}>;
export default _default;
declare type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
declare type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};