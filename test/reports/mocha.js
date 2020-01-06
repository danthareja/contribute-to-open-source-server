const sinon = require('sinon');
const { expect } = require('chai');

describe('reports/mocha', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/reports/mocha');
    }).to.not.throw();
  });
});
