/**
Check if a number is [negative zero](https://en.wikipedia.org/wiki/Signed_zero).

@example
```
import negativeZero = require('negative-zero');

negativeZero(-0);
//=> true

negativeZero(0);
//=> false

negativeZero(+0);
//=> false
```
*/
declare function negativeZero(number: number): boolean;

export = negativeZero;
