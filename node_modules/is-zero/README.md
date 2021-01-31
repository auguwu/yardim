# is-zero
[![Build Status](https://img.shields.io/travis/mohayonao/is-zero.svg?style=flat-square)](https://travis-ci.org/mohayonao/is-zero)
[![NPM Version](https://img.shields.io/npm/v/is-zero.svg?style=flat-square)](https://www.npmjs.org/package/is-zero)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://mohayonao.mit-license.org/)
> is ±0 ?

## Installation

```
$ npm install is-zero
```

## API

- `is0.isZero(x: number): boolean`
- `is0.isPositiveZero(x: number): boolean`
- `is0.isNegativeZero(x: number): boolean`

## Example

```js
var is0 = require("is-zero");

console.log(is0.isZero(+0)); // => true
console.log(is0.isZero(-0)); // => true
console.log(is0.isPositiveZero(+0)); // => true
console.log(is0.isPositiveZero(-0)); // => false
console.log(is0.isNegativeZero(+0)); // => false
console.log(is0.isNegativeZero(-0)); // => true
```

## License
MIT
