# compile-vue-sfc

[![npm version](https://img.shields.io/npm/v/compile-vue-sfc)](https://npmjs.com/package/compile-vue-sfc)

A utility function for compiling a Vue SFC into a JavaScript file and an optional TypeScript declarations file.

## Installation

```shell
npm install compile-vue-sfc
```

## Usage

### CLI

```shell
compile-vue-sfc ./src/components/*.vue
```

With TypeScript declarations:

```shell
compile-vue-sfc --declarations ./src/components/*.vue
```

### Programmatic Usage

Import `compileVueSFC` into your project and call it:

```typescript
import { compileVueSFC } from 'compile-vue-sfc';

await compileVueSFC({
  declarations: true,
  outDir: 'dist',
  files: globbySync(['./src/spinners/*.vue']),
  projectRootPath: join(import.meta.url, '../src'),
});
```

## How it Works

### TypeScript Definitions

TypeScript definitions are generated with `vue-tsc`. However, TypeScript unfortunately doesn't support specifying individual files for compilation in combination with a `tsconfig.json` file. Thus, in order to work around this limitation, a temporary `tsconfig.json` file needs to be created specifying the `.vue` file explicitly within an extra `includes` property. But, creating a temporary `tsconfig.json` on disk is slow and error-prone, so instead, we call a wrapper script which overrides `fs.readFileSync` to provide a "virtual" `tsconfig.json` file with the appropriate before it invokes `vue-tsc`.

Unfortunately, for an unknown reason, whenever multiple `.vue` files are specified, `vue-tsc` encounters an infinite loop and never exits. Thus, each Vue SFC needs to be compiled separately (if there is a solution to this, please let me know!)

In addition, since TypeScript doesn't provide a way to export declarations via standard out, we also have to monkey-patch `fs.writeSync` to save the declaration output to a temporary variable before outputting it from our wrapper script.
