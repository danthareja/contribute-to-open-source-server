const sinon = require('sinon');
const { expect } = require('chai');

describe('lib/github', () => {
  it('should import without errors', () => {
    expect(() => {
      require('../../src/lib/github');
    }).to.not.throw();
  });
});
