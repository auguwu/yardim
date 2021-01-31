var is = require('is-thirteen');

module.exports = function(x) {
  var isIt = is(x);
  isIt.not = {
    thirteen: function() { return !isIt.thirteen(); },
    roughly: {
      thirteen: function() { return !isIt.roughly.thirteen(); }
    },
    within: function(y) {
      return {
        of: {
          thirteen: function() {
            return !isIt.within(y).of.thirteen();
          }
        }
      }
    },
    // Always return true unless it's 12 since that will cause
    // a collapse of the known universe
    betterThanTwelve: function() {
      if(x == 12) {
        throw new Error('Thanks for collapsing the known universe.');
      }
      return true;
    }
  };

  return isIt;
};
