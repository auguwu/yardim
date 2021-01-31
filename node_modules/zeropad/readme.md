# zeropad

> Zeropad your integers with optional n-length padding.

[![Build Status](https://travis-ci.org/radiovisual/zeropad.svg)](https://travis-ci.org/radiovisual/zeropad)

The default is to give you classic padding behavior where numbers less than 10 are padded with a single zero:  
  `'9' → '09'`, but you can optionally pad to any length, for example: `'9' → '0009'`.
  
**Note:** Since version `1.1.0` you can also pad negative numbers.
 
## Install

```
$ npm install --save zeropad
```

## Usage

```js
var zeropad = require('zeropad');

zeropad(5);
// => '05'

zeropad(10, 4);
// => '0010'

zeropad('11', 4);
// => '0011'

zeropad(4, 10);
// => '0000000004');

zeropad(9, 4);
// => '0009');

zeropad(-9, 4);
// => '-0009');
```

## API

### zeropad(number, [length])

### number 

*Required*  
Type: `Number` `String`

The number you want to pad.

### length

Type: `Number`  
Default: `2`

The length you want to pad to. The default is `2`, which emulates classic padding behavior.


## Related

- [simple-zeropad](https://github.com/radiovisual/simple-zeropad) Classic number padding (no length options)


## License

MIT @ [Michael Wuergler](http://numetriclabs.com)