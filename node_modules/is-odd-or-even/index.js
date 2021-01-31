'use strict';

var isOdd = require('is-odd');

var isEven = require('is-even');

module.exports = function isOddOrEven(i) {
  return isOdd(i) || isEven(i);
};
