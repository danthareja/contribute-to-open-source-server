const sinon = require('sinon');
const { expect } = require('chai');

describe('lib/parseDiff', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/lib/parseDiff');
    }).to.not.throw();
  });
});
