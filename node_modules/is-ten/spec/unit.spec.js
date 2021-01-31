/**
 * Unit tests for the is 10 module
 */

const isTen = require('../')


describe('is 10', () => {
    it('should return true for all', () => {
        expect(isTen(10)).toEqual(true);
        expect(isTen(10.0)).toEqual(true);
    });

    it('should return false for all', () => {
        const notTen = [
            'bill murray',
            2,
        ]
        // TODO: think of some other things that aren't 10
        notTen.forEach(x => {
            expect(isTen(x)).toEqual(false)
        });
    });
});

