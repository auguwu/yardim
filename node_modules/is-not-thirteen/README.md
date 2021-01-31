![NOT 13](http://i.imgur.com/kJujcci.png "NOT 13")


This is the inverse off the popular [is-thirteen](https://github.com/jezen/is-thirteen) library. Though make no mistake,
on this side of the line we favor __non thirteen__ numbers and believe that 12 is the new 13.


### Usage

```javascript
var is = require('is-not-thirteen');

// This adopts the DSL from the is-thirteen lib but
// adds a "not" operation
is(12).not.thirteen(); // true
is(12).not.roughly.thirteen(); // true
is(1).not.within(10).of.thirteen(); // true
```

#### The most important API function

```javascript
// Check to see if a given number is not better than twelve
is(13).not.betterThanTwelve(); // true
is(10).not.betterThanTwelve(); // true
is(12).not.betterThanTwelve(); // DONT DO THIS, will collapse the universe
```