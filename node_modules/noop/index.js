var provide = provide || function () {};
function getGlobal () {
  return this;
}
(function () {
  "use strict";

  var global = getGlobal();

  function noop() {
    // do nothing
  }

  function throwop(err) {
    if (err) {
      throw err;
    }
  }

  function doop(cb, args, context) {
    if('function' === typeof cb) {
      return cb.apply(context, args);
    }
  }

  global.noop = noop;
  global.throwop = throwop;
  global.doop = doop;
  
  provide('noop');
}());
