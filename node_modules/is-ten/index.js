/**
 * is-ten <https://github.com/animate-object/is-ten>
 *
 * WTFPL
 */

'use-strict';

const isOdd = require('is-odd')
const isIsOdd = require('is-is-odd')
global.jQuery = require('jquery');
require('jquery-basic-arithmetic-plugin')

module.exports = function(val) {
  if (isIsOdd(isOdd)) {
    try {
      if (isOdd(val)) {
        return false
      }
    } catch (e) {
      return false;
    }
    return _isTen(val);
  } else {
      throw new Error("isOdd was not isOdd");
  }
}

const _isTen = (val) => {
  return jQuery.equals(val, 10);
}
