'use strict';
const isNegative = require('is-negative');

module.exports = function (n) {
	return !isNegative(n);
};
