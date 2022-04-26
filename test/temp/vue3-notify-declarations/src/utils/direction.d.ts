import type { Direction } from '~/types/direction.js';
/**
    Splits space/tab separated string into array and cleans empty string items.
*/
export declare const splitWhitespace: (value: unknown) => string[];
/**
    Cleans and transforms string of format "x y" into object {x, y}.
    Possible combinations:
        x - left, center, right
        y - top, bottom
*/
export declare const listToDirection: (value: string | string[]) => Direction;
