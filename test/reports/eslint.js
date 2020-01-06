const sinon = require('sinon');
const { expect } = require('chai');

describe('reports/eslint', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/reports/eslint');
    }).to.not.throw();
  });
});
