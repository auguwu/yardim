var is = require('../');
var assert = require('assert');

describe("Not thirteen tests", function() {

  it("should check for exact-ness of not 13", function() {
    assert(is(10).not.thirteen());
    assert(is(12.9).not.thirteen());
    assert(is(13.1).not.thirteen());
    assert(is(13).not.thirteen() === false);
  });

  it("should not be roughly 13", function() {
    assert(is(5).not.roughly.thirteen());
    assert(is(13.4).not.roughly.thirteen() === false);
    assert(is(12.6).not.roughly.thirteen() === false);
    assert(is(13).not.roughly.thirteen() === false);
  });

  it("should not be within 13", function() {
    assert(is(1).not.within(3).of.thirteen());
    assert(is(5).not.within(12).of.thirteen() === false);
    assert(is(10.5).not.within(3).of.thirteen() === false);
  });

  it('should show that no number is better than 12 except itself', function() {
    assert(is(13).not.betterThanTwelve());
  });

  it('should cause a collapse of the known universe if you pass 12 here..', function() {
    try {
      is(12).not.betterThanTwelve();
      assert(false, 'Should have collapsed the known universe with 12');
    } catch(e) {
      assert(true);
    }

    try {
      is('12').not.betterThanTwelve();
      assert(false, 'Should have collapsed the known universe with "12"');
    } catch(e) {
      assert(true);
    }
  });

});