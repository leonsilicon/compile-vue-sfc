# compile-vue-sfc

A utility function for compiling a Vue SFC into a JavaScript file and an optional TypeScript declarations file.

## Installation

```shell
npm install compile-vue-sfc
```

## How it Works

### TypeScript Definitions

TypeScript definitions are generated with `vue-tsc`. However, TypeScript unfortunately doesn't support specifying individual files for compilation in combination with a `tsconfig.json` file. Thus, in order to work around this limitation, a temporary `tsconfig.json` file needs to be created specifying the `.vue` file explicitly within an extra `includes` property.

However, for an unknown reason, whenever multiple `.vue` files are specified, `vue-tsc` encounters an infinite loop and never exits. Thus, a separate `tsconfig.json` must be made for each file that needs to be compiled with `vue-tsc`.

Unfortunately, creating a temporary `tsconfig.json` for each file significantly bloats the workspace and isn't ideal. In addition, `vue-tsc`