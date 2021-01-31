(function(global) {
  "use strict";

  var is0 = {};

  // is a 0?
  is0.isZero = function(x) {
    return x === 0;
  };

  // is a +0?
  is0.isPositiveZero = function(x) {
    return x === 0 && new Uint8Array(new Float32Array([ x ]).buffer)[3] === 0x00;
  };

  // is a -0?
  is0.isNegativeZero = function(x) {
    return x === 0 && new Uint8Array(new Float32Array([ x ]).buffer)[3] === 0x80;
  };

  // exports
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    module.exports = is0;
  } else if (typeof define === "function" && define.amd) {
    define(function() {
      return is0;
    });
  } else {
    global.is0 = is0;
  }

})(this.window || this.self || global);
