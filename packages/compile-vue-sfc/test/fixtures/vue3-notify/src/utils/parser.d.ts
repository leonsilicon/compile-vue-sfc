export declare type ValueType = {
    type: string;
    value: number | string;
};
export declare const parseNumericValue: (value: number | string) => ValueType;
